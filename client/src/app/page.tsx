"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Minus, Monitor, Plus, Users } from "lucide-react";
import { DEFAULT_EXPECTED_TEAMS, MAX_TEAMS, MIN_TEAMS } from "@sim/shared";
import { Button, Card, cn } from "@/components/ui";
import { getSocket } from "@/lib/socket";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "team">("choose");
  const [code, setCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [expectedTeams, setExpectedTeams] = useState<number>(DEFAULT_EXPECTED_TEAMS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function createFacilitator() {
    const socket = getSocket();
    setSubmitting(true);
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith("team:")) sessionStorage.removeItem(key);
    }
    socket.once("session:created", ({ sessionId }: { sessionId: string }) => {
      router.push(`/facilitator/${sessionId}`);
    });
    socket.emit("session:create", { expectedTeams });
  }

  function joinTeam(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const socket = getSocket();
    setSubmitting(true);
    const onJoined = ({ sessionId, teamId }: { sessionId: string; teamId: string }) => {
      sessionStorage.setItem(`team:${sessionId}`, teamId);
      router.push(`/team/${sessionId}`);
    };
    const onErr = (e: { message: string }) => {
      setError(e.message);
      setSubmitting(false);
      socket.off("session:joined", onJoined);
    };
    socket.once("session:joined", onJoined);
    socket.once("error", onErr);
    socket.emit("session:join", { code: code.trim().toUpperCase(), teamName: teamName.trim() });
  }

  function adjustTeams(delta: number) {
    setExpectedTeams((n) => Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, n + delta)));
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Retail Leadership Simulation</span>
        </div>

        <h1 className="mb-2 text-4xl font-semibold tracking-tighter text-white">Run a live session</h1>
        <p className="mb-10 max-w-2xl text-base text-white/60">
          Multi-team, time-boxed decisions across six shifts. Facilitators control the session and observe all teams;
          teams share a laptop and make decisions under pressure.
        </p>

        {mode === "choose" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="flex flex-col p-6">
              <div className="mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-ink-500" />
                <h2 className="text-lg font-semibold tracking-tight text-ink-900">Facilitator</h2>
              </div>
              <p className="mb-5 text-sm text-ink-600">
                Create a session, share the code with teams, and control shift flow and disruptions.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-ink-500">
                  Number of teams
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustTeams(-1)}
                    disabled={expectedTeams <= MIN_TEAMS}
                    className={cn(
                      "press flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-800 transition-colors hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-40",
                    )}
                    aria-label="Decrease team count"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-3 py-2.5 text-white">
                    <Users className="h-4 w-4 text-brand-400" />
                    <span className="num text-xl font-semibold">{expectedTeams}</span>
                    <span className="text-xs text-white/60">teams</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustTeams(+1)}
                    disabled={expectedTeams >= MAX_TEAMS}
                    className={cn(
                      "press flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-800 transition-colors hover:bg-ink-200 disabled:cursor-not-allowed disabled:opacity-40",
                    )}
                    aria-label="Increase team count"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-ink-500">
                  Between {MIN_TEAMS} and {MAX_TEAMS}. You can still start the session before all teams have joined.
                </p>
              </div>

              <Button size="lg" onClick={createFacilitator} disabled={submitting} className="mt-auto">
                Create session
              </Button>
            </Card>

            <Card className="flex flex-col p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-ink-500" />
                <h2 className="text-lg font-semibold tracking-tight text-ink-900">Team</h2>
              </div>
              <p className="mb-5 text-sm text-ink-600">
                Join an active session using the code your facilitator shared.
              </p>
              <Button size="lg" variant="quiet" onClick={() => setMode("team")} className="mt-auto">
                Join a session
              </Button>
            </Card>
          </div>
        ) : (
          <Card className="mx-auto max-w-lg p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-ink-500" />
              <h2 className="text-lg font-semibold tracking-tight text-ink-900">Join as a team</h2>
            </div>
            <form onSubmit={joinTeam} className="space-y-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500">
                  Session code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K2N"
                  maxLength={5}
                  className="w-full rounded-xl bg-ink-100 px-3 py-2.5 text-lg font-mono uppercase tracking-widest text-ink-900 placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-500">
                  Team name
                </label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. North Store"
                  maxLength={32}
                  className="w-full rounded-xl bg-ink-100 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800">{error}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting || !code || !teamName}>
                  Join session
                </Button>
                <Button variant="ghost" onClick={() => setMode("choose")}>
                  Back
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
