"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Binoculars,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  HeartHandshake,
  HelpCircle,
  Layers,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  Minus,
  Play,
  PlayCircle,
  Download,
  ScrollText,
  Sparkles,
  Square,
  Store,
  Trophy,
  Zap,
} from "lucide-react";
import type { Socket } from "socket.io-client";
import type {
  KpiKey,
  SessionStatePublic,
  TeamInsight,
  TeamPublic,
} from "@sim/shared";
import { ARCHETYPE_LABELS, BASELINE_WEEKS, HIDDEN_INVERTED, HIDDEN_LABELS, KPI_INVERTED, KPI_SHORT, ROUND_COUNT } from "@sim/shared";
import { Bar, Button, Card, cn, ConnectionDot, Delta, PhaseGuide, Pill, SectionTitle, ShiftRibbon, Sparkline } from "@/components/ui";
import { TeamCrest } from "@/components/TeamCrest";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { formatClock, useCountdown, useSessionState } from "@/lib/useSession";
import { facilitatorGuidance } from "@/lib/guidance";

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

  return (
    <div className="flex min-h-full w-full flex-col xl:h-full xl:overflow-hidden">
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

      <main className="grid grid-cols-12 gap-5 p-5 xl:min-h-0 xl:flex-1">
        <div className="col-span-12 flex flex-col gap-4 xl:col-span-7 xl:min-h-0">
          <Leaderboard state={state} />
          <CoachingGrid state={state} reveal={revealPhase} />
        </div>

        <div className="col-span-12 flex flex-col gap-4 xl:col-span-5 xl:min-h-0">
          <ScriptPanel state={state} />
          <PatternsPanel state={state} />
          <ControlPanel sessionId={sessionId} state={state} socket={socket} token={token} />
        </div>
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
          <div className="mt-1 flex items-center gap-3 text-xs text-white/50">
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
          <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">Session code</div>
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
    <Card tone="data" className="p-5">
      <SectionTitle tone="data" icon={<Trophy className="h-4 w-4" />} title="Leaderboard" />
      <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-white/50">
        <div className="col-span-1">Rank</div>
        <div className="col-span-6">Team</div>
        <div className="col-span-3 text-right">Score</div>
        <div className="col-span-2 text-right">Movement</div>
      </div>
      <div className="space-y-1">
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
                <div className={cn("col-span-1 num text-base font-semibold", isLead ? "text-white" : "text-white/70")}>
                  #{row.rank}
                </div>
                <div className="col-span-6 flex items-center gap-2">
                  <ConnectionDot status={status} />
                  <TeamCrest name={row.name} size={22} tone={isLead ? "lead" : "light"} />
                  <span className={cn("truncate text-sm font-semibold", "text-white")}>{row.name}</span>
                  {isLead ? <Pill tone="neutral" strong>Lead</Pill> : null}
                </div>
                <div className={cn("col-span-3 text-right num text-base font-semibold text-white")}>
                  {row.score}
                </div>
                <div className="col-span-2 text-right">
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
          <div className="text-[11px] font-medium uppercase tracking-wide text-brand-400">Lobby</div>
          <div className="mt-0.5 text-lg font-semibold tracking-tight text-white">
            {allIn ? "All teams joined" : `Waiting for teams (${joined} / ${expected})`}
          </div>
        </div>
        <div className="rounded-2xl bg-brand-500 px-4 py-2 text-center text-white">
          <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">Share code</div>
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
                  <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-300">Joined</div>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-white/40" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white/60">Team {i + 1}</div>
                  <div className="text-[10px] font-medium uppercase tracking-wide text-ink-400">Awaiting</div>
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
      <span className="inline-flex items-center gap-1 text-xs text-white/50">
        <Minus className="h-3 w-3" />0
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-xs font-semibold text-emerald-300">
        <ArrowUp className="h-3 w-3" />+{value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 px-1.5 py-0.5 text-xs font-semibold text-rose-300">
      <ArrowDown className="h-3 w-3" />
      {value}
    </span>
  );
}

function CoachingGrid({ state, reveal }: { state: SessionStatePublic; reveal: boolean }) {
  if (state.teams.length === 0) return null;
  const insightsByTeam = new Map(state.insights.teams.map((i) => [i.teamId, i]));
  const moment = state.round?.moment;
  return (
    <Card tone="data" className="flex min-h-0 flex-1 flex-col p-3">
      <SectionTitle
        tone="data"
        icon={<Layers className="h-4 w-4" />}
        title="Team coaching cards"
        subtitle="Observations, things to consider, and questions you can ask"
      />
      <div className="grid flex-1 grid-cols-1 gap-2 overflow-auto xl:grid-cols-2">
        {state.teams.map((t) => (
          <CoachingCard
            key={t.id}
            team={t}
            insight={insightsByTeam.get(t.id)}
            reveal={reveal}
            moment={moment}
          />
        ))}
      </div>
    </Card>
  );
}

