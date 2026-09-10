"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Copy,
  Eye,
  Flag,
  HelpCircle,
  KeyRound,
  Layers,
  Loader2,
  MessageCircleQuestion,
  Minus,
  MonitorPlay,
  Play,
  PlayCircle,
  Download,
  Square,
  Trophy,
  X,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import type {
  Goal,
  SessionStatePublic,
  TeamInsight,
  TeamPublic,
} from "@sim/shared";
import { BASELINE_WEEKS, BRIEFING_STEP_COUNT, GOAL_KEYS, GOAL_SHORT, HIDDEN_INVERTED, HIDDEN_LABELS, METRICS_OF_GOAL, ROUND_COUNT } from "@sim/shared";
import { Button, Card, cn, ConnectionDot, Delta, PhaseGuide, Pill, SectionTitle, ShiftRibbon, Sparkline } from "@/components/ui";
import { TeamCrest } from "@/components/TeamCrest";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { formatClock, useCountdown, useSessionState } from "@/lib/useSession";
import { facilitatorGuidance } from "@/lib/guidance";
import { BRIEFING_STEPS } from "@/lib/briefing";

interface PrimaryAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  event: string;
}

function getPrimaryAction(state: SessionStatePublic): PrimaryAction | null {
  switch (state.phase) {
    case "lobby":
      return state.teams.length === 0
        ? null
        : { label: "Start briefing", icon: PlayCircle, event: "facilitator:start_briefing" };
    case "briefing":
      return { label: "Start Shift 1", icon: Play, event: "facilitator:start_round" };
    case "round_results": {
      const nextNumber = (state.round?.number ?? 0) + 1;
      if (nextNumber > ROUND_COUNT) return { label: "Begin debrief", icon: Flag, event: "facilitator:next_phase" };
      return { label: `Start Shift ${nextNumber}`, icon: Play, event: "facilitator:start_round" };
    }
    case "debrief":
      return { label: "Close session", icon: Flag, event: "facilitator:next_phase" };
    default:
      return null;
  }
}

