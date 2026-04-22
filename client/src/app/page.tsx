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
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white to-ink-100 p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center gap-2 text-ink-700">
          <Activity className="h-5 w-5 text-brand-600" />
          <span className="text-sm font-semibold tracking-tight">Retail Leadership Simulation</span>
        </div>

        <h1 className="mb-2 text-4xl font-semibold tracking-tight text-ink-900">Run a live session</h1>
        <p className="mb-10 max-w-2xl text-base text-ink-600">
          Multi-team, time-boxed decisions across six shifts. Facilitators control the session and observe all teams;
          teams share a laptop and make decisions under pressure.
        </p>

        {mode === "choose" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-ink-900">Facilitator</h2>
              </div>
              <p className="mb-5 text-sm text-ink-600">
                Create a session, share the code with teams, and control round flow and disruptions.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink-600">
                  Number of teams
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustTeams(-1)}
                    disabled={expectedTeams <= MIN_TEAMS}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink-200 bg-white text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40",
                    )}
                    aria-label="Decrease team count"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-2">
                    <Users className="h-4 w-4 text-brand-700" />
                    <span className="font-mono text-2xl font-bold text-brand-900 tabular-nums">{expectedTeams}</span>
                    <span className="text-xs text-brand-700">teams</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => adjustTeams(+1)}
                    disabled={expectedTeams >= MAX_TEAMS}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink-200 bg-white text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40",
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

              <Button size="lg" onClick={createFacilitator} disabled={submitting}>
                Create session
              </Button>
            </Card>

            <Card className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-ink-900">Team</h2>
              </div>
              <p className="mb-5 text-sm text-ink-600">
                Join an active session using the code your facilitator shared.
              </p>
              <Button size="lg" variant="secondary" onClick={() => setMode("team")}>
                Join a session
              </Button>
            </Card>
          </div>
        ) : (
          <Card className="mx-auto max-w-lg p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-ink-900">Join as a team</h2>
            </div>
            <form onSubmit={joinTeam} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-600">
                  Session code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K2N"
                  maxLength={5}
                  className="w-full rounded-lg border-2 border-ink-200 bg-white px-3 py-2 text-lg font-mono uppercase tracking-widest text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-600">Team name</label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. North Store"
                  maxLength={32}
                  className="w-full rounded-lg border-2 border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  {error}
                </p>
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
