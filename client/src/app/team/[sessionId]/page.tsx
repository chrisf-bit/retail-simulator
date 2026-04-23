"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Flame,
  Gauge,
  HeartHandshake,
  LineChart,
  Loader2,
  MessageCircleQuestion,
  Scale,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Target,
  UserCircle2,
  Users2,
  Wrench,
} from "lucide-react";
import type {
  ActionApproach,
  ConfidenceLevel,
  Decision,
  Issue,
  KpiKey,
  LeadershipStyle,
  Priority,
  ResourceAllocation,
  SessionStatePublic,
  TeamMoment,
  TeamPublic,
} from "@sim/shared";
import {
  ACTION_LABELS,
  CONFIDENCE_DESCRIPTIONS,
  CONFIDENCE_LABELS,
  HIDDEN_INVERTED,
  HIDDEN_LABELS,
  KPI_INVERTED,
  KPI_LABELS,
  KPI_SHORT,
  LEADERSHIP_LABELS,
  PRIORITY_LABELS,
  ROUND_COUNT,
} from "@sim/shared";
import { Bar, Button, Card, cn, ConnectionDot, Delta, PhaseGuide, Pill, Sparkline } from "@/components/ui";
import { formatClock, useCountdown, useSessionState, useTeamHeartbeat } from "@/lib/useSession";
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

const CONFIDENCE_ICONS: Record<ConfidenceLevel, React.ComponentType<{ className?: string }>> = {
  cautious: ShieldCheck,
  measured: Scale,
  confident: Flame,
};

const ALLOCATION_LABELS: Array<{
  key: keyof ResourceAllocation;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "shop_floor", label: "Shop floor", icon: Store },
  { key: "backroom", label: "Backroom", icon: ClipboardList },
  { key: "customer_service", label: "Customer service", icon: ShoppingBag },
  { key: "problem_resolution", label: "Problem resolution", icon: Wrench },
];

const SEVERITY_TONES: Record<"low" | "medium" | "high", "neutral" | "warn" | "risk"> = {
  low: "neutral",
  medium: "warn",
  high: "risk",
};

type TabId = 1 | 2 | 3 | 4 | 5;

const TAB_DEFS: Array<{ id: TabId; label: string }> = [
  { id: 1, label: "Focus" },
  { id: 2, label: "Team" },
  { id: 3, label: "Issue" },
  { id: 4, label: "People" },
  { id: 5, label: "Confidence" },
];