export default function FacilitatorPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const searchParams = useSearchParams();
  const { state, socket, connected, offsetMs, error } = useSessionState();
  const [notAuthorised, setNotAuthorised] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = searchParams?.get("t");
    const fromStorage = sessionStorage.getItem(`facilitator:${sessionId}`);
    if (fromUrl && fromUrl !== fromStorage) {
      sessionStorage.setItem(`facilitator:${sessionId}`, fromUrl);
    }
    return fromUrl ?? fromStorage;
  }, [sessionId, searchParams]);

  useEffect(() => {
    if (!token) {
      setNotAuthorised(true);
      return;
    }
    const join = () => socket.emit("facilitator:join", { sessionId, token });
    join();
    // Re-announce on reconnect so we stay in the session room.
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
    };
  }, [sessionId, socket, token]);

  useEffect(() => {
    if (error === "Not authorised") setNotAuthorised(true);
    if (error === "Session not found") setSessionEnded(true);
  }, [error]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);

  const [recovery, setRecovery] = useState<{ teamId: string; url: string } | null>(null);
  useEffect(() => {
    const handler = ({ teamId, token }: { teamId: string; token: string }) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/team/${sessionId}?recover=${encodeURIComponent(`${teamId}.${token}`)}`;
      setRecovery({ teamId, url });
    };
    socket.on("team:recovery_token", handler);
    return () => {
      socket.off("team:recovery_token", handler);
    };
  }, [socket, sessionId]);

  if (sessionEnded) {
    return <SessionEndedScreen />;
  }

  if (notAuthorised) {
    return <NotAuthorisedScreen />;
  }

  if (!connected || !state) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex items-center gap-2 text-white/60">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Connecting</span>
        </div>
      </div>
    );
  }

  const guidance = facilitatorGuidance(state);
  const primary = getPrimaryAction(state);
  const revealPhase = state.phase === "round_results" || state.phase === "debrief" || state.phase === "finished";
  const reissue = (teamId: string) => socket.emit("facilitator:reissue_team_token", { sessionId, teamId });
  const recoveryTeamName = recovery ? state.teams.find((t) => t.id === recovery.teamId)?.name ?? "Team" : "";

  return (
    <div className="flex min-h-full w-full flex-col xl:h-full xl:overflow-hidden">
      {recovery ? (
        <RecoveryModal teamName={recoveryTeamName} url={recovery.url} onClose={() => setRecovery(null)} />
      ) : null}
      <FacilitatorHeader state={state} timeLeftMs={timeLeft} />

      <div className="shrink-0 px-5 pt-5">
        <PhaseGuide
          tone={guidance.tone}
          headline={guidance.headline}
          body={guidance.body}
          action={
            primary ? (
              <Button
                size="lg"
                variant="quiet"
                className="!bg-white/20 !text-white hover:!bg-white/30"
                onClick={() => socket.emit(primary.event, { sessionId })}
              >
                <primary.icon className="h-4 w-4" /> {primary.label}
              </Button>
            ) : null
          }
        />
      </div>

      {state.phase !== "lobby" ? (
        <div className="shrink-0 px-5 pt-4">
          <ControlBar sessionId={sessionId} state={state} socket={socket} token={token} />
        </div>
      ) : null}

      <main className="grid grid-cols-1 gap-5 p-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[1fr_340px]">
        {state.phase === "lobby" ? (
          <div className="xl:col-span-2">
            <Leaderboard state={state} />
          </div>
        ) : (
          <>
            <div className="min-h-0 xl:min-h-0">
              <CoachingGrid state={state} reveal={revealPhase} onReissue={reissue} />
            </div>
            <div className="flex min-h-0 flex-col xl:min-h-0">
              <Leaderboard state={state} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function FacilitatorHeader({ state, timeLeftMs }: { state: SessionStatePublic; timeLeftMs: number }) {
  const phaseText: Record<string, string> = {
    lobby: "Lobby",
    briefing: "Briefing",
    round: `Shift ${state.round?.number ?? 0} / ${ROUND_COUNT}`,
    round_results: `Shift ${state.round?.number ?? 0} results`,
    debrief: "Debrief",
    finished: "Session complete",
  };
  const urgent = timeLeftMs < 60_000 && state.phase === "round";
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-semibold tracking-tighter text-white">Facilitator</div>
          <div className="mt-1 flex items-center gap-3 text-xs text-white/65">
            <span>
              {phaseText[state.phase]}
              {" · "}
              {state.teams.length} / {state.expectedTeams} team{state.expectedTeams === 1 ? "" : "s"}
            </span>
            {state.phase === "round" || state.phase === "round_results" ? (
              <ShiftRibbon current={state.round?.number ?? 0} total={ROUND_COUNT} onDark size="sm" />
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-surface-panel px-4 py-1.5 ring-1 ring-white/10">
          <div className="text-[12px] font-medium uppercase tracking-wider text-white/65">Session code</div>
          <div className="num text-2xl font-semibold tracking-[0.3em] text-white">{state.code}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-full px-4 py-1.5",
            urgent ? "bg-risk text-white" : "bg-surface-panel ring-1 ring-white/10",
          )}
        >
          <Clock className={cn("h-4 w-4", urgent ? "text-white" : "text-white/60")} />
          <span className={cn("num text-2xl font-semibold text-white")}>{formatClock(timeLeftMs)}</span>
        </div>
        <FullscreenToggle />
      </div>
    </header>
  );
}

function Leaderboard({ state }: { state: SessionStatePublic }) {
  if (state.phase === "lobby") {
    return <JoinProgress state={state} />;
  }

  return (
    <Card tone="data" className="flex min-h-0 flex-1 flex-col p-4">
      <SectionTitle tone="data" icon={<Trophy className="h-4 w-4" />} title="Leaderboard" />
      <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[12px] font-medium uppercase tracking-wider text-white/65">
        <div className="col-span-2">Rank</div>
        <div className="col-span-5">Team</div>
        <div className="col-span-2 text-right">Score</div>
        <div className="col-span-3 text-right">Mv</div>
      </div>
      <div className="quiet-scroll min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {(() => {
          // Only flag a leader when their score is strictly greater than the
          // next team's. Otherwise everyone at the top is tied and nobody
          // should be highlighted as 'Lead'.
          const topScore = state.leaderboard[0]?.score ?? 0;
          const secondScore = state.leaderboard[1]?.score ?? 0;
          const hasClearLeader = state.leaderboard.length > 1 && topScore > secondScore;
          return state.leaderboard.map((row, idx) => {
            const isLead = hasClearLeader && idx === 0;
            const team = state.teams.find((t) => t.id === row.teamId);
            const status = team?.connectionStatus ?? "connected";
            return (
              <div
                key={row.teamId}
                className={cn(
                  "grid grid-cols-12 items-center gap-2 rounded-xl px-3 py-2.5 transition-colors",
                  isLead ? "bg-brand-500 text-white" : "bg-white/5",
                )}
              >
                <div className={cn("col-span-2 num text-base font-semibold", isLead ? "text-white" : "text-white/70")}>
                  #{row.rank}
                </div>
                <div className="col-span-5 flex min-w-0 items-center gap-2">
                  <ConnectionDot status={status} />
                  <TeamCrest name={row.name} size={20} tone={isLead ? "lead" : "light"} />
                  <span className={cn("truncate text-sm font-semibold", "text-white")}>{row.name}</span>
                </div>
                <div className={cn("col-span-2 text-right num text-base font-semibold text-white")}>
                  {row.score}
                </div>
                <div className="col-span-3 flex justify-end">
                  <MovementPill value={row.movement} />
                </div>
              </div>
            );
          });
        })()}
      </div>
    </Card>
  );
}

function JoinProgress({ state }: { state: SessionStatePublic }) {
  const joined = state.teams.length;
  const expected = state.expectedTeams;
  const allIn = joined >= expected;
  const slots = Array.from({ length: expected }, (_, i) => state.teams[i]);

  return (
    <Card tone="data" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wide text-brand-400">Lobby</div>
          <div className="mt-0.5 text-lg font-semibold tracking-tight text-white">
            {allIn ? "All teams joined" : `Waiting for teams (${joined} / ${expected})`}
          </div>
        </div>
        <div className="rounded-2xl bg-brand-500 px-4 py-2 text-center text-white">
          <div className="text-[12px] font-medium uppercase tracking-wider opacity-80">Share code</div>
          <div className="num text-2xl font-semibold tracking-[0.3em]">{state.code}</div>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(expected, 4)}, minmax(0, 1fr))` }}>
        {slots.map((t, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 transition-all",
              t ? "bg-emerald-500/15 ring-1 ring-emerald-400/40" : "bg-white/5 ring-1 ring-white/5",
            )}
          >
            {t ? (
              <>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-[12px] font-medium uppercase tracking-wide text-emerald-300">Joined</div>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-white/65" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white/60">Team {i + 1}</div>
                  <div className="text-[12px] font-medium uppercase tracking-wide text-white/65">Awaiting</div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function MovementPill({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/65">
        <Minus className="h-3 w-3" />0
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
        <ArrowUp className="h-3 w-3" />+{value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-1.5 py-0.5 text-xs font-semibold text-rose-300">
      <ArrowDown className="h-3 w-3" />
      {value}
    </span>
  );
}

function columnsForTeams(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

function CoachingGrid({
  state,
  reveal,
  onReissue,
}: {
  state: SessionStatePublic;
  reveal: boolean;
  onReissue: (teamId: string) => void;
}) {
  if (state.teams.length === 0) return null;
  const insightsByTeam = new Map(state.insights.teams.map((i) => [i.teamId, i]));
  const rankByTeam = new Map(state.leaderboard.map((r) => [r.teamId, r.rank]));
  const cols = columnsForTeams(state.teams.length);
  return (
    <Card tone="data" className="flex h-full min-h-0 flex-col p-3">
      <SectionTitle
        tone="data"
        icon={<Layers className="h-4 w-4" />}
        title="Team coaching cards"
        subtitle="Trajectory and one question to ask each team"
      />
      <div
        className="grid min-h-0 flex-1 auto-rows-fr gap-2.5 overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {state.teams.map((t) => (
          <CoachingCard
            key={t.id}
            team={t}
            insight={insightsByTeam.get(t.id)}
            rank={rankByTeam.get(t.id)}
            reveal={reveal}
            onReissue={onReissue}
          />
        ))}
      </div>
    </Card>
  );
}

function CoachingCard({
  team,
  insight,
  rank,
  reveal,
  onReissue,
}: {
  team: TeamPublic;
  insight: TeamInsight | undefined;
  rank?: number;
  reveal: boolean;
  onReissue: (teamId: string) => void;
}) {
  const question = insight?.questions?.[0];
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-hidden rounded-2xl bg-white/5 p-3.5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ConnectionDot status={team.connectionStatus} />
          {rank ? (
            <span className="num shrink-0 text-[13px] font-semibold text-white/65">#{rank}</span>
          ) : null}
          <TeamCrest name={team.name} size={20} tone="light" />
          <span className="truncate text-sm font-semibold tracking-tight text-white">{team.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onReissue(team.id)}
            title="Reissue this team's access link (if they lost their device)"
            className="press flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-white/50 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white/90"
          >
            <KeyRound className="h-3 w-3" />
          </button>
          <span className="rounded-full bg-white/10 px-2 py-0.5 num text-[13px] font-semibold text-white">
            {team.score}
          </span>
          {team.submitted ? (
            <Pill tone="ok" strong>
              <CheckCircle2 className="h-3 w-3" /> In
            </Pill>
          ) : (
            <Pill tone="warn" surface="dark">Pending</Pill>
          )}
        </div>
      </div>

      {question ? (
        <div className="rounded-xl bg-brand-500/15 px-3.5 py-2.5 ring-1 ring-brand-400/20">
          <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-brand-300">
            <MessageCircleQuestion className="h-3 w-3" /> Ask them
          </div>
          <p className="text-[13px] italic leading-snug text-white/90">&ldquo;{question}&rdquo;</p>
        </div>
      ) : null}

      <div className="grid grid-cols-5 gap-2">
        {GOAL_KEYS.map((g) => {
          const ms = METRICS_OF_GOAL[g];
          const value = Math.round(ms.reduce((a, m) => a + (team.metrics?.[m] ?? 0), 0) / ms.length);
          const delta = ms.reduce((a, m) => a + (team.lastMetricDelta?.[m] ?? 0), 0);
          const len = team.trend?.[ms[0]]?.length ?? 0;
          const series = Array.from({ length: len }, (_, i) =>
            Math.round(ms.reduce((a, m) => a + (team.trend?.[m]?.[i] ?? 0), 0) / ms.length),
          );
          return (
            <div key={g} className="min-w-0">
              <div className="truncate text-[12px] font-medium uppercase tracking-wide text-white/65">
                {GOAL_SHORT[g]}
              </div>
              <div className="mt-0.5 flex items-baseline justify-between gap-1">
                <span className="num text-sm font-semibold text-white">{value}</span>
                <Delta value={delta} onDark />
              </div>
              <div className="mt-1">
                <Sparkline values={series} height={26} onDark baselinePoints={BASELINE_WEEKS} />
              </div>
            </div>
          );
        })}
      </div>

      {reveal && team.revealedHidden ? (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-white/65">
            <Eye className="h-3.5 w-3.5" /> Hidden drivers
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(HIDDEN_LABELS) as Array<keyof typeof HIDDEN_LABELS>).map((h) => (
              <div key={h} className="min-w-0">
                <div className="truncate text-[12px] text-white/65">{HIDDEN_LABELS[h]}</div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="num text-xs font-semibold text-white">{team.revealedHidden![h]}</span>
                  <Delta value={team.lastHiddenDelta?.[h]} invertedMeaning={HIDDEN_INVERTED[h]} onDark />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Persistent control strip under the guide banner: the facilitator's
// moment-to-moment controls live here (top of screen, not buried in a side
// column). Context-sensitive - briefing stepper, live-shift controls, or the
// report download - with an always-on submitted / disruption readout on the right.
function ControlBar({
  sessionId,
  state,
  socket,
  token,
}: {
  sessionId: string;
  state: SessionStatePublic;
  socket: Socket;
  token: string | null;
}) {
  const canEndRound = state.phase === "round";
  const reportReady = state.phase === "debrief" || state.phase === "finished";
  const briefing = state.phase === "briefing";
  const step = Math.max(0, Math.min(BRIEFING_STEPS.length - 1, state.briefingStep ?? 0));
  const stepInfo = BRIEFING_STEPS[step];
  const lastStep = step >= BRIEFING_STEPS.length - 1;
  const submitted = state.teams.filter((t) => t.submitted).length;
  const disrupted = state.round?.phase === "disrupted";

  function goStep(next: number) {
    const clamped = Math.max(0, Math.min(BRIEFING_STEP_COUNT - 1, next));
    socket.emit("facilitator:briefing_step", { sessionId, step: clamped });
  }

  function openReport() {
    if (!token) return;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";
    const url = `${serverUrl}/api/sessions/${sessionId}/report.html?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Card tone="data" className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
      {briefing ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 rounded-lg bg-brand-500/15 px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wider text-brand-300">
            Step {step + 1}/{BRIEFING_STEPS.length}
          </span>
          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            {BRIEFING_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  i === step ? "bg-brand-400" : i < step ? "bg-white/40" : "bg-white/15",
                )}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold tracking-tight text-white">{stepInfo.title}</div>
            <div className="flex items-center gap-1.5 text-[12px] text-teal-300">
              <MonitorPlay className="h-3 w-3 shrink-0" />
              <span className="truncate">{stepInfo.teamsSee}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="quiet" size="sm" disabled={step <= 0} onClick={() => goStep(step - 1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button variant="primary" size="sm" disabled={lastStep} onClick={() => goStep(step + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : reportReady ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-white/70">
            <Download className="h-4 w-4 shrink-0 text-teal-300" />
            <span className="truncate">Session complete. Download a printable summary for the room.</span>
          </div>
          <Button variant="primary" size="sm" onClick={openReport} disabled={!token} className="shrink-0">
            <Download className="h-4 w-4" /> Download report
          </Button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-white/70">
            <HelpCircle className="h-4 w-4 shrink-0 text-teal-300" />
            <span className="truncate">
              {canEndRound
                ? "Shift live. Let the clock run, or end early once every team is in."
                : "Shift resolved. Advance the room from the banner above."}
            </span>
          </div>
          {canEndRound ? (
            <Button
              variant="quiet"
              size="sm"
              className="shrink-0"
              onClick={() => socket.emit("facilitator:end_round", { sessionId })}
            >
              <Square className="h-4 w-4" /> End shift early
            </Button>
          ) : null}
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {disrupted ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-risk px-3 py-1.5 text-[12px] font-semibold text-white">
            <AlertTriangle className="h-3.5 w-3.5" /> Disruption live
          </span>
        ) : null}
        <div className="rounded-xl bg-white/5 px-3 py-1.5 text-center ring-1 ring-white/10">
          <div className="text-[12px] font-medium uppercase tracking-wider text-white/65">Submitted</div>
          <div className="num text-sm font-semibold text-white">
            {submitted}/{state.teams.length}
          </div>
        </div>
      </div>

      {briefing ? (
        <p className="w-full border-t border-white/10 pt-2.5 text-[13px] leading-snug text-white/70">
          {stepInfo.body}
          {lastStep ? (
            <span className="text-white/50"> Walkthrough done - start Shift 1 from the banner above.</span>
          ) : null}
        </p>
      ) : null}
    </Card>
  );
}

// Break-glass recovery: shows the one-time recovery link the server minted for a
// team that lost its device state. The facilitator sends the link to the team;
// opening it restores their place. Read-only, copy to clipboard, no codes typed.
function RecoveryModal({ teamName, url, onClose }: { teamName: string; url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked; the field is selectable as a fallback
    }
  };
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-data text-white shadow-panel ring-1 ring-teal-500/25"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-black/20 px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-teal-300">Recovery link</div>
              <h2 id="recovery-title" className="text-lg font-semibold tracking-tight text-white">{teamName}</h2>
              <div className="mt-1 text-[12px] text-white/55">
                Open this link on the team&apos;s device to restore their place. It replaces any earlier link for this team.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 rounded-xl bg-black/30 p-2 ring-1 ring-white/10">
            <input
              readOnly
              value={url}
              onFocusCapture={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent px-2 text-[13px] text-white/80 focus:outline-none"
            />
            <Button variant="quiet" size="sm" onClick={copy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 text-[12px] leading-snug text-white/50">
            Send it to the team however is easiest - paste it into their browser, or share it over chat. No codes to type.
          </p>
        </div>
      </div>
    </div>
  );
}

function NotAuthorisedScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <Card tone="data" className="max-w-md p-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-risk text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Facilitator access required</h2>
        <p className="mt-2 text-sm text-white/70">
          This dashboard is only available to the facilitator who created the session. Reopen it from the original
          link you were given when the session was created.
        </p>
      </Card>
    </div>
  );
}

function SessionEndedScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <Card tone="data" className="max-w-md p-8 text-center">
        <div className="mb-3 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
            <Flag className="h-5 w-5" />
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Session has ended</h2>
        <p className="mt-2 text-sm text-white/70">
          This session is no longer active. Sessions are retained for 24 hours, then released. Start a new one from the
          home page.
        </p>
        <div className="mt-5 flex justify-center">
          <Button variant="primary" onClick={() => (window.location.href = "/")}>
            Back to home
          </Button>
        </div>
      </Card>
    </div>
  );
}

