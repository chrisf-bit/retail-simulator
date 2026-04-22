"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Gauge,
  Lightbulb,
  Loader2,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  Users2,
  Wrench,
} from "lucide-react";
import type {
  ActionApproach,
  Decision,
  KpiKey,
  LeadershipStyle,
  Priority,
  ResourceAllocation,
  SessionStatePublic,
  TeamPublic,
} from "@sim/shared";
import {
  ACTION_LABELS,
  DEFAULT_ALLOCATION,
  HIDDEN_INVERTED,
  HIDDEN_LABELS,
  KPI_INVERTED,
  KPI_LABELS,
  KPI_SHORT,
  LEADERSHIP_LABELS,
  PRIORITY_LABELS,
} from "@sim/shared";
import { Bar, Button, Card, cn, Delta, PhaseGuide, Pill, SectionTitle } from "@/components/ui";
import { formatClock, useCountdown, useSessionState } from "@/lib/useSession";
import { teamGuidance } from "@/lib/guidance";

const PRIORITY_ICONS: Record<Priority, React.ComponentType<{ className?: string }>> = {
  safety_loss: Shield,
  people_team: Users2,
  customer: ShoppingBag,
  commercial: Gauge,
};

const ACTION_ICONS: Record<ActionApproach, React.ComponentType<{ className?: string }>> = {
  standard: ClipboardList,
  adapt_local: Compass,
  escalate: BellRing,
  reallocate: Wrench,
};

const ALLOCATION_LABELS: Array<{ key: keyof ResourceAllocation; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { key: "shop_floor", label: "Shop floor", icon: Store },
  { key: "backroom", label: "Backroom", icon: ClipboardList },
  { key: "customer_service", label: "Customer service", icon: ShoppingBag },
  { key: "problem_resolution", label: "Problem resolution", icon: Wrench },
];

const SEVERITY_TONES: Record<"low" | "medium" | "high", "info" | "warn" | "risk"> = {
  low: "info",
  medium: "warn",
  high: "risk",
};