export default function TeamPlayerPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const router = useRouter();
  const { state, socket, connected, offsetMs } = useSessionState();
  const [teamId, setTeamId] = useState<string | null>(null);

  const [priority, setPriority] = useState<Priority | null>(null);
  const [action, setAction] = useState<ActionApproach | null>(null);
  const [leadership, setLeadership] = useState<LeadershipStyle | null>(null);
  const [allocation, setAllocation] = useState<ResourceAllocation>({
    shop_floor: 0,
    backroom: 0,
    customer_service: 0,
    problem_resolution: 0,
  });
  const [primaryIssueId, setPrimaryIssueId] = useState<string | null>(null);
  const [momentResponseId, setMomentResponseId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceLevel | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>(1);
  const [kpiView, setKpiView] = useState<"values" | "trends">("values");

  useEffect(() => {
    const stored = sessionStorage.getItem(`team:${sessionId}`);
    if (!stored) {
      router.replace("/");
      return;
    }
    setTeamId(stored);
    const rejoin = () => socket.emit("session:rejoin", { sessionId, teamId: stored });
    rejoin();
    // Re-announce ourselves whenever Socket.IO reconnects after a drop.
    socket.on("connect", rejoin);
    return () => {
      socket.off("connect", rejoin);
    };
  }, [sessionId, socket, router]);

  const team = useMemo<TeamPublic | undefined>(
    () => state?.teams.find((t) => t.id === teamId),
    [state, teamId],
  );

  const roundNumber = state?.round?.number;
  useEffect(() => {
    setPriority(null);
    setAction(null);
    setLeadership(null);
    setAllocation({ shop_floor: 0, backroom: 0, customer_service: 0, problem_resolution: 0 });
    setPrimaryIssueId(null);
    setMomentResponseId(null);
    setConfidence(null);
    setActiveTab(1);
  }, [roundNumber]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);
  useTeamHeartbeat(sessionId, teamId, connected);

  if (!connected || !state) return <LoadingScreen label="Connecting" />;
  if (!team) return <LoadingScreen label="Loading" />;

  const roundLocked = !state.round || state.round.phase === "locked" || state.round.phase === "reveal";
  const allocationTotal =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;

  const tabComplete: Record<TabId, boolean> = {
    1: !!priority && !!action,
    2: !!leadership && allocationTotal === 100,
    3: !!primaryIssueId,
    4: state.round?.moment ? !!momentResponseId : true,
    5: !!confidence,
  };
  const requiredAll =
    !!priority && !!action && !!leadership && allocationTotal === 100 && !!confidence &&
    (!state.round?.moment || !!momentResponseId);
  const inputsActive = !team.submitted && !roundLocked && state.phase === "round";
  const canSubmit = inputsActive && requiredAll;
  const guidance = teamGuidance(state, team.submitted);

  function submit() {
    if (!teamId || !priority || !action || !leadership || !confidence) return;
    const decision: Omit<Decision, "submittedAt"> = {
      priority,
      action,
      leadership,
      allocation,
      confidence,
      primaryIssueId: primaryIssueId ?? undefined,
      momentResponseId: momentResponseId ?? undefined,
    };
    socket.emit("team:submit_decision", { sessionId, teamId, decision });
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden">
      {!connected ? <ReconnectingOverlay /> : null}
      <TeamHeader
        team={team}
        round={state.round?.number ?? 0}
        totalRounds={ROUND_COUNT}
        phase={state.phase}
        timeLeftMs={timeLeft}
        roundPhase={state.round?.phase}
      />

      <div className="shrink-0 px-5 pt-4">
        <PhaseGuide tone={guidance.tone} headline={guidance.headline} body={guidance.body} />
      </div>

      {state.phase === "lobby" ? (
        <LobbyPanel code={state.code} teamName={team.name} />
      ) : state.phase === "briefing" ? (
        <BriefingPanel />
      ) : state.phase === "debrief" || state.phase === "finished" ? (
        <DebriefPanel team={team} rank={state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0} />
      ) : state.phase === "round_results" ? (
        <ResultsPanel team={team} state={state} totalRounds={ROUND_COUNT} />
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-[minmax(340px,1fr)_2fr] gap-4 p-4">
          <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
            <ZoneLabel label="Context" tone="neutral" />
            <KpiStrip team={team} view={kpiView} onViewChange={setKpiView} />
            <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,auto)] gap-3">
              <IssuesContextPanel issues={state.round?.issues ?? []} primaryIssueId={primaryIssueId} />
              <AlertsPanel state={state} />
            </div>
          </aside>

          <section className="flex min-w-0 flex-col min-h-0 gap-3">
            <ZoneLabel label="Decide" tone="brand" />
            <div className="min-h-0 flex-1">
              <DecisionPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabComplete={tabComplete}
                priority={priority}
                setPriority={setPriority}
                action={action}
                setAction={setAction}
                leadership={leadership}
                setLeadership={setLeadership}
                allocation={allocation}
                setAllocation={setAllocation}
                confidence={confidence}
                setConfidence={setConfidence}
                primaryIssueId={primaryIssueId}
                setPrimaryIssueId={setPrimaryIssueId}
                momentResponseId={momentResponseId}
                setMomentResponseId={setMomentResponseId}
                issues={state.round?.issues ?? []}
                moment={state.round?.moment}
                inputsActive={inputsActive}
                canSubmit={canSubmit}
                submitted={team.submitted}
                onSubmit={submit}
              />
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

function ZoneLabel({ label, tone }: { label: string; tone: "neutral" | "brand" }) {
  const color = tone === "brand" ? "text-brand-400" : "text-white/40";
  const dot = tone === "brand" ? "bg-brand-500" : "bg-white/30";
  return (
    <div className="flex items-center gap-2 pl-1">
      <span className={cn("h-1 w-1 rounded-full", dot)} />
      <span className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", color)}>{label}</span>
    </div>
  );
}

function TeamHeader({
  team,
  round,
  totalRounds,
  phase,
  timeLeftMs,
  roundPhase,
}: {
  team: TeamPublic;
  round: number;
  totalRounds: number;
  phase: string;
  timeLeftMs: number;
  roundPhase?: string;
}) {
  const clock = formatClock(timeLeftMs);
  const urgent = timeLeftMs < 60_000 && phase === "round";
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-semibold tracking-tighter text-white">{team.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
            {phase === "round" ? (
              <>
                <span>Shift {round} of {totalRounds}</span>
                <span className="flex items-center gap-1">
                  {Array.from({ length: totalRounds }).map((_, idx) => (
                    <span
                      key={idx}
                      className={cn("h-1.5 w-1.5 rounded-full", idx + 1 <= round ? "bg-brand-500" : "bg-white/15")}
                    />
                  ))}
                </span>
              </>
            ) : (
              <span>{phaseLabel(phase)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {roundPhase === "disrupted" ? (
          <Pill tone="risk" strong>
            <AlertTriangle className="h-3.5 w-3.5" /> Disruption
          </Pill>
        ) : null}
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-full px-4 py-1.5",
            urgent ? "bg-risk text-white" : "bg-surface-panel text-white ring-1 ring-white/10",
          )}
        >
          <Clock className={cn("h-4 w-4", urgent ? "text-white" : "text-white/60")} />
          <span className={cn("num text-2xl font-semibold")}>{clock}</span>
        </div>
        <div className="rounded-full bg-surface-panel px-4 py-1.5 ring-1 ring-white/10">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Score</div>
          <div className="num text-2xl font-semibold text-white">{team.score}</div>
        </div>
      </div>
    </header>
  );
}

function phaseLabel(p: string): string {
  switch (p) {
    case "lobby": return "Waiting in lobby";
    case "briefing": return "Briefing";
    case "round": return "Shift active";
    case "round_results": return "Reviewing shift";
    case "debrief": return "Debrief";
    case "finished": return "Session complete";
    default: return p;
  }
}

function KpiStrip({
  team,
  view,
  onViewChange,
}: {
  team: TeamPublic;
  view: "values" | "trends";
  onViewChange: (v: "values" | "trends") => void;
}) {
  const items: Array<{ key: KpiKey; label: string; value: number; inverted: boolean; series: number[] }> = (
    Object.keys(KPI_LABELS) as KpiKey[]
  ).map((k) => ({
    key: k,
    label: KPI_SHORT[k],
    value: team.kpis[k],
    inverted: KPI_INVERTED[k],
    series: team.trend[k],
  }));

  return (
    <Card tone="data" className="shrink-0 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-white/60" />
          <h3 className="text-[14px] font-semibold tracking-tight text-white">Store performance</h3>
        </div>
        <div className="flex rounded-full bg-white/5 p-0.5 ring-1 ring-white/10">
          <button
            type="button"
            onClick={() => onViewChange("values")}
            className={cn(
              "press rounded-full px-2.5 py-1 transition-colors",
              view === "values" ? "bg-white text-ink-900" : "text-white/60 hover:text-white/90",
            )}
            aria-label="Values"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("trends")}
            className={cn(
              "press rounded-full px-2.5 py-1 transition-colors",
              view === "trends" ? "bg-white text-ink-900" : "text-white/60 hover:text-white/90",
            )}
            aria-label="Trends"
          >
            <LineChart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {items.map((i) => (
          <div key={i.key} className="rounded-lg bg-white/5 px-2 py-1.5">
            <div className="truncate text-[10px] font-medium uppercase tracking-wide text-white/50">{i.label}</div>
            <div className="mt-0 flex items-baseline justify-between gap-1">
              <span className="num text-base font-semibold text-white">{i.value}</span>
              <Delta value={team.lastKpiDelta?.[i.key]} invertedMeaning={i.inverted} onDark />
            </div>
            <div className="mt-1">
              {view === "values" ? (
                <Bar value={i.value} inverted={i.inverted} onDark />
              ) : (
                <Sparkline values={i.series} inverted={i.inverted} width={90} height={18} onDark />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function IssuesContextPanel({ issues, primaryIssueId }: { issues: Issue[]; primaryIssueId: string | null }) {
  return (
    <Card tone="data" className="flex min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-white/60" />
        <h3 className="text-[14px] font-semibold tracking-tight text-white">Active issues</h3>
      </div>
      <div className="quiet-scroll min-h-0 flex-1 space-y-1.5 overflow-auto pr-0.5">
        {issues.slice(0, 3).map((i) => {
          const targeted = primaryIssueId === i.id;
          return (
            <div key={i.id} className="rounded-lg bg-white/5 p-2.5">
              <div className="mb-0.5 flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-semibold text-white">{i.title}</h4>
                {targeted ? (
                  <Pill tone="info" strong>
                    <Target className="h-3 w-3" /> Targeted
                  </Pill>
                ) : (
                  <Pill tone={SEVERITY_TONES[i.severity]} surface="dark">{i.severity}</Pill>
                )}
              </div>
              <p className="text-[11px] leading-snug text-white/70">{i.description}</p>
            </div>
          );
        })}
        {issues.length === 0 ? <p className="text-xs text-white/50">No active issues.</p> : null}
      </div>
    </Card>
  );
}

function AlertsPanel({ state }: { state: SessionStatePublic }) {
  const alerts = state.round?.alerts ?? [];
  const disruption = state.round?.disruption;
  return (
    <Card tone="data" className="flex min-h-0 flex-col p-3">
      <div className="mb-2 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-white/60" />
        <h3 className="text-[14px] font-semibold tracking-tight text-white">Alerts</h3>
      </div>
      <div className="quiet-scroll min-h-0 flex-1 space-y-1.5 overflow-auto pr-0.5">
        {disruption ? (
          <div className="rounded-lg bg-risk p-2.5 text-white">
            <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Disruption
            </div>
            <h4 className="text-[13px] font-semibold">{disruption.title}</h4>
            <p className="mt-0.5 text-[11px] leading-snug opacity-90">{disruption.message}</p>
          </div>
        ) : null}
        {alerts.slice(0, 2).map((a) => (
          <div key={a.id} className="rounded-lg bg-white/5 p-2.5">
            <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-white/50">
              {a.kind === "head_office" ? "Head office" : "Operational"}
            </div>
            <h4 className="text-[13px] font-semibold text-white">{a.title}</h4>
            <p className="mt-0.5 text-[11px] leading-snug text-white/70">{a.message}</p>
          </div>
        ))}
        {!disruption && alerts.length === 0 ? <p className="text-xs text-white/50">No alerts.</p> : null}
      </div>
    </Card>
  );
}

function DecisionPanel({
  activeTab,
  setActiveTab,
  tabComplete,
  priority,
  setPriority,
  action,
  setAction,
  leadership,
  setLeadership,
  allocation,
  setAllocation,
  confidence,
  setConfidence,
  primaryIssueId,
  setPrimaryIssueId,
  momentResponseId,
  setMomentResponseId,
  issues,
  moment,
  inputsActive,
  canSubmit,
  submitted,
  onSubmit,
}: {
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  tabComplete: Record<TabId, boolean>;
  priority: Priority | null;
  setPriority: (p: Priority) => void;
  action: ActionApproach | null;
  setAction: (a: ActionApproach) => void;
  leadership: LeadershipStyle | null;
  setLeadership: (l: LeadershipStyle) => void;
  allocation: ResourceAllocation;
  setAllocation: (a: ResourceAllocation) => void;
  confidence: ConfidenceLevel | null;
  setConfidence: (c: ConfidenceLevel) => void;
  primaryIssueId: string | null;
  setPrimaryIssueId: (id: string | null) => void;
  momentResponseId: string | null;
  setMomentResponseId: (id: string) => void;
  issues: Issue[];
  moment?: TeamMoment;
  inputsActive: boolean;
  canSubmit: boolean;
  submitted: boolean;
  onSubmit: () => void;
}) {
  const completedTabs = (Object.values(tabComplete) as boolean[]).filter(Boolean).length;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between px-5 pt-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Your decisions</div>
          <div className="text-lg font-semibold tracking-tight text-ink-900">
            {submitted ? "Locked in" : `${completedTabs} of ${TAB_DEFS.length} complete`}
          </div>
        </div>
        {submitted ? (
          <Pill tone="ok" strong>
            <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
          </Pill>
        ) : null}
      </div>

      <div className="px-5 pt-3">
        <div className="flex items-stretch gap-1 rounded-xl bg-ink-100 p-1">
          {TAB_DEFS.map((t) => (
            <TabButton
              key={t.id}
              step={t.id}
              label={t.label}
              active={activeTab === t.id}
              done={tabComplete[t.id]}
              onClick={() => setActiveTab(t.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5">
        {activeTab === 1 ? (
          <FocusStep
            priority={priority}
            setPriority={setPriority}
            action={action}
            setAction={setAction}
            disabled={!inputsActive}
          />
        ) : null}
        {activeTab === 2 ? (
          <TeamStep
            leadership={leadership}
            setLeadership={setLeadership}
            allocation={allocation}
            setAllocation={setAllocation}
            disabled={!inputsActive}
          />
        ) : null}
        {activeTab === 3 ? (
          <IssueStep
            issues={issues}
            primaryIssueId={primaryIssueId}
            setPrimaryIssueId={setPrimaryIssueId}
            disabled={!inputsActive}
          />
        ) : null}
        {activeTab === 4 ? (
          <PeopleStep
            moment={moment}
            momentResponseId={momentResponseId}
            setMomentResponseId={setMomentResponseId}
            disabled={!inputsActive}
          />
        ) : null}
        {activeTab === 5 ? (
          <ConfidenceStep
            confidence={confidence}
            setConfidence={setConfidence}
            disabled={!inputsActive}
          />
        ) : null}
      </div>

      <div className="shrink-0 border-t border-ink-100 px-5 py-4">
        <Button size="xl" onClick={onSubmit} disabled={!canSubmit} className="w-full">
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

function TabButton({
  step,
  label,
  active,
  done,
  onClick,
}: {
  step: TabId;
  label: string;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 transition-all",
        active
          ? "bg-white text-ink-900 shadow-card"
          : "text-ink-500 hover:bg-white/50 hover:text-ink-700",
      )}
    >
      {done ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
      ) : (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
            active ? "bg-brand-500 text-white" : "bg-ink-200 text-ink-600",
          )}
        >
          {step}
        </span>
      )}
      <span className={cn("truncate text-[13px]", active ? "font-semibold tracking-tight text-ink-900" : "font-medium")}>
        {label}
      </span>
    </button>
  );
}

function StepHeader({
  title,
  narrative,
  instruction,
  optional,
}: {
  title: string;
  narrative: string;
  instruction: string;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
        {optional ? <Pill tone="neutral">Optional</Pill> : null}
      </div>
      <p className="mt-0.5 text-[13px] text-ink-500">{narrative}</p>
      <p className="mt-1 text-[12px] font-medium text-ink-700">{instruction}</p>
    </div>
  );
}

function FocusStep({
  priority,
  setPriority,
  action,
  setAction,
  disabled,
}: {
  priority: Priority | null;
  setPriority: (p: Priority) => void;
  action: ActionApproach | null;
  setAction: (a: ActionApproach) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepHeader
          title="Priority focus"
          narrative="Under pressure, where does your attention go first?"
          instruction="Choose one of the options below."
        />
        <div className="mt-3">
          <RadioGrid<Priority>
            options={Object.keys(PRIORITY_LABELS) as Priority[]}
            labels={PRIORITY_LABELS}
            icons={PRIORITY_ICONS}
            value={priority}
            onChange={setPriority}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="border-t border-ink-100 pt-5">
        <StepHeader
          title="Action approach"
          narrative="How will you turn that priority into action?"
          instruction="Choose one of the options below."
        />
        <div className="mt-3">
          <RadioGrid<ActionApproach>
            options={Object.keys(ACTION_LABELS) as ActionApproach[]}
            labels={ACTION_LABELS}
            icons={ACTION_ICONS}
            value={action}
            onChange={setAction}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

function TeamStep({
  leadership,
  setLeadership,
  allocation,
  setAllocation,
  disabled,
}: {
  leadership: LeadershipStyle | null;
  setLeadership: (l: LeadershipStyle) => void;
  allocation: ResourceAllocation;
  setAllocation: (a: ResourceAllocation) => void;
  disabled: boolean;
}) {
  const total =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;
  return (
    <div className="space-y-6">
      <div>
        <StepHeader
          title="Leadership style"
          narrative="How will you lead your team through this shift?"
          instruction="Choose one of the options below."
        />
        <div className="mt-3">
          <RadioGrid<LeadershipStyle>
            options={Object.keys(LEADERSHIP_LABELS) as LeadershipStyle[]}
            labels={LEADERSHIP_LABELS}
            value={leadership}
            onChange={setLeadership}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="border-t border-ink-100 pt-5">
        <StepHeader
          title="Resource allocation"
          narrative="Where does your team's time go across the store?"
          instruction="Distribute 100% across the four areas."
        />
        <div className="mt-3">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className={cn("h-full transition-all", total === 100 ? "bg-ok" : "bg-brand-500")}
                style={{ width: `${Math.min(100, total)}%` }}
              />
            </div>
            <span className={cn("num text-sm font-semibold", total === 100 ? "text-ok" : "text-brand-600")}>
              {total}%
            </span>
          </div>
          <div className="space-y-2.5">
            {ALLOCATION_LABELS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.key} className="flex items-center gap-3">
                  <span className="flex w-44 shrink-0 items-center gap-2 text-[13px] font-medium text-ink-800">
                    <Icon className="h-4 w-4 text-ink-400" /> {a.label}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={allocation[a.key]}
                    disabled={disabled}
                    onChange={(e) => setAllocation({ ...allocation, [a.key]: Number(e.target.value) })}
                    className="flex-1 accent-brand-500"
                  />
                  <span className="w-12 text-right num text-sm font-medium text-ink-800">{allocation[a.key]}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueStep({
  issues,
  primaryIssueId,
  setPrimaryIssueId,
  disabled,
}: {
  issues: Issue[];
  primaryIssueId: string | null;
  setPrimaryIssueId: (id: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <StepHeader
        title="Primary issue"
        narrative="Targeting a specific issue sharpens its impact this shift."
        instruction="Tap one to target it. Optional. Leave unset to spread your effort."
        optional
      />
      <div className="mt-4">
        <IssuePicker
          issues={issues}
          value={primaryIssueId}
          onChange={setPrimaryIssueId}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function PeopleStep({
  moment,
  momentResponseId,
  setMomentResponseId,
  disabled,
}: {
  moment?: TeamMoment;
  momentResponseId: string | null;
  setMomentResponseId: (id: string) => void;
  disabled: boolean;
}) {
  if (!moment) {
    return (
      <StepHeader
        title="People moment"
        narrative="No people moment this shift."
        instruction="You can move on."
      />
    );
  }
  return (
    <div>
      <StepHeader
        title="People moment"
        narrative={`${moment.persona.name} (${moment.persona.role}) needs you.`}
        instruction="Read the situation below, then pick your response."
      />
      <div className="mt-4">
        <MomentBlock moment={moment} value={momentResponseId} onChange={setMomentResponseId} disabled={disabled} />
      </div>
    </div>
  );
}

function ConfidenceStep({
  confidence,
  setConfidence,
  disabled,
}: {
  confidence: ConfidenceLevel | null;
  setConfidence: (c: ConfidenceLevel) => void;
  disabled: boolean;
}) {
  const options: ConfidenceLevel[] = ["cautious", "measured", "confident"];
  return (
    <div>
      <StepHeader
        title="Confidence"
        narrative="How confident are you in your plan for this shift? Confidence multiplies every outcome, good and bad, across all of the decisions you just made."
        instruction="Choose one of the three levels below."
      />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = CONFIDENCE_ICONS[opt];
          const active = confidence === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => setConfidence(opt)}
              className={cn(
                "press flex flex-col items-start gap-2 rounded-xl p-4 text-left transition-colors",
                active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-900 hover:bg-ink-200",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", active ? "text-brand-400" : "text-ink-500")} />
                <span className="text-sm font-semibold">{CONFIDENCE_LABELS[opt]}</span>
              </div>
              <span className={cn("text-[11px] leading-snug", active ? "text-white/80" : "text-ink-600")}>
                {CONFIDENCE_DESCRIPTIONS[opt]}
              </span>
              <span
                className={cn(
                  "num rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  active ? "bg-brand-500 text-white" : "bg-white text-ink-700 ring-1 ring-ink-200",
                )}
              >
                ×{opt === "cautious" ? "0.75" : opt === "confident" ? "1.35" : "1.00"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioGrid<T extends string>({
  options,
  labels,
  icons,
  value,
  onChange,
  disabled,
}: {
  options: T[];
  labels: Record<T, string>;
  icons?: Record<T, React.ComponentType<{ className?: string }>>;
  value: T | null;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((opt) => {
        const active = value === opt;
        const Icon: React.ComponentType<{ className?: string }> | undefined = icons?.[opt];
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={cn(
              "press flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors",
              active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-900 hover:bg-ink-200",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {Icon ? <Icon className={cn("h-5 w-5 shrink-0", active ? "text-brand-400" : "text-ink-500")} /> : null}
            <span className="truncate">{labels[opt]}</span>
          </button>
        );
      })}
    </div>
  );
}

function IssuePicker({
  issues,
  value,
  onChange,
  disabled,
}: {
  issues: Issue[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      {issues.map((i) => {
        const active = value === i.id;
        return (
          <button
            key={i.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(active ? null : i.id)}
            className={cn(
              "press w-full rounded-xl px-4 py-3 text-left transition-colors",
              active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-900 hover:bg-ink-200",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">{i.title}</h4>
                <p className={cn("mt-0.5 text-xs", active ? "text-white/80" : "text-ink-600")}>{i.description}</p>
              </div>
              <Pill tone={active ? "info" : SEVERITY_TONES[i.severity]} strong={active}>
                {i.severity}
              </Pill>
            </div>
            {active ? (
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400">
                <Target className="h-3 w-3" /> Targeted · tap again to clear
              </div>
            ) : null}
          </button>
        );
      })}
      {issues.length === 0 ? <p className="text-xs text-ink-500">No active issues this shift.</p> : null}
    </div>
  );
}

function MomentBlock({
  moment,
  value,
  onChange,
  disabled,
}: {
  moment: TeamMoment;
  value: string | null;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex items-start gap-3 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink-700 ring-1 ring-ink-200">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink-900">
            {moment.persona.name}
            <span className="ml-2 text-xs font-normal text-ink-500">
              {moment.persona.role} · {moment.persona.tenure}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-ink-700">{moment.situation}</p>
          <p className="mt-2 flex items-start gap-1.5 text-[13px] italic text-brand-700">
            <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0" /> {moment.prompt}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {moment.options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={cn(
                "press rounded-xl px-4 py-3 text-left text-[13px] leading-snug transition-colors",
                active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-900 hover:bg-ink-200",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LobbyPanel({ code, teamName }: { code: string; teamName: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md p-8 text-center">
        <div className="mb-3 flex justify-center text-brand-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="text-xl font-semibold tracking-tighter text-ink-900">Waiting for the facilitator</h2>
        <p className="mt-2 text-sm text-ink-600">
          You're checked in as <span className="font-semibold text-ink-900">{teamName}</span>. The briefing will start shortly.
        </p>
        <div className="mt-5 rounded-2xl bg-ink-900 px-4 py-4 text-center text-white">
          <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">Session code</div>
          <div className="num mt-0.5 text-3xl font-semibold tracking-[0.3em]">{code}</div>
        </div>
      </Card>
    </div>
  );
}

function BriefingPanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-brand-600">Today you are</div>
            <div className="text-2xl font-semibold tracking-tighter text-ink-900">The store manager</div>
            <p className="mt-1 text-sm text-ink-600">
              {ROUND_COUNT} shifts · 5 minutes each · 4 decision steps per shift. Each shift moves live KPIs and 4 hidden drivers: trust, capability, safety risk, and leadership consistency.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Here's what you'll see</div>
            <div className="text-lg font-semibold tracking-tight text-ink-900">Where every step lives</div>
          </div>
          <Pill tone="info" strong>
            <Clock className="h-3 w-3" /> 5 min per shift
          </Pill>
        </div>
        <ScreenMap />
      </Card>
    </div>
  );
}

function ScreenMap() {
  return (
    <div className="rounded-2xl bg-surface-stage p-3 ring-1 ring-white/5">
      <div className="flex items-center justify-between rounded-lg bg-surface-panel px-3 py-2 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-brand-500" />
          <div className="h-2 w-24 rounded bg-white/15" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-14 rounded-full bg-white/10" />
          <div className="h-5 w-14 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[minmax(180px,1fr)_2fr] gap-2">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/50">Context</span>
          </div>
          <MapZone label="Store KPIs" hint="Live numbers + trends" />
          <MapZone label="Active issues" hint="3 live pressures" />
          <MapZone label="Alerts" hint="Head office + disruption" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-400">Decide</span>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-ink-200">
            <div className="mb-2 flex items-center gap-1 rounded-lg bg-ink-100 p-1">
              <TabPreview n={1} label="Focus" />
              <TabPreview n={2} label="Team" />
              <TabPreview n={3} label="Respond" />
              <TabPreview n={4} label="Confidence" />
            </div>
            <div className="space-y-1 text-[11px]">
              <MiniStep tab="Step 1 · Focus" items={["Priority focus", "Action approach"]} />
              <MiniStep tab="Step 2 · Team" items={["Leadership style", "Resource allocation"]} />
              <MiniStep tab="Step 3 · Respond" items={["Primary issue (optional)", "People moment"]} />
              <MiniStep tab="Step 4 · Confidence" items={["Confidence level"]} />
            </div>
            <div className="mt-2 h-7 rounded-md bg-brand-500 text-center text-[10px] font-semibold leading-7 text-white">
              Submit decision
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapZone({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-surface-panel p-2.5 ring-1 ring-white/10">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-white">{label}</div>
        <div className="text-[11px] text-white/50">{hint}</div>
      </div>
    </div>
  );
}

function TabPreview({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-ink-800 shadow-card">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-500 text-[8px] font-semibold text-white">
        {n}
      </span>
      {label}
    </div>
  );
}

function MiniStep({ tab, items }: { tab: string; items: string[] }) {
  return (
    <div className="rounded-md bg-ink-50 px-2 py-1.5 ring-1 ring-ink-100">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-brand-600">{tab}</div>
      <div className="text-[11px] text-ink-700">{items.join(" · ")}</div>
    </div>
  );
}

function ResultsPanel({
  team,
  state,
  totalRounds,
}: {
  team: TeamPublic;
  state: SessionStatePublic;
  totalRounds: number;
}) {
  const rank = state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0;
  const kpis: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
  return (
    <div className="flex flex-1 items-center justify-center overflow-hidden p-5">
      <Card className="w-full max-w-4xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Pill tone="info">Shift {state.round?.number} of {totalRounds} complete</Pill>
            <h2 className="mt-2 text-2xl font-semibold tracking-tighter text-ink-900">How the shift played out</h2>
            <p className="text-sm text-ink-500">Your facilitator will move on when the room is ready.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-ink-900 px-4 py-2 text-center text-white">
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">Rank</div>
              <div className="num text-3xl font-semibold">#{rank}</div>
            </div>
            <div className="rounded-2xl bg-ink-100 px-4 py-2 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">Shift score</div>
              <div
                className={cn(
                  "num text-3xl font-semibold",
                  team.lastMovement > 0 ? "text-ok" : team.lastMovement < 0 ? "text-risk" : "text-ink-900",
                )}
              >
                {team.lastMovement > 0 ? "+" : ""}
                {team.lastMovement}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {kpis.map((k) => (
            <div key={k}>
              <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-500">{KPI_SHORT[k]}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="num text-2xl font-semibold text-ink-900">{team.kpis[k]}</span>
                <Delta value={team.lastKpiDelta?.[k]} invertedMeaning={KPI_INVERTED[k]} />
              </div>
              <div className="mt-2">
                <Sparkline values={team.trend[k]} inverted={KPI_INVERTED[k]} width={100} height={22} />
              </div>
            </div>
          ))}
        </div>

        {team.revealedHidden ? (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Pill tone="info">Hidden drivers revealed</Pill>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {(Object.keys(HIDDEN_LABELS) as Array<keyof typeof HIDDEN_LABELS>).map((h) => (
                <div key={h}>
                  <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-500">
                    {HIDDEN_LABELS[h]}
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="num text-xl font-semibold text-ink-900">{team.revealedHidden![h]}</span>
                    <Delta value={team.lastHiddenDelta?.[h]} invertedMeaning={HIDDEN_INVERTED[h]} />
                  </div>
                  <div className="mt-1.5">
                    <Sparkline values={team.trend[h]} inverted={HIDDEN_INVERTED[h]} width={80} height={18} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-900">
            <span className="text-[11px] font-medium uppercase tracking-wide">Strength</span>
            <div className="text-base font-semibold">{team.strength ?? "-"}</div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-900">
            <span className="text-[11px] font-medium uppercase tracking-wide">Risk</span>
            <div className="text-base font-semibold">{team.risk ?? "-"}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DebriefPanel({ team, rank }: { team: TeamPublic; rank: number }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-xl p-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tighter text-ink-900">Session complete</h2>
        <p className="mt-2 text-sm text-ink-500">Thanks, {team.name}. Your facilitator will lead the debrief.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ink-900 p-5 text-white">
            <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">Final rank</div>
            <div className="num text-5xl font-semibold">#{rank}</div>
          </div>
          <div className="rounded-2xl bg-ink-100 p-5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-ink-500">Final score</div>
            <div className="num text-5xl font-semibold text-ink-900">{team.score}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-2 text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

function ReconnectingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-start justify-center pt-20">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink-900/90 px-5 py-3 shadow-panel ring-1 ring-white/10 backdrop-blur">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        <div className="text-sm text-white">
          <span className="font-semibold">Reconnecting</span>
          <span className="ml-2 text-white/60">Your progress is safe.</span>
        </div>
      </div>
    </div>
  );
}
