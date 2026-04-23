import http from "node:http";
import express from "express";
import cors from "cors";
import { Server as IOServer } from "socket.io";
import { CONNECTION_TICK_MS } from "@sim/shared";
import { SessionStore } from "./engine/session.js";

const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: CLIENT_ORIGIN },
});

const store = new SessionStore();

// Broadcast session state to every socket in the session room.
// Each socket gets the shape appropriate to its role:
// - facilitator sockets get the full publicState (all team data, insights, prompts)
// - team sockets get a redacted teamState scoped to their own teamId, so they
//   can never read other teams' decisions, trends or coaching content off the wire.
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

setInterval(() => {
  for (const session of store.all()) {
    session.refreshConnectionStatuses();
  }
}, CONNECTION_TICK_MS);

io.on("connection", (socket) => {
  socket.on("session:create", (payload: { expectedTeams?: number } = {}) => {
    const session = store.create((id) => broadcastSession(id), payload?.expectedTeams);
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

  socket.on("facilitator:join", ({ sessionId, token }: { sessionId: string; token?: string }) => {
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

  socket.on("session:join", ({ code, teamName }: { code: string; teamName: string }) => {
    const session = store.getByCode(code);
    if (!session) return socket.emit("error", { message: "Session code not recognised" });
    if (session.phase !== "lobby" && session.phase !== "briefing") {
      return socket.emit("error", { message: "Session has already started" });
    }
    if (session.isFull()) {
      return socket.emit("error", {
        message: `Session is full (${session.expectedTeams} team${session.expectedTeams === 1 ? "" : "s"})`,
      });
    }
    const trimmed = (teamName ?? "").trim().slice(0, 32) || "Team";
    const team = session.addTeam(trimmed);
    socket.join(`session:${session.id}`);
    socket.data.role = "team";
    socket.data.sessionId = session.id;
    socket.data.teamId = team.id;
    socket.emit("session:joined", { sessionId: session.id, teamId: team.id });
    socket.emit("session:state", session.teamState(team.id));
  });

  socket.on("session:rejoin", ({ sessionId, teamId }: { sessionId: string; teamId: string }) => {
    const session = store.get(sessionId);
    if (!session || !session.teams.has(teamId)) {
      return socket.emit("error", { message: "Unable to rejoin" });
    }
    socket.join(`session:${session.id}`);
    socket.data.role = "team";
    socket.data.sessionId = session.id;
    socket.data.teamId = teamId;
    session.touchTeam(teamId);
    socket.emit("session:state", session.teamState(teamId));
  });

  socket.on("facilitator:start_briefing", ({ sessionId }) => store.get(sessionId)?.startBriefing());
  socket.on("facilitator:start_round", ({ sessionId }) => store.get(sessionId)?.startRound());
  socket.on("facilitator:end_round", ({ sessionId }) => store.get(sessionId)?.endRound());
  socket.on("facilitator:trigger_disruption", ({ sessionId }) => store.get(sessionId)?.triggerDisruption());
  socket.on("facilitator:next_phase", ({ sessionId }) => store.get(sessionId)?.nextPhase());

  socket.on(
    "team:submit_decision",
    ({ sessionId, teamId, decision }: { sessionId: string; teamId: string; decision: any }) => {
      const session = store.get(sessionId);
      if (!session) return;
      session.touchTeam(teamId);
      session.submitDecision(teamId, decision);
    },
  );

  socket.on("team:ping", ({ sessionId, teamId }: { sessionId: string; teamId: string }) => {
    const session = store.get(sessionId);
    if (!session) return;
    session.touchTeam(teamId);
  });
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
