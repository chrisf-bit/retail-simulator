"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionStatePublic } from "@sim/shared";
import { HEARTBEAT_INTERVAL_MS } from "@sim/shared";
import { getSocket } from "./socket";

export function useSessionState() {
  const [state, setState] = useState<SessionStatePublic | null>(null);
  const [connected, setConnected] = useState(false);
  const [offsetMs, setOffsetMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    function onState(s: SessionStatePublic) {
      setOffsetMs(s.serverNow - Date.now());
      setState(s);
    }
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onError(e: { message: string }) {
      setError(e.message);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("session:state", onState);
    socket.on("error", onError);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("session:state", onState);
      socket.off("error", onError);
    };
  }, []);

  return { state, connected, offsetMs, error, socket: socketRef.current, setError };
}

/**
 * Emit a lightweight heartbeat every HEARTBEAT_INTERVAL_MS so the server can
 * derive this team's connection status. Only runs while connected.
 */
export function useTeamHeartbeat(sessionId: string, teamId: string | null, connected: boolean): void {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (!connected || !teamId) return;
    const socket = socketRef.current;
    const emit = () => socket.emit("team:ping", { sessionId, teamId });
    emit();
    const id = setInterval(emit, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionId, teamId, connected]);
}

export function useCountdown(endsAt: number | undefined, offsetMs: number): number {
  const [now, setNow] = useState(() => Date.now() + offsetMs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offsetMs), 250);
    return () => clearInterval(id);
  }, [offsetMs]);

  if (!endsAt) return 0;
  return Math.max(0, endsAt - now);
}

export function formatClock(ms: number): string {
  // Use floor so the timer displays the integer-second floor of the remaining
  // time. With ceil, any clock skew at round start (state arrives a few ms
  // after endsAt was set on the server) showed 5:01 for the first tick.
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