export default function TeamPlayerPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const { state, socket, connected, offsetMs } = useSessionState();
  const [teamId, setTeamId] = useState<string | null>(null);

  const [priority, setPriority] = useState<Priority>("customer");
  const [action, setAction] = useState<ActionApproach>("adapt_local");
  const [leadership, setLeadership] = useState<LeadershipStyle>("collaborative");
  const [allocation, setAllocation] = useState<ResourceAllocation>(DEFAULT_ALLOCATION);
  const [primaryIssueId, setPrimaryIssueId] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`team:${sessionId}`);
    if (stored) {
      setTeamId(stored);
      socket.emit("session:rejoin", { sessionId, teamId: stored });
    } else {
      router.replace("/");
    }
  }, [sessionId, socket, router]);

  const team = useMemo<TeamPublic | undefined>(
    () => state?.teams.find((t) => t.id === teamId),
    [state, teamId],
  );

  const roundNumber = state?.round?.number;
  useEffect(() => {
    setPrimaryIssueId(null);
  }, [roundNumber]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);

  if (!connected || !state) {
    return <LoadingScreen label="Connecting to session" />;
  }
  if (!team) {
    return <LoadingScreen label="Waiting for session state" />;
  }

  const roundLocked = !state.round || state.round.phase === "locked" || state.round.phase === "reveal";
  const canSubmit = !team.submitted && !roundLocked && state.phase === "round";
  const guidance = teamGuidance(state, team.submitted);

  function submit() {
    if (!teamId) return;
    const decision: Omit<Decision, "submittedAt"> = {
      priority,
      action,
      leadership,
      allocation,
      primaryIssueId: primaryIssueId ?? undefined,
    };
    socket.emit("team:submit_decision", { sessionId, teamId, decision });
  }

  return (
    <div className="flex h-full w-full flex-col bg-ink-100">
      <TeamHeader
        team={team}
        round={state.round?.number ?? 0}
        phase={state.phase}
        timeLeftMs={timeLeft}
        roundPhase={state.round?.phase}
      />

      <div className="border-b border-ink-200 bg-white px-3 py-3">
        <PhaseGuide tone={guidance.tone} headline={guidance.headline} body={guidance.body} />
      </div>

      {state.phase === "lobby" || state.phase === "briefing" ? (
        <WaitingPanel phase={state.phase} code={state.code} teamName={team.name} />
      ) : state.phase === "debrief" || state.phase === "finished" ? (
        <DebriefPanel team={team} rank={state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0} />
      ) : state.phase === "round_results" ? (
        <ResultsPanel team={team} state={state} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 p-3">
          <div className="col-span-12 flex min-h-0 flex-col gap-3 lg:col-span-7">
            <KpiStrip team={team} />
            <div className="grid min-h-0 flex-1 grid-cols-5 gap-3">
              <IssuesPanel
                state={state}
                primaryIssueId={primaryIssueId}
                onSelect={(id) => setPrimaryIssueId(id)}
                disabled={!canSubmit}
              />
              <AlertsPanel state={state} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <DecisionPanel
              priority={priority}
              setPriority={setPriority}
              action={action}
              setAction={setAction}
              leadership={leadership}
              setLeadership={setLeadership}
              allocation={allocation}
              setAllocation={setAllocation}
              primaryIssueId={primaryIssueId}
              canSubmit={canSubmit}
              submitted={team.submitted}
              onSubmit={submit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TeamHeader({
  team,
  round,
  phase,
  timeLeftMs,
  roundPhase,
}: {
  team: TeamPublic;
  round: number;
  phase: string;
  timeLeftMs: number;
  roundPhase?: string;
}) {
  const clock = formatClock(timeLeftMs);
  const urgent = timeLeftMs < 60_000 && phase === "round";
  return (
    <header className="flex items-center justify-between gap-4 border-b-2 border-ink-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink-900">{team.name}</div>
          <div className="text-xs text-ink-500">
            {phase === "round" ? `Round ${round} of 3` : phaseLabel(phase)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {roundPhase === "disrupted" ? (
          <Pill tone="risk" strong>
            <AlertTriangle className="h-3 w-3" /> Disruption
          </Pill>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 shadow-sm",
            urgent ? "border-red-300 bg-red-50" : "border-ink-200 bg-ink-50",
          )}
        >
          <Clock className={cn("h-5 w-5", urgent ? "text-risk" : "text-ink-500")} />
          <span className={cn("font-mono text-2xl font-bold tabular-nums", urgent ? "text-risk" : "text-ink-900")}>
            {clock}
          </span>
        </div>
        <div className="rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-1.5 text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Score</div>
          <div className="font-mono text-2xl font-bold text-brand-900">{team.score}</div>
        </div>
      </div>
    </header>
  );
}

function phaseLabel(p: string): string {
  switch (p) {
    case "lobby": return "Waiting in lobby";
    case "briefing": return "Briefing in progress";
    case "round": return "Round active";
    case "round_results": return "Reviewing round";
    case "debrief": return "Debrief";
    case "finished": return "Session complete";
    default: return p;
  }
}

function KpiStrip({ team }: { team: TeamPublic }) {
  const items: Array<{ key: KpiKey; label: string; value: number; inverted: boolean }> = (
    Object.keys(KPI_LABELS) as KpiKey[]
  ).map((k) => ({ key: k, label: KPI_LABELS[k], value: team.kpis[k], inverted: KPI_INVERTED[k] }));

  return (
    <Card className="p-3">
      <SectionTitle icon={<Gauge className="h-4 w-4" />} title="Store performance" subtitle="Live KPI snapshot" />
      <div className="grid grid-cols-5 gap-2">
        {items.map((i) => (
          <div key={i.key} className="min-w-0 rounded-lg border-2 border-ink-200 bg-ink-50 p-2.5 shadow-sm">
            <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ink-500">{i.label}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold tabular-nums text-ink-900">{i.value}</span>
              <Delta value={team.lastKpiDelta?.[i.key]} invertedMeaning={i.inverted} />
            </div>
            <div className="mt-2">
              <Bar value={i.value} inverted={i.inverted} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function IssuesPanel({
  state,
  primaryIssueId,
  onSelect,
  disabled,
}: {
  state: SessionStatePublic;
  primaryIssueId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const issues = state.round?.issues ?? [];
  return (
    <Card className="col-span-3 flex min-h-0 flex-col p-3">
      <SectionTitle
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Active issues"
        subtitle="Tap one to target it as your primary focus"
        right={primaryIssueId ? <Pill tone="info" strong><Target className="h-3 w-3" /> Targeting</Pill> : null}
      />
      <div className="flex-1 space-y-2 overflow-auto">
        {issues.map((i) => {
          const selected = primaryIssueId === i.id;
          return (
            <button
              key={i.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(i.id)}
              className={cn(
                "w-full rounded-lg border-2 p-3 text-left transition-all",
                selected
                  ? "border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-200"
                  : "border-ink-200 bg-white hover:border-ink-300",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-ink-900">{i.title}</h4>
                <Pill tone={SEVERITY_TONES[i.severity]} strong>
                  {i.severity}
                </Pill>
              </div>
              <p className="text-xs text-ink-600">{i.description}</p>
              {selected ? (
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                  <Target className="h-3 w-3" /> Primary focus
                </div>
              ) : null}
            </button>
          );
        })}
        {issues.length === 0 ? <p className="text-xs text-ink-500">No active issues.</p> : null}
      </div>
    </Card>
  );
}

function AlertsPanel({ state }: { state: SessionStatePublic }) {
  const alerts = state.round?.alerts ?? [];
  const disruption = state.round?.disruption;
  return (
    <Card className="col-span-2 flex min-h-0 flex-col p-3">
      <SectionTitle icon={<BellRing className="h-4 w-4" />} title="Alerts" subtitle="Head office & ops" />
      <div className="flex-1 space-y-2 overflow-auto">
        {disruption ? (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3 shadow-sm">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
              <AlertTriangle className="h-3 w-3" /> Disruption
            </div>
            <h4 className="text-sm font-bold text-red-900">{disruption.title}</h4>
            <p className="mt-1 text-xs text-red-800">{disruption.message}</p>
            <p className="mt-1 text-[11px] italic text-red-700">{disruption.impact}</p>
          </div>
        ) : null}
        {alerts.map((a) => (
          <div key={a.id} className="rounded-lg border border-ink-200 bg-white p-3 shadow-sm">
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
              {a.kind === "head_office" ? "Head office" : "Operational"}
            </div>
            <h4 className="text-sm font-semibold text-ink-900">{a.title}</h4>
            <p className="mt-1 text-xs text-ink-600">{a.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DecisionPanel({
  priority,
  setPriority,
  action,
  setAction,
  leadership,
  setLeadership,
  allocation,
  setAllocation,
  primaryIssueId,
  canSubmit,
  submitted,
  onSubmit,
}: {
  priority: Priority;
  setPriority: (p: Priority) => void;
  action: ActionApproach;
  setAction: (a: ActionApproach) => void;
  leadership: LeadershipStyle;
  setLeadership: (l: LeadershipStyle) => void;
  allocation: ResourceAllocation;
  setAllocation: (a: ResourceAllocation) => void;
  primaryIssueId: string | null;
  canSubmit: boolean;
  submitted: boolean;
  onSubmit: () => void;
}) {
  const total =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;

  return (
    <Card tone="accent" className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b-2 border-brand-100 bg-gradient-to-r from-brand-50 to-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-bold text-ink-900">Your decision</h3>
        </div>
        {submitted ? (
          <Pill tone="ok" strong>
            <CheckCircle2 className="h-3 w-3" /> Submitted
          </Pill>
        ) : (
          <Pill tone="warn" strong>Awaiting</Pill>
        )}
      </div>

      <div className="grid flex-1 grid-rows-[auto_auto_auto_auto_1fr_auto] gap-3 overflow-auto p-3">
        <RadioGroup<Priority>
          label="A. Priority focus"
          options={Object.keys(PRIORITY_LABELS) as Priority[]}
          labels={PRIORITY_LABELS}
          icons={PRIORITY_ICONS}
          value={priority}
          onChange={setPriority}
          disabled={submitted || !canSubmit}
        />

        <RadioGroup<ActionApproach>
          label="B. Action approach"
          options={Object.keys(ACTION_LABELS) as ActionApproach[]}
          labels={ACTION_LABELS}
          icons={ACTION_ICONS}
          value={action}
          onChange={setAction}
          disabled={submitted || !canSubmit}
        />

        <RadioGroup<LeadershipStyle>
          label="C. Leadership style"
          options={Object.keys(LEADERSHIP_LABELS) as LeadershipStyle[]}
          labels={LEADERSHIP_LABELS}
          value={leadership}
          onChange={setLeadership}
          disabled={submitted || !canSubmit}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-500">D. Resource allocation</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-bold",
                total === 100 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
              )}
            >
              Total: {total}%
            </span>
          </div>
          <div className="space-y-1.5">
            {ALLOCATION_LABELS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.key} className="flex items-center gap-3">
                  <span className="flex w-36 shrink-0 items-center gap-1.5 text-xs font-medium text-ink-700">
                    <Icon className="h-3.5 w-3.5 text-ink-400" /> {a.label}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={allocation[a.key]}
                    disabled={submitted || !canSubmit}
                    onChange={(e) => setAllocation({ ...allocation, [a.key]: Number(e.target.value) })}
                    className="flex-1 accent-brand-600"
                  />
                  <span className="w-10 text-right font-mono text-xs font-semibold text-ink-800">
                    {allocation[a.key]}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-xs">
          <Target className={cn("h-4 w-4 shrink-0", primaryIssueId ? "text-brand-600" : "text-ink-400")} />
          {primaryIssueId ? (
            <span className="text-ink-700">
              <span className="font-bold text-brand-700">E. Primary issue</span> selected. Alignment with your priority
              will boost impact.
            </span>
          ) : (
            <span className="text-ink-500">
              <span className="font-bold text-ink-700">E. Primary issue:</span> tap an issue on the left to target it.
              Optional but high-impact.
            </span>
          )}
        </div>

        <Button size="xl" onClick={onSubmit} disabled={!canSubmit || total !== 100}>
          {submitted ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Decision locked in
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit decision
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function RadioGroup<T extends string>({
  label,
  options,
  labels,
  icons,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: T[];
  labels: Record<T, string>;
  icons?: Record<T, React.ComponentType<{ className?: string }>>;
  value: T;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = value === opt;
          const Icon = icons?.[opt];
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              className={cn(
                "flex items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-left text-sm font-medium transition-all",
                active
                  ? "border-brand-500 bg-brand-600 text-white shadow-sm"
                  : "border-ink-200 bg-white text-ink-700 hover:border-ink-400 hover:bg-ink-50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {Icon ? <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-ink-400")} /> : null}
              <span className="truncate">{labels[opt]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WaitingPanel({ phase, code, teamName }: { phase: string; code: string; teamName: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card tone="accent" className="max-w-md p-6 text-center">
        <div className="mb-3 flex justify-center text-brand-600">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-ink-900">
          {phase === "briefing" ? "Briefing in progress" : "Waiting to start"}
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          You are checked in as <span className="font-semibold text-ink-900">{teamName}</span>. The facilitator will
          start the round when everyone is ready.
        </p>
        <div className="mt-4 rounded-lg border-2 border-brand-200 bg-brand-50 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Session code</div>
          <div className="font-mono text-xl font-bold tracking-[0.25em] text-brand-900">{code}</div>
        </div>
      </Card>
    </div>
  );
}

function ResultsPanel({ team, state }: { team: TeamPublic; state: SessionStatePublic }) {
  const rank = state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0;
  const kpis: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-4">
      <Card tone="accent" className="w-full max-w-4xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Pill tone="info" strong>Round {state.round?.number} complete</Pill>
            <h2 className="mt-2 text-xl font-bold text-ink-900">How the round played out</h2>
            <p className="text-sm text-ink-600">Your facilitator will move on when the room is ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg border-2 border-brand-200 bg-brand-50 px-4 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Rank</div>
              <div className="text-3xl font-bold text-brand-900">#{rank}</div>
            </div>
            <div className="rounded-lg border-2 border-ink-200 bg-ink-50 px-4 py-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Round score</div>
              <div
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  team.lastMovement > 0 ? "text-emerald-700" : team.lastMovement < 0 ? "text-red-700" : "text-ink-900",
                )}
              >
                {team.lastMovement > 0 ? "+" : ""}
                {team.lastMovement}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {kpis.map((k) => (
            <div key={k} className="rounded-lg border-2 border-ink-200 bg-white p-3 shadow-sm">
              <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ink-500">
                {KPI_SHORT[k]}
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold tabular-nums text-ink-900">{team.kpis[k]}</span>
                <Delta value={team.lastKpiDelta?.[k]} invertedMeaning={KPI_INVERTED[k]} />
              </div>
              <Bar value={team.kpis[k]} inverted={KPI_INVERTED[k]} />
            </div>
          ))}
        </div>

        {team.revealedHidden ? (
          <div className="mt-3 rounded-lg border-2 border-brand-200 bg-brand-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-bold text-brand-900">Hidden drivers revealed</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(HIDDEN_LABELS) as Array<keyof typeof HIDDEN_LABELS>).map((h) => (
                <div key={h} className="rounded-md border border-brand-200 bg-white p-2">
                  <div className="truncate text-[10px] font-bold uppercase tracking-wider text-ink-500">
                    {HIDDEN_LABELS[h]}
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-lg font-bold tabular-nums text-ink-900">{team.revealedHidden![h]}</span>
                    <Delta value={team.lastHiddenDelta?.[h]} invertedMeaning={HIDDEN_INVERTED[h]} />
                  </div>
                  <Bar value={team.revealedHidden![h]} inverted={HIDDEN_INVERTED[h]} />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Strength</span>
            <div className="font-semibold">{team.strength ?? "—"}</div>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-900">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Risk</span>
            <div className="font-semibold">{team.risk ?? "—"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DebriefPanel({ team, rank }: { team: TeamPublic; rank: number }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card tone="accent" className="max-w-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-ink-900">Session complete</h2>
        <p className="mt-2 text-sm text-ink-600">Thanks, {team.name}. Your facilitator will lead the debrief.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border-2 border-brand-200 bg-brand-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-brand-700">Final rank</div>
            <div className="text-3xl font-bold text-brand-900">#{rank}</div>
          </div>
          <div className="rounded-lg border-2 border-ink-200 bg-ink-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Final score</div>
            <div className="text-3xl font-bold text-ink-900">{team.score}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink-100">
      <div className="flex items-center gap-2 text-ink-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