function CoachingCard({
  team,
  insight,
  reveal,
  moment,
}: {
  team: TeamPublic;
  insight: TeamInsight | undefined;
  reveal: boolean;
  moment?: import("@sim/shared").TeamMoment;
}) {
  const kpis: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
  const momentResponseId = team.lastDecision?.momentResponseId;
  const momentResponse = moment && momentResponseId ? moment.options.find((o) => o.id === momentResponseId) : undefined;
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <ConnectionDot status={team.connectionStatus} />
          <TeamCrest name={team.name} size={22} tone="light" />
          <span className="truncate text-[15px] font-semibold tracking-tight text-white">{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 num text-[13px] font-semibold text-white">
            {team.score}
          </span>
          {team.submitted ? (
            <Pill tone="ok" strong>
              <CheckCircle2 className="h-3 w-3" /> Submitted
            </Pill>
          ) : (
            <Pill tone="warn" surface="dark">Pending</Pill>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {kpis.map((k) => (
          <div key={k} className="min-w-0">
            <div className="truncate text-[10px] font-medium uppercase tracking-wide text-white/50">
              {KPI_SHORT[k]}
            </div>
            <div className="mt-0.5 flex items-baseline justify-between gap-1">
              <span className="num text-sm font-semibold text-white">{team.kpis[k]}</span>
              <Delta value={team.lastKpiDelta?.[k]} invertedMeaning={KPI_INVERTED[k]} onDark />
            </div>
            <div className="mt-1">
              <Sparkline values={team.trend[k]} inverted={KPI_INVERTED[k]} height={28} onDark baselinePoints={BASELINE_WEEKS} />
            </div>
          </div>
        ))}
      </div>

      {moment ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-white/5 p-2.5">
          <div className="shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
            <PersonaAvatar name={moment.persona.name} size={32} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-brand-400">
              <HeartHandshake className="h-3.5 w-3.5" /> People moment &middot; {moment.persona.name}
            </div>
            {momentResponse ? (
              <div className="flex items-start gap-2">
                <Pill tone="info" strong>{ARCHETYPE_LABELS[momentResponse.archetype]}</Pill>
                <p className="text-[12px] leading-snug text-white/80">&ldquo;{momentResponse.label}&rdquo;</p>
              </div>
            ) : team.submitted ? (
              <p className="text-[12px] italic text-white/60">No response chosen. Worth asking why.</p>
            ) : (
              <p className="text-[12px] italic text-white/50">Not yet responded.</p>
            )}
          </div>
        </div>
      ) : null}

      {reveal && team.revealedHidden ? (
        <div className="rounded-xl bg-white/5 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
            <Eye className="h-3.5 w-3.5" /> Hidden drivers
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(HIDDEN_LABELS) as Array<keyof typeof HIDDEN_LABELS>).map((h) => (
              <div key={h} className="min-w-0">
                <div className="truncate text-[10px] text-white/50">{HIDDEN_LABELS[h]}</div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="num text-xs font-semibold text-white">{team.revealedHidden![h]}</span>
                  <Delta value={team.lastHiddenDelta?.[h]} invertedMeaning={HIDDEN_INVERTED[h]} onDark />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {insight ? (
        <div className="space-y-1.5">
          {insight.observations.length > 0 ? (
            <InsightList
              icon={<Binoculars className="h-3 w-3" />}
              label="Observed"
              items={insight.observations}
              tone="neutral"
            />
          ) : null}
          {insight.questions.length > 0 ? (
            <InsightList
              icon={<MessageCircleQuestion className="h-3 w-3" />}
              label="Ask them"
              items={insight.questions}
              tone="info"
              italic
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InsightList({
  icon,
  label,
  items,
  tone,
  italic = false,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  tone: "neutral" | "info" | "warn";
  italic?: boolean;
}) {
  const tones = {
    neutral: "bg-white/5",
    info: "bg-brand-500/15",
    warn: "bg-brand-500/15",
  };
  const labelTones = {
    neutral: "text-white/60",
    info: "text-brand-300",
    warn: "text-brand-300",
  };
  return (
    <div className={cn("rounded-xl px-3.5 py-3", tones[tone])}>
      <div className={cn("mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", labelTones[tone])}>
        {icon}
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className={cn("text-[15px] leading-relaxed text-white/90", italic && "italic")}>
            {italic ? "“" : null}
            {t}
            {italic ? "”" : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScriptPanel({ state }: { state: SessionStatePublic }) {
  const script = state.insights.script;
  return (
    <Card tone="data" className="p-5">
      <SectionTitle
        tone="data"
        icon={<ScrollText className="h-4 w-4" />}
        title={script.headline}
        subtitle="Your talk track for this phase"
      />
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-brand-400">
            <ListChecks className="h-4 w-4" /> Say / do
          </div>
          <ul className="space-y-2">
            {script.talkTrack.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-base leading-relaxed text-white/90">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {script.watchFor.length > 0 ? (
          <div className="rounded-lg bg-white/5 p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-white/60">
              <Eye className="h-4 w-4" /> Watch for
            </div>
            <ul className="space-y-1">
              {script.watchFor.map((w, i) => (
                <li key={i} className="text-xs leading-snug text-white/70">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function PatternsPanel({ state }: { state: SessionStatePublic }) {
  const patterns = state.insights.patterns;
  const prompts = state.prompts;
  return (
    <Card tone="data" className="flex min-h-0 flex-1 flex-col p-3">
      <SectionTitle
        tone="data"
        icon={<Sparkles className="h-5 w-5" />}
        title="Patterns across the room"
        subtitle="Things worth naming"
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {patterns.length === 0 && prompts.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-white/5 p-5 text-center">
            <p className="text-xs text-white/50">
              Room-level patterns will appear once teams have played at least one shift.
            </p>
          </div>
        ) : null}
        {patterns.map((p) => (
          <PatternCard key={p.id} tone={p.tone} text={p.text} />
        ))}
        {prompts.map((p) => (
          <PatternCard
            key={p.id}
            tone={p.tone === "warning" ? "warn" : p.tone === "positive" ? "positive" : "info"}
            text={p.text}
            teamName={p.teamName}
          />
        ))}
      </div>
    </Card>
  );
}

function PatternCard({
  tone,
  text,
  teamName,
}: {
  tone: "info" | "warn" | "positive";
  text: string;
  teamName?: string;
}) {
  const eyebrowLabel = {
    info: "Noticed",
    warn: "Watch",
    positive: "Working well",
  }[tone];
  const eyebrowColor = {
    info: "text-white/50",
    warn: "text-white/80",
    positive: "text-emerald-300",
  }[tone];
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/5">
      <div className={cn("mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]", eyebrowColor)}>
        {teamName ? `${teamName} · ${eyebrowLabel}` : eyebrowLabel}
      </div>
      <p className="text-base leading-relaxed text-white/90">{text}</p>
    </div>
  );
}

function ControlPanel({
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
  const canDisrupt = state.phase === "round" && state.round?.phase !== "disrupted";
  const reportReady = state.phase === "debrief" || state.phase === "finished";

  function openReport() {
    if (!token) return;
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";
    const url = `${serverUrl}/api/sessions/${sessionId}/report.html?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Card tone="data" className="p-5">
      {reportReady ? (
        <>
          <SectionTitle
            tone="data"
            icon={<Download className="h-4 w-4" />}
            title="Session report"
            subtitle="Download a printable summary for the room"
          />
          <Button variant="primary" onClick={openReport} disabled={!token} className="w-full justify-center">
            <Download className="h-4 w-4" /> Download session report
          </Button>
        </>
      ) : (
        <>
          <SectionTitle
            tone="data"
            icon={<HelpCircle className="h-4 w-4" />}
            title="Shift controls"
            subtitle="Disruption auto-triggers at 1 min. Override below if needed."
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!canDisrupt}
              onClick={() => socket.emit("facilitator:trigger_disruption", { sessionId })}
            >
              <Zap className="h-4 w-4" /> Disrupt now
            </Button>
            <Button
              variant="quiet"
              size="sm"
              disabled={!canEndRound}
              onClick={() => socket.emit("facilitator:end_round", { sessionId })}
            >
              <Square className="h-4 w-4" /> End shift early
            </Button>
          </div>
        </>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-2 text-[11px]">
        <StatPill label="Phase" value={state.phase} />
        <StatPill label="Shift phase" value={state.round?.phase ?? "-"} />
        <StatPill
          label="Submitted"
          value={`${state.teams.filter((t) => t.submitted).length}/${state.teams.length}`}
        />
      </div>
    </Card>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/50">{label}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-white">{value}</div>
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

