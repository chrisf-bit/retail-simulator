"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
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
  HelpCircle,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageCircleQuestion,
  Minus,
  Play,
  PlayCircle,
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
import { HIDDEN_INVERTED, HIDDEN_LABELS, KPI_INVERTED, KPI_SHORT } from "@sim/shared";
import { Bar, Button, Card, cn, Delta, PhaseGuide, Pill, SectionTitle } from "@/components/ui";
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
      return { label: "Start Round 1", icon: Play, event: "facilitator:start_round" };
    case "round_results": {
      const nextNumber = (state.round?.number ?? 0) + 1;
      if (nextNumber > 3) return { label: "Begin debrief", icon: Flag, event: "facilitator:next_phase" };
      return { label: `Start Round ${nextNumber}`, icon: Play, event: "facilitator:start_round" };
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
  const { state, socket, connected, offsetMs } = useSessionState();

  useEffect(() => {
    socket.emit("facilitator:join", { sessionId });
  }, [sessionId, socket]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);

  if (!connected || !state) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ink-100">
        <div className="flex items-center gap-2 text-ink-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Connecting…</span>
        </div>
      </div>
    );
  }

  const guidance = facilitatorGuidance(state);
  const primary = getPrimaryAction(state);
  const revealPhase = state.phase === "round_results" || state.phase === "debrief" || state.phase === "finished";

  return (
    <div className="flex h-full w-full flex-col bg-ink-100">
      <FacilitatorHeader state={state} timeLeftMs={timeLeft} />

      <div className="border-b border-ink-200 bg-white px-3 py-3">
        <PhaseGuide
          tone={guidance.tone}
          headline={guidance.headline}
          body={guidance.body}
          action={
            primary ? (
              <Button
                size="xl"
                variant="secondary"
                className="!border-white/40 !bg-white !text-brand-800 hover:!bg-white/90"
                onClick={() => socket.emit(primary.event, { sessionId })}
              >
                <primary.icon className="h-4 w-4" /> {primary.label}
              </Button>
            ) : null
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 p-3">
        <div className="col-span-12 flex min-h-0 flex-col gap-3 lg:col-span-7">
          <Leaderboard state={state} />
          <CoachingGrid state={state} reveal={revealPhase} />
        </div>

        <div className="col-span-12 flex min-h-0 flex-col gap-3 lg:col-span-5">
          <ScriptPanel state={state} />
          <PatternsPanel state={state} />
          <ControlPanel sessionId={sessionId} state={state} socket={socket} />
        </div>
      </div>
    </div>
  );
}

function FacilitatorHeader({ state, timeLeftMs }: { state: SessionStatePublic; timeLeftMs: number }) {
  const phaseText: Record<string, string> = {
    lobby: "Lobby",
    briefing: "Briefing",
    round: `Round ${state.round?.number ?? 0} / 3`,
    round_results: `Round ${state.round?.number ?? 0} results`,
    debrief: "Debrief",
    finished: "Session complete",
  };
  const urgent = timeLeftMs < 60_000 && state.phase === "round";
  return (
    <header className="flex items-center justify-between gap-4 border-b-2 border-ink-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink-900">Facilitator dashboard</div>
          <div className="text-xs text-ink-500">
            {phaseText[state.phase]}
            {" · "}
            {state.teams.length} / {state.expectedTeams} team{state.expectedTeams === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">Session code</div>
          <div className="font-mono text-xl font-bold tracking-[0.3em] text-brand-900">{state.code}</div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 shadow-sm",
            urgent ? "border-red-300 bg-red-50" : "border-ink-200 bg-ink-50",
          )}
        >
          <Clock className={cn("h-4 w-4", urgent ? "text-risk" : "text-ink-500")} />
          <span className={cn("font-mono text-xl font-bold tabular-nums", urgent ? "text-risk" : "text-ink-900")}>
            {formatClock(timeLeftMs)}
          </span>
        </div>
      </div>
    </header>
  );
}

