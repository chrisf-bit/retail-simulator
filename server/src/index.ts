import http from "node:http";
import express from "express";
import cors from "cors";
import { Server as IOServer } from "socket.io";
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

function broadcastSession(sessionId: string) {
  const session = store.get(sessionId);
  if (!session) return;
  io.to(`session:${sessionId}`).emit("session:state", session.publicState());
}

io.on("connection", (socket) => {
  socket.on("session:create", (payload: { expectedTeams?: number } = {}) => {
    const session = store.create((id) => broadcastSession(id), payload?.expectedTeams);
    socket.join(`session:${session.id}`);
    socket.data.role = "facilitator";
    socket.data.sessionId = session.id;
    socket.emit("session:created", { sessionId: session.id, code: session.code });
    socket.emit("session:state", session.publicState());
  });

  socket.on("facilitator:join", ({ sessionId }: { sessionId: string }) => {
    const session = store.get(sessionId);
    if (!session) return socket.emit("error", { message: "Session not found" });
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
    socket.emit("session:state", session.publicState());
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
    socket.emit("session:state", session.publicState());
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
      session.submitDecision(teamId, decision);
    },
  );
});

server.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
