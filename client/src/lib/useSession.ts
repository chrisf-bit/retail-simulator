"use client";

import { useEffect, useRef, useState } from "react";
import type { SessionStatePublic } from "@sim/shared";
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
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
