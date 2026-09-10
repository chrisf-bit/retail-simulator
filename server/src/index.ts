import http from "node:http";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { Server as IOServer, type Socket } from "socket.io";
import { CONNECTION_TICK_MS } from "@sim/shared";
import { SessionStore, type Session } from "./engine/session.js";
import { PERSISTENCE_DIR, writeSessionFileSync } from "./engine/persistence.js";
import { generateReport } from "./engine/report.js";

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Fail-closed-ish CORS: when CLIENT_ORIGIN is set (production), allow only it
// plus the local dev origins. When it is unset we fall back to permissive rather
// than lock the server out - but warn loudly so it gets set in prod.
const DEV_ORIGINS = ["http://localhost:5173", "http://localhost:5174", "http://localhost:4173"];
const corsOrigin: string | string[] = CLIENT_ORIGIN ? [CLIENT_ORIGIN, ...DEV_ORIGINS] : "*";
if (!CLIENT_ORIGIN) {
  console.warn("[cors] CLIENT_ORIGIN not set - allowing all origins. Set it in production.");
}

// Per-socket rate limit: sliding window, sized to comfortably clear heartbeats
// plus rapid interaction while still stopping a flood.
const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 5_000;
const eventTimes = new Map<string, number[]>();
function recordEvent(id: string): void {
  const now = Date.now();
  const arr = (eventTimes.get(id) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  arr.push(now);
  eventTimes.set(id, arr);
}
function isRateLimited(id: string): boolean {
  const now = Date.now();
  const arr = (eventTimes.get(id) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  eventTimes.set(id, arr);
  return arr.length > RATE_LIMIT_MAX;
}

// Cap sessions created per socket so one client cannot exhaust memory/disk.
const MAX_SESSIONS_PER_SOCKET = 20;
const createCounts = new Map<string, number>();

function hashToken(token: unknown): string | undefined {
  if (typeof token !== "string" || token.length === 0) return undefined;
  return crypto.createHash("sha256").update(token).digest("hex");
}

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: corsOrigin }));
app.use((_req, res, next) => {
  if (!res.headersSent) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // Locked-down default for the API surface (JSON + socket handshake). The
    // report route overrides this with a CSP that permits its own inline styles.
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
  }
  next();
});
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.get("/api/sessions/:sessionId/report.html", (req, res) => {
  const { sessionId } = req.params;
  const token = typeof req.query.token === "string" ? req.query.token : "";
  const session = store.get(sessionId);
  if (!session) {
    res.status(404).type("text/plain").send("Session not found.");
    return;
  }
  if (!token || token !== session.facilitatorToken) {
    res.status(401).type("text/plain").send("Not authorised.");
    return;
  }
  // The report is self-contained HTML with inline <style> and inline SVG only
  // (no scripts, no remote assets), so this CSP renders it while blocking script
  // execution and any external fetches.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'",
  );
  const html = generateReport(session);
  res.type("text/html").send(html);
});

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: corsOrigin },
  maxHttpBufferSize: 1e6, // 1MB: refuse oversized frames before a handler runs
});

function broadcastSession(sessionId: string) {
  const session = store.get(sessionId);
  if (!session) return;
  const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
  if (!room) return;
  for (const socketId of room) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) continue;
    if (sock.data.role === "facilitator") {
      sock.emit("session:state", session.publicState());
    } else if (sock.data.role === "team" && typeof sock.data.teamId === "string") {
      sock.emit("session:state", session.teamState(sock.data.teamId));
    }
  }
}

const store = new SessionStore(broadcastSession);

await store.hydrate();
console.log(`[persistence] using directory ${PERSISTENCE_DIR}`);

setInterval(() => {
  for (const session of store.all()) {
    session.refreshConnectionStatuses();
  }
}, CONNECTION_TICK_MS);

setInterval(() => {
  store.cleanup().catch((err) => console.warn("[persistence] cleanup failed:", err));
}, CLEANUP_INTERVAL_MS);

// A facilitator-only event must come from the socket that authenticated as the
// facilitator for THIS session (facilitator:join / session:create set the role
// after verifying the token). Any other socket - including a team who knows the
// session id from its own URL - is rejected.
function requireFacilitator(socket: Socket, sessionId: unknown): Session | null {
  if (typeof sessionId !== "string") return null;
  if (socket.data.role !== "facilitator" || socket.data.sessionId !== sessionId) {
    socket.emit("error", { message: "Not authorised" });
    return null;
  }
  return store.get(sessionId) ?? null;
}

// A team-only event must come from that team's own socket.
function requireTeamOwner(socket: Socket, sessionId: unknown, teamId: unknown): Session | null {
  if (typeof sessionId !== "string" || typeof teamId !== "string") return null;
  if (
    socket.data.role !== "team" ||
    socket.data.sessionId !== sessionId ||
    socket.data.teamId !== teamId
  ) {
    return null;
  }
  return store.get(sessionId) ?? null;
}