function Leaderboard({ state }: { state: SessionStatePublic }) {
  if (state.phase === "lobby") {
    return <JoinProgress state={state} />;
  }

  return (
    <Card className="p-3">
      <SectionTitle icon={<Trophy className="h-4 w-4" />} title="Leaderboard" />
      <div className="grid grid-cols-12 gap-2 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        <div className="col-span-1">Rank</div>
        <div className="col-span-6">Team</div>
        <div className="col-span-3 text-right">Score</div>
        <div className="col-span-2 text-right">Movement</div>
      </div>
      <div className="space-y-1.5">
        {state.leaderboard.map((row, idx) => {
          const isLead = idx === 0 && state.leaderboard.length > 1;
          return (
            <div
              key={row.teamId}
              className={cn(
                "grid grid-cols-12 items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
                isLead ? "border-brand-300 bg-brand-50 shadow-sm" : "border-ink-200 bg-white",
              )}
            >
              <div className={cn("col-span-1 font-mono text-sm font-bold", isLead ? "text-brand-700" : "text-ink-800")}>
                #{row.rank}
              </div>
              <div className="col-span-6 flex items-center gap-2">
                <Store className={cn("h-4 w-4", isLead ? "text-brand-600" : "text-ink-400")} />
                <span className="truncate text-sm font-semibold text-ink-900">{row.name}</span>
                {isLead ? <Pill tone="info" strong>Lead</Pill> : null}
              </div>
              <div className="col-span-3 text-right font-mono text-sm font-bold tabular-nums text-ink-900">
                {row.score}
              </div>
              <div className="col-span-2 text-right">
                <MovementPill value={row.movement} />
              </div>
            </div>
          );
        })}
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
    <Card tone="accent" className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">Lobby</div>
          <div className="mt-0.5 text-base font-bold text-ink-900">
            {allIn ? "All teams joined" : `Waiting for teams (${joined} of ${expected})`}
          </div>
        </div>
        <div className="rounded-lg border-2 border-brand-200 bg-white px-3 py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Share code</div>
          <div className="font-mono text-xl font-bold tracking-[0.3em] text-brand-900">{state.code}</div>
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(expected, 4)}, minmax(0, 1fr))` }}>
        {slots.map((t, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-lg border-2 px-3 py-2 transition-all",
              t
                ? "border-emerald-300 bg-emerald-50 text-emerald-900 shadow-sm"
                : "border-dashed border-ink-300 bg-white text-ink-400",
            )}
          >
            {t ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{t.name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Joined</div>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-400" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-500">Slot {i + 1}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Awaiting</div>
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
      <span className="inline-flex items-center gap-1 text-xs text-ink-500">
        <Minus className="h-3 w-3" />0
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
        <ArrowUp className="h-3 w-3" />+{value}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-700">
      <ArrowDown className="h-3 w-3" />
      {value}
    </span>
  );
}

function CoachingGrid({ state, reveal }: { state: SessionStatePublic; reveal: boolean }) {
  if (state.teams.length === 0) return null;
  const insightsByTeam = new Map(state.insights.teams.map((i) => [i.teamId, i]));
  return (
    <Card className="flex min-h-0 flex-1 flex-col p-3">
      <SectionTitle
        icon={<Layers className="h-4 w-4" />}
        title="Team coaching cards"
        subtitle="Observations, things to consider, and questions you can ask"
      />
      <div className="grid flex-1 grid-cols-1 gap-2 overflow-auto xl:grid-cols-2">
        {state.teams.map((t) => (
          <CoachingCard key={t.id} team={t} insight={insightsByTeam.get(t.id)} reveal={reveal} />
        ))}
      </div>
    </Card>
  );
}

function CoachingCard({
  team,
  insight,
  reveal,
}: {
  team: TeamPublic;
  insight: TeamInsight | undefined;
  reveal: boolean;
}) {
  const kpis: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-ink-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Store className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate text-sm font-bold text-ink-900">{team.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-600">{team.score}</span>
          {team.submitted ? (
            <Pill tone="ok" strong>
              <CheckCircle2 className="h-3 w-3" /> Submitted
            </Pill>
          ) : (
            <Pill tone="warn">Pending</Pill>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {kpis.map((k) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-md border border-ink-100 bg-ink-50/60 px-1.5 py-1">
            <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-ink-500">
              {KPI_SHORT[k]}
            </span>
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-xs font-bold tabular-nums text-ink-900">{team.kpis[k]}</span>
              <Delta value={team.lastKpiDelta?.[k]} invertedMeaning={KPI_INVERTED[k]} />
            </div>
            <Bar value={team.kpis[k]} inverted={KPI_INVERTED[k]} />
          </div>
        ))}
      </div>

      {reveal && team.revealedHidden ? (
        <div className="rounded-md border border-brand-200 bg-brand-50/60 p-1.5">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-brand-700">
            <Eye className="h-3 w-3" /> Hidden drivers
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(Object.keys(HIDDEN_LABELS) as Array<keyof typeof HIDDEN_LABELS>).map((h) => (
              <div key={h} className="min-w-0">
                <div className="truncate text-[9px] text-ink-600">{HIDDEN_LABELS[h]}</div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs font-bold tabular-nums text-ink-900">{team.revealedHidden![h]}</span>
                  <Delta value={team.lastHiddenDelta?.[h]} invertedMeaning={HIDDEN_INVERTED[h]} />
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
          {insight.considerations.length > 0 ? (
            <InsightList
              icon={<Lightbulb className="h-3 w-3" />}
              label="Things to consider"
              items={insight.considerations}
              tone="warn"
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
    neutral: "border-ink-200 bg-ink-50/60",
    info: "border-brand-200 bg-brand-50/60",
    warn: "border-amber-200 bg-amber-50/50",
  };
  const labelTones = {
    neutral: "text-ink-600",
    info: "text-brand-700",
    warn: "text-amber-800",
  };
  return (
    <div className={cn("rounded-md border px-2 py-1.5", tones[tone])}>
      <div className={cn("mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider", labelTones[tone])}>
        {icon}
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((t, i) => (
          <li key={i} className={cn("text-[11px] leading-snug text-ink-800", italic && "italic")}>
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
    <Card tone="accent" className="p-3">
      <SectionTitle
        icon={<ScrollText className="h-4 w-4" />}
        title={script.headline}
        subtitle="Your talk track for this phase"
      />
      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
            <ListChecks className="h-3 w-3" /> Say / do
          </div>
          <ul className="space-y-1">
            {script.talkTrack.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-snug text-ink-800">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {script.watchFor.length > 0 ? (
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-600">
              <Eye className="h-3 w-3" /> Watch for
            </div>
            <ul className="space-y-0.5">
              {script.watchFor.map((w, i) => (
                <li key={i} className="text-[11px] leading-snug text-ink-700">
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
    <Card className="flex min-h-0 flex-1 flex-col p-3">
      <SectionTitle
        icon={<Sparkles className="h-4 w-4" />}
        title="Patterns across the room"
        subtitle="Things worth naming"
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {patterns.length === 0 && prompts.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-ink-200 bg-ink-50 p-5 text-center">
            <p className="text-xs text-ink-500">
              Room-level patterns will appear once teams have played at least one round.
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
  const tones = {
    info: "border-l-brand-500 bg-brand-50",
    warn: "border-l-amber-500 bg-amber-50",
    positive: "border-l-emerald-500 bg-emerald-50",
  };
  return (
    <div className={cn("rounded-lg border border-ink-200 border-l-4 p-2.5 shadow-sm", tones[tone])}>
      {teamName ? (
        <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-700">
          <AlertTriangle className="h-3 w-3" /> {teamName}
        </div>
      ) : null}
      <p className="text-[12px] leading-snug text-ink-800">{text}</p>
    </div>
  );
}

function ControlPanel({
  sessionId,
  state,
  socket,
}: {
  sessionId: string;
  state: SessionStatePublic;
  socket: Socket;
}) {
  const canEndRound = state.phase === "round";
  const canDisrupt = state.phase === "round" && state.round?.phase !== "disrupted";

  return (
    <Card className="p-3">
      <SectionTitle
        icon={<HelpCircle className="h-4 w-4" />}
        title="Mid-round tools"
        subtitle="Advance phases using the button above"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={!canDisrupt}
          onClick={() => socket.emit("facilitator:trigger_disruption", { sessionId })}
        >
          <Zap className="h-4 w-4" /> Disruption
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!canEndRound}
          onClick={() => socket.emit("facilitator:end_round", { sessionId })}
        >
          <Square className="h-4 w-4" /> End round
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-ink-200 bg-ink-50 p-2 text-[11px]">
        <StatPill label="Phase" value={state.phase} />
        <StatPill label="Round phase" value={state.round?.phase ?? "—"} />
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
    <div className="rounded-md bg-white px-2 py-1.5 text-center">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-0.5 truncate text-xs font-bold text-ink-800">{value}</div>
    </div>
  );
}

