"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Monitor, Plus, Store, Users } from "lucide-react";
import { DEFAULT_EXPECTED_TEAMS, MAX_TEAMS, MIN_TEAMS } from "@sim/shared";
import { Button, Card, cn } from "@/components/ui";
import { getSocket } from "@/lib/socket";
import { enterFullscreen } from "@/lib/fullscreen";

export default function LandingPage() {
  const router = useRouter();
  const [launched, setLaunched] = useState(false);
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
    socket.once(
      "session:created",
      ({ sessionId, facilitatorToken }: { sessionId: string; facilitatorToken: string }) => {
        sessionStorage.setItem(`facilitator:${sessionId}`, facilitatorToken);
        router.push(`/facilitator/${sessionId}?t=${facilitatorToken}`);
      },
    );
    socket.emit("session:create", { expectedTeams });
    // Fullscreen is fire-and-forget; deferred so any browser refusal can't
    // interrupt the synchronous emit + navigate flow.
    setTimeout(() => enterFullscreen(), 0);
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
    setTimeout(() => enterFullscreen(), 0);
  }

  function adjustTeams(delta: number) {
    setExpectedTeams((n) => Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, n + delta)));
  }

  if (!launched) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        {/* Full-bleed splash: the aisle before the storm */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/splash.png)" }}
          aria-hidden
        />
        {/* Scrim: darken the top ceiling void where the copy sits and lift the
            very bottom for the button, leaving the figure and aisles clear. */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-base via-surface-base/40 via-35% to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface-base to-transparent"
          aria-hidden
        />

        {/* One grouped block, sitting in the void above the figure's head. */}
        <div className="relative z-10 flex h-full w-full flex-col items-center px-6 pt-[14vh] text-center">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
              <Store className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wide text-white/80">
              Plumfield Stores
            </span>
          </div>

          <h1 className="mb-4 max-w-3xl text-5xl font-semibold tracking-tighter text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)] sm:text-6xl">
            The Store Is Yours
          </h1>
          <p className="mb-2 max-w-xl text-lg text-white/80 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]">
            Four weeks to lead the people, priorities and performance.
          </p>
          <p className="mb-8 max-w-xl text-sm text-white/60 drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)]">
            A live, multi-team, head-to-head retail simulation.
          </p>

          <Button size="lg" onClick={() => setLaunched(true)} className="px-8">
            Launch simulation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Store className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">
            Plumfield Stores <span className="text-white/65">· The Store Is Yours</span>
          </span>
        </div>

        <h1 className="mb-2 text-center text-4xl font-semibold tracking-tighter text-white">Run a live session</h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-base text-white/60">
          Read the signals and make time-boxed decisions across five shifts. Facilitators control the session and observe all teams;
          teams share a laptop and make decisions under pressure.
        </p>

        {mode === "choose" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card tone="data" className="grid h-[24rem] grid-rows-[1fr_auto] gap-6 border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 shadow-panel ring-brand-500/30">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-brand-300" />
                  <h2 className="text-lg font-semibold tracking-tight text-white">Facilitator</h2>
                </div>
                <p className="text-sm text-white/60">
                  Create a session, share the code with teams, and control shift flow and disruptions.
                </p>

                <div className="mt-6">
                  <label className="mb-2 block text-[12px] font-medium uppercase tracking-wide text-white/65">
                    Number of teams
                  </label>
                  <div className="flex items-stretch gap-1 rounded-xl bg-black/30 p-1 ring-1 ring-white/10">
                    <button
                      type="button"
                      onClick={() => adjustTeams(-1)}
                      disabled={expectedTeams <= MIN_TEAMS}
                      className="press flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Decrease team count"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <div className="flex flex-1 items-center justify-center gap-2">
                      <Users className="h-4 w-4 text-brand-400" />
                      <span className="num text-xl font-semibold text-white">{expectedTeams}</span>
                      <span className="text-sm text-white/60">teams</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustTeams(+1)}
                      disabled={expectedTeams >= MAX_TEAMS}
                      className="press flex h-10 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Increase team count"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-[12px] text-white/65">
                    Between {MIN_TEAMS} and {MAX_TEAMS}. You can still start the session before all teams have joined.
                  </p>
                </div>
              </div>

              <Button size="lg" onClick={createFacilitator} disabled={submitting} className="justify-self-start self-end">
                Create session
              </Button>
            </Card>

            <Card tone="data" className="grid h-[24rem] grid-rows-[1fr_auto] gap-6 border border-white/12 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 shadow-panel ring-teal-500/25">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-300" />
                  <h2 className="text-lg font-semibold tracking-tight text-white">Team</h2>
                </div>
                <p className="text-sm text-white/60">
                  Join an active session using the code your facilitator shared.
                </p>
                <div className="mt-6 rounded-xl bg-black/30 px-4 py-3 text-xs leading-relaxed text-white/60 ring-1 ring-white/10">
                  You&apos;ll need the 5-character session code from your facilitator, plus a team name like &ldquo;North Store&rdquo;.
                </div>
              </div>

              <Button
                size="lg"
                variant="secondary"
                onClick={() => setMode("team")}
                className="justify-self-start self-end !bg-white/10 !text-white ring-1 ring-white/15 hover:!bg-white/20"
              >
                Join a session
              </Button>
            </Card>
          </div>
        ) : (
          <Card tone="data" className="mx-auto max-w-lg p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-300" />
              <h2 className="text-lg font-semibold tracking-tight text-white">Join as a team</h2>
            </div>
            <form onSubmit={joinTeam} className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium uppercase tracking-wide text-white/65">
                  Session code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K2N"
                  maxLength={5}
                  className="w-full rounded-xl bg-black/30 px-3 py-2.5 text-lg font-mono uppercase tracking-widest text-white ring-1 ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium uppercase tracking-wide text-white/65">
                  Team name
                </label>
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. North Store"
                  maxLength={32}
                  className="w-full rounded-xl bg-black/30 px-3 py-2.5 text-sm text-white ring-1 ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              {error ? (
                <p className="rounded-xl bg-rose-500/15 px-3 py-2 text-sm font-medium text-rose-200 ring-1 ring-rose-500/25">{error}</p>
              ) : null}
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting || !code || !teamName}>
                  Join session
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setMode("choose")}
                  className="!text-white/70 hover:!bg-white/10"
                >
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