io.on("connection", (socket) => {
  // Every handler is registered through this wrapper so it gets the rate-limit
  // check and a try/catch. An unguarded throw in a socket handler would
  // otherwise crash the whole process and drop every live game.
  const on = (event: string, handler: (...args: any[]) => void) => {
    socket.on(event, (...args: any[]) => {
      recordEvent(socket.id);
      if (isRateLimited(socket.id)) return;
      try {
        handler(...args);
      } catch (err) {
        console.warn(`[socket] handler '${event}' threw:`, err);
      }
    });
  };

  on("session:create", (payload: { expectedTeams?: number } = {}) => {
    const count = createCounts.get(socket.id) ?? 0;
    if (count >= MAX_SESSIONS_PER_SOCKET) {
      return socket.emit("error", { message: "Too many sessions created" });
    }
    createCounts.set(socket.id, count + 1);
    const session = store.create(payload?.expectedTeams);
    socket.join(`session:${session.id}`);
    socket.data.role = "facilitator";
    socket.data.sessionId = session.id;
    socket.emit("session:created", {
      sessionId: session.id,
      code: session.code,
      facilitatorToken: session.facilitatorToken,
    });
    socket.emit("session:state", session.publicState());
  });

  on("facilitator:join", ({ sessionId, token }: { sessionId: string; token?: string }) => {
    const session = store.get(sessionId);
    if (!session) return socket.emit("error", { message: "Session not found" });
    if (!token || token !== session.facilitatorToken) {
      return socket.emit("error", { message: "Not authorised" });
    }
    socket.join(`session:${session.id}`);
    socket.data.role = "facilitator";
    socket.data.sessionId = session.id;
    socket.emit("session:state", session.publicState());
  });

  on("session:join", ({ code, teamName }: { code: string; teamName: string }) => {
    const session = store.getByCode(typeof code === "string" ? code : "");
    if (!session) return socket.emit("error", { message: "Session code not recognised" });
    if (session.phase !== "lobby" && session.phase !== "briefing") {
      return socket.emit("error", { message: "Session has already started" });
    }
    if (session.isFull()) {
      return socket.emit("error", {
        message: `Session is full (${session.expectedTeams} team${session.expectedTeams === 1 ? "" : "s"})`,
      });
    }
    const trimmed = (typeof teamName === "string" ? teamName : "").trim().slice(0, 32) || "Team";
    // Mint a per-team session token; store only its hash, return the raw token
    // once so the client can prove ownership on rejoin.
    const token = crypto.randomBytes(24).toString("hex");
    const team = session.addTeam(trimmed, hashToken(token));
    socket.join(`session:${session.id}`);
    socket.data.role = "team";
    socket.data.sessionId = session.id;
    socket.data.teamId = team.id;
    socket.emit("session:joined", { sessionId: session.id, teamId: team.id, token });
    socket.emit("session:state", session.teamState(team.id));
  });

  on("session:rejoin", ({ sessionId, teamId, token }: { sessionId: string; teamId: string; token?: string }) => {
    const session = store.get(sessionId);
    if (!session || !session.teams.has(teamId)) {
      return socket.emit("error", { message: "Unable to rejoin" });
    }
    if (!session.verifyTeamToken(teamId, hashToken(token))) {
      return socket.emit("error", { message: "Unable to rejoin" });
    }
    socket.join(`session:${session.id}`);
    socket.data.role = "team";
    socket.data.sessionId = session.id;
    socket.data.teamId = teamId;
    session.touchTeam(teamId);
    socket.emit("session:state", session.teamState(teamId));
  });

  on("facilitator:start_briefing", ({ sessionId }) => requireFacilitator(socket, sessionId)?.startBriefing());
  on("facilitator:start_round", ({ sessionId }) => requireFacilitator(socket, sessionId)?.startRound());
  on("facilitator:end_round", ({ sessionId }) => requireFacilitator(socket, sessionId)?.endRound());
  on("facilitator:briefing_step", ({ sessionId, step }) =>
    requireFacilitator(socket, sessionId)?.setBriefingStep(step),
  );
  on("facilitator:next_phase", ({ sessionId }) => requireFacilitator(socket, sessionId)?.nextPhase());

  on(
    "team:submit_decision",
    ({ sessionId, teamId, decision }: { sessionId: string; teamId: string; decision: unknown }) => {
      const session = requireTeamOwner(socket, sessionId, teamId);
      if (!session) return;
      session.touchTeam(teamId);
      session.submitDecision(teamId, decision);
    },
  );

  on("team:ping", ({ sessionId, teamId }: { sessionId: string; teamId: string }) => {
    const session = requireTeamOwner(socket, sessionId, teamId);
    if (!session) return;
    session.touchTeam(teamId);
  });

  socket.on("disconnect", () => {
    eventTimes.delete(socket.id);
    createCounts.delete(socket.id);
  });
});

// Last-resort backstop: keep the process (and every live session) alive if an
// error ever escapes a handler's own try/catch. Per-handler guards above are the
// real defence; this just prevents a single slip from taking the server down.
process.on("uncaughtException", (err) => console.error("[uncaughtException]", err));
process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));

// Flush any pending writes before the process exits (Render sends SIGTERM on redeploy).
function flushAndExit(code: number) {
  let flushed = 0;
  for (const session of store.all()) {
    if (session.hasPendingWrite()) {
      session.cancelPendingWrite();
      try {
        writeSessionFileSync(session.id, session.toJSON());
        flushed++;
      } catch (err) {
        console.warn(`[persistence] sync flush failed for ${session.id}:`, err);
      }
    }
  }
  if (flushed > 0) console.log(`[persistence] flushed ${flushed} session(s) on shutdown`);
  process.exit(code);
}

process.on("SIGTERM", () => flushAndExit(0));
process.on("SIGINT", () => flushAndExit(0));

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
