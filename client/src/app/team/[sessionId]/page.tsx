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
} from "@sim/shared";
import { Bar, Button, Card, cn, Delta, PhaseGuide, Pill, SectionTitle, Sparkline, StepBadge } from "@/components/ui";
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

type TabId = "focus" | "team" | "respond" | "confidence";

const TAB_DEFS: Array<{ id: TabId; label: string; stepRange: string }> = [
  { id: "focus", label: "Focus", stepRange: "Steps 1 – 2" },
  { id: "team", label: "Team", stepRange: "Steps 3 – 4" },
  { id: "respond", label: "Respond", stepRange: "Steps 5 – 6" },
  { id: "confidence", label: "Confidence", stepRange: "Step 7" },
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
  const [activeTab, setActiveTab] = useState<TabId>("focus");
  const [kpiView, setKpiView] = useState<"values" | "trends">("values");

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
    setPriority(null);
    setAction(null);
    setLeadership(null);
    setAllocation({ shop_floor: 0, backroom: 0, customer_service: 0, problem_resolution: 0 });
    setPrimaryIssueId(null);
    setMomentResponseId(null);
    setConfidence(null);
    setActiveTab("focus");
  }, [roundNumber]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);

  if (!connected || !state) return <LoadingScreen label="Connecting" />;
  if (!team) return <LoadingScreen label="Loading" />;

  const roundLocked = !state.round || state.round.phase === "locked" || state.round.phase === "reveal";
  const allocationTotal =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;

  const stepComplete: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, boolean> = {
    1: !!priority,
    2: !!action,
    3: !!leadership,
    4: allocationTotal === 100,
    5: !!primaryIssueId,
    6: !!momentResponseId,
    7: !!confidence,
  };
  const tabComplete: Record<TabId, boolean> = {
    focus: stepComplete[1] && stepComplete[2],
    team: stepComplete[3] && stepComplete[4],
    respond: state.round?.moment ? stepComplete[6] : true, // issue (5) is optional
    confidence: stepComplete[7],
  };
  const requiredAll =
    stepComplete[1] && stepComplete[2] && stepComplete[3] && stepComplete[4] && stepComplete[7] &&
    (!state.round?.moment || stepComplete[6]);
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-surface-base">
      <TeamHeader
        team={team}
        round={state.round?.number ?? 0}
        phase={state.phase}
        timeLeftMs={timeLeft}
        roundPhase={state.round?.phase}
      />

      <div className="shrink-0 px-5 pt-5">
        <PhaseGuide tone={guidance.tone} headline={guidance.headline} body={guidance.body} />
      </div>

      {state.phase === "lobby" ? (
        <LobbyPanel code={state.code} teamName={team.name} />
      ) : state.phase === "briefing" ? (
        <BriefingPanel />
      ) : state.phase === "debrief" || state.phase === "finished" ? (
        <DebriefPanel team={team} rank={state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0} />
      ) : state.phase === "round_results" ? (
        <ResultsPanel team={team} state={state} />
      ) : (
        <main className="grid min-h-0 flex-1 grid-cols-[minmax(340px,1fr)_2fr] gap-5 p-5">
          <aside className="flex min-h-0 flex-col gap-4">
            <ContextLabel />
            <KpiStrip team={team} view={kpiView} onViewChange={setKpiView} />
            {state.round?.moment ? (
              <PeopleContextPanel moment={state.round.moment} responseId={momentResponseId} />
            ) : null}
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4">
              <IssuesContextPanel issues={state.round?.issues ?? []} primaryIssueId={primaryIssueId} />
              <AlertsPanel state={state} />
            </div>
          </aside>

          <section className="flex min-w-0 flex-col min-h-0">
            <DecisionPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabComplete={tabComplete}
              stepComplete={stepComplete}
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
          </section>
        </main>
      )}
    </div>
  );
}

function ContextLabel() {
  return (
    <div className="flex items-center gap-2 pl-1">
      <span className="h-1 w-1 rounded-full bg-ink-400" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-500">Context</span>
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
    <header className="flex shrink-0 items-center justify-between gap-4 px-5 pt-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-semibold tracking-tighter text-ink-900">{team.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
            {phase === "round" ? (
              <>
                <span>Shift {round} of 3</span>
                <span className="flex items-center gap-1">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={cn("h-1.5 w-1.5 rounded-full", n <= round ? "bg-brand-500" : "bg-ink-200")}
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
            urgent ? "bg-risk text-white" : "bg-surface-raised ring-1 ring-ink-200/80",
          )}
        >
          <Clock className={cn("h-4 w-4", urgent ? "text-white" : "text-ink-500")} />
          <span className={cn("num text-2xl font-semibold", urgent ? "text-white" : "text-ink-900")}>{clock}</span>
        </div>
        <div className="rounded-full bg-surface-raised px-4 py-1.5 ring-1 ring-ink-200/80">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Score</div>
          <div className="num text-2xl font-semibold text-ink-900">{team.score}</div>
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

function DataCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-surface-muted p-4 ring-1 ring-ink-200/60", className)}>
      {children}
    </div>
  );
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
    <DataCard>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-ink-500" />
          <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">Store performance</h3>
        </div>
        <div className="flex rounded-full bg-surface-raised p-0.5 ring-1 ring-ink-200/80">
          <button
            type="button"
            onClick={() => onViewChange("values")}
            className={cn(
              "press rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              view === "values" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-800",
            )}
            aria-label="Values"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("trends")}
            className={cn(
              "press rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
              view === "trends" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-800",
            )}
            aria-label="Trends"
          >
            <LineChart className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((i) => (
          <div key={i.key} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-500">{i.label}</div>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="num text-lg font-semibold text-ink-900">{i.value}</span>
                <Delta value={team.lastKpiDelta?.[i.key]} invertedMeaning={i.inverted} />
              </div>
            </div>
            <div className="w-24 shrink-0">
              {view === "values" ? (
                <Bar value={i.value} inverted={i.inverted} />
              ) : (
                <Sparkline values={i.series} inverted={i.inverted} width={96} height={20} />
              )}
            </div>
          </div>
        ))}
      </div>
    </DataCard>
  );
}

function PeopleContextPanel({ moment, responseId }: { moment: TeamMoment; responseId: string | null }) {
  const chosen = responseId ? moment.options.find((o) => o.id === responseId) : null;
  return (
    <DataCard>
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-brand-600">
        <HeartHandshake className="h-3.5 w-3.5" /> People moment
      </div>
      <div className="mt-2 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink-600 ring-1 ring-ink-200/80">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold tracking-tight text-ink-900">{moment.persona.name}</div>
          <div className="text-xs text-ink-500">
            {moment.persona.role} &middot; {moment.persona.tenure}
          </div>
        </div>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-ink-700">{moment.situation}</p>
      <p className="mt-2 text-[13px] italic text-brand-700">{moment.prompt}</p>
      {chosen ? (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
          <span className="font-medium">Your response:</span> {chosen.label}
        </div>
      ) : (
        <div className="mt-3 rounded-lg bg-surface-raised px-3 py-2 text-[12px] text-ink-600 ring-1 ring-ink-200/60">
          Respond in <span className="font-semibold text-ink-900">Respond</span> tab.
        </div>
      )}
    </DataCard>
  );
}

function IssuesContextPanel({ issues, primaryIssueId }: { issues: Issue[]; primaryIssueId: string | null }) {
  return (
    <DataCard className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-ink-500" />
        <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">Active issues</h3>
      </div>
      <div className="quiet-scroll flex-1 space-y-2 overflow-auto">
        {issues.map((i) => {
          const targeted = primaryIssueId === i.id;
          return (
            <div key={i.id} className="rounded-lg bg-surface-raised p-3 ring-1 ring-ink-200/60">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-semibold text-ink-900">{i.title}</h4>
                {targeted ? (
                  <Pill tone="info" strong>
                    <Target className="h-3 w-3" /> Targeted
                  </Pill>
                ) : (
                  <Pill tone={SEVERITY_TONES[i.severity]}>{i.severity}</Pill>
                )}
              </div>
              <p className="text-xs text-ink-600">{i.description}</p>
            </div>
          );
        })}
        {issues.length === 0 ? <p className="text-xs text-ink-500">No active issues.</p> : null}
      </div>
    </DataCard>
  );
}

function AlertsPanel({ state }: { state: SessionStatePublic }) {
  const alerts = state.round?.alerts ?? [];
  const disruption = state.round?.disruption;
  return (
    <DataCard className="flex min-h-0 flex-col">
      <div className="mb-3 flex items-center gap-2">
        <BellRing className="h-4 w-4 text-ink-500" />
        <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">Alerts</h3>
      </div>
      <div className="quiet-scroll flex-1 space-y-2 overflow-auto">
        {disruption ? (
          <div className="rounded-lg bg-risk p-3 text-white">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Disruption
            </div>
            <h4 className="text-[13px] font-semibold">{disruption.title}</h4>
            <p className="mt-0.5 text-xs opacity-90">{disruption.message}</p>
          </div>
        ) : null}
        {alerts.map((a) => (
          <div key={a.id} className="rounded-lg bg-surface-raised p-3 ring-1 ring-ink-200/60">
            <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
              {a.kind === "head_office" ? "Head office" : "Operational"}
            </div>
            <h4 className="text-[13px] font-semibold text-ink-900">{a.title}</h4>
            <p className="mt-0.5 text-xs text-ink-600">{a.message}</p>
          </div>
        ))}
        {!disruption && alerts.length === 0 ? <p className="text-xs text-ink-500">No alerts.</p> : null}
      </div>
    </DataCard>
  );
}

function DecisionPanel({
  activeTab,
  setActiveTab,
  tabComplete,
  stepComplete,
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
  stepComplete: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, boolean>;
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
  const completedSteps = (Object.values(stepComplete) as boolean[]).filter(Boolean).length;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-2 pl-1">
        <span className="h-1 w-1 rounded-full bg-brand-500" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-600">Decide</span>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Your decision</div>
            <div className="text-lg font-semibold tracking-tight text-ink-900">
              {submitted ? "Locked in" : `${completedSteps} of 7 complete`}
            </div>
          </div>
          {submitted ? (
            <Pill tone="ok" strong>
              <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
            </Pill>
          ) : (
            <div className="flex items-center gap-1">
              {TAB_DEFS.map((t) => (
                <span
                  key={t.id}
                  className={cn("h-1.5 w-10 rounded-full", tabComplete[t.id] ? "bg-ok" : "bg-ink-200")}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-stretch border-b border-ink-100 px-2">
          {TAB_DEFS.map((t) => (
            <TabButton
              key={t.id}
              label={t.label}
              stepRange={t.stepRange}
              active={activeTab === t.id}
              done={tabComplete[t.id]}
              onClick={() => setActiveTab(t.id)}
            />
          ))}
        </div>

        <div className="quiet-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6">
          {activeTab === "focus" ? (
            <>
              <StepEditor step={1} title="Priority focus" description="Select where you want to prioritise your focus this shift." complete={stepComplete[1]}>
                <RadioGrid<Priority>
                  options={Object.keys(PRIORITY_LABELS) as Priority[]}
                  labels={PRIORITY_LABELS}
                  icons={PRIORITY_ICONS}
                  value={priority}
                  onChange={setPriority}
                  disabled={!inputsActive}
                />
              </StepEditor>
              <StepEditor step={2} title="Action approach" description="Choose how you'll turn that priority into action." complete={stepComplete[2]}>
                <RadioGrid<ActionApproach>
                  options={Object.keys(ACTION_LABELS) as ActionApproach[]}
                  labels={ACTION_LABELS}
                  icons={ACTION_ICONS}
                  value={action}
                  onChange={setAction}
                  disabled={!inputsActive}
                />
              </StepEditor>
            </>
          ) : null}

          {activeTab === "team" ? (
            <>
              <StepEditor step={3} title="Leadership style" description="Pick the stance you'll lead your team with." complete={stepComplete[3]}>
                <RadioGrid<LeadershipStyle>
                  options={Object.keys(LEADERSHIP_LABELS) as LeadershipStyle[]}
                  labels={LEADERSHIP_LABELS}
                  value={leadership}
                  onChange={setLeadership}
                  disabled={!inputsActive}
                />
              </StepEditor>
              <StepEditor
                step={4}
                title="Resource allocation"
                description="Deploy your team's time across the store. Must total 100%."
                complete={stepComplete[4]}
              >
                <AllocationEditor allocation={allocation} setAllocation={setAllocation} disabled={!inputsActive} />
              </StepEditor>
            </>
          ) : null}

          {activeTab === "respond" ? (
            <>
              <StepEditor
                step={5}
                title="Primary issue"
                description="Target one live issue from the context on the left to sharpen its impact."
                complete={stepComplete[5]}
                optional
              >
                <IssuePicker
                  issues={issues}
                  value={primaryIssueId}
                  onChange={setPrimaryIssueId}
                  disabled={!inputsActive}
                />
              </StepEditor>
              <StepEditor
                step={6}
                title="People moment"
                description={moment ? `Your response to ${moment.persona.name} (${moment.persona.role}).` : "No people moment this shift."}
                complete={stepComplete[6]}
              >
                <MomentEditor moment={moment} value={momentResponseId} onChange={setMomentResponseId} disabled={!inputsActive} />
              </StepEditor>
            </>
          ) : null}

          {activeTab === "confidence" ? (
            <StepEditor
              step={7}
              title="Confidence"
              description="How hard are you pressing this call? Confidence multiplies upside and downside."
              complete={stepComplete[7]}
            >
              <ConfidenceGroup value={confidence} onChange={setConfidence} disabled={!inputsActive} />
            </StepEditor>
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
    </div>
  );
}

function TabButton({
  label,
  stepRange,
  active,
  done,
  onClick,
}: {
  label: string;
  stepRange: string;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors",
        active ? "text-ink-900" : "text-ink-500 hover:text-ink-700",
      )}
    >
      <span className="flex items-center gap-2">
        {done ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ok text-white">
            <CheckCircle2 className="h-3 w-3" />
          </span>
        ) : (
          <span className="h-4 w-4 rounded-full bg-ink-100" />
        )}
        <span className={cn("text-sm", active ? "font-semibold tracking-tight" : "font-medium")}>{label}</span>
      </span>
      <span className="ml-6 text-[10px] uppercase tracking-wider text-ink-400">{stepRange}</span>
      {active ? <span className="absolute -bottom-px left-0 h-[2px] w-full bg-ink-900" /> : null}
    </button>
  );
}

function StepEditor({
  step,
  title,
  description,
  complete,
  optional,
  children,
}: {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  description: string;
  complete: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <StepBadge number={step} tone={complete ? "ok" : "neutral"} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
            {optional ? <Pill tone="neutral">Optional</Pill> : null}
          </div>
          <p className="text-[13px] text-ink-500">{description}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
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
    <div className="grid grid-cols-2 gap-3">
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

function AllocationEditor({
  allocation,
  setAllocation,
  disabled,
}: {
  allocation: ResourceAllocation;
  setAllocation: (a: ResourceAllocation) => void;
  disabled: boolean;
}) {
  const total =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;
  return (
    <div>
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
                <Target className="h-3 w-3" /> Targeted &middot; tap again to clear
              </div>
            ) : null}
          </button>
        );
      })}
      {issues.length === 0 ? <p className="text-xs text-ink-500">No active issues this shift.</p> : null}
    </div>
  );
}

function MomentEditor({
  moment,
  value,
  onChange,
  disabled,
}: {
  moment?: TeamMoment;
  value: string | null;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  if (!moment) {
    return <p className="text-sm text-ink-500">You can move on.</p>;
  }
  return (
    <div>
      <div className="mb-3 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200/60">
        <p className="text-[13px] leading-snug text-ink-700">{moment.situation}</p>
        <p className="mt-2 flex items-start gap-1.5 text-[13px] italic text-brand-700">
          <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0" /> {moment.prompt}
        </p>
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

function ConfidenceGroup({
  value,
  onChange,
  disabled,
}: {
  value: ConfidenceLevel | null;
  onChange: (v: ConfidenceLevel) => void;
  disabled: boolean;
}) {
  const options: ConfidenceLevel[] = ["cautious", "measured", "confident"];
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((opt) => {
        const Icon = CONFIDENCE_ICONS[opt];
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
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
                active ? "bg-brand-500 text-white" : "bg-surface-raised text-ink-700",
              )}
            >
              ×{opt === "cautious" ? "0.75" : opt === "confident" ? "1.35" : "1.00"}
            </span>
          </button>
        );
      })}
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
    <div className="quiet-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
      <Card tone="dark" className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-brand-400">Today you are</div>
            <div className="text-2xl font-semibold tracking-tighter">The store manager</div>
            <p className="mt-1 text-sm text-ink-300">
              3 shifts · 4 minutes each · 7 decisions per shift. Decisions move live KPIs and 4 hidden drivers: trust, capability, safety risk, and leadership consistency.
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
            <Clock className="h-3 w-3" /> 4 min per shift
          </Pill>
        </div>
        <ScreenMap />
      </Card>
    </div>
  );
}

function ScreenMap() {
  return (
    <div className="rounded-2xl bg-surface-base p-3 ring-1 ring-ink-200/60">
      {/* Fake header bar */}
      <div className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 ring-1 ring-ink-200/60">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-ink-900" />
          <div className="h-2 w-24 rounded bg-ink-200" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-14 rounded-full bg-ink-100" />
          <div className="h-5 w-14 rounded-full bg-ink-100" />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-[minmax(180px,1fr)_2fr] gap-2">
        {/* Left column: context */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-ink-400" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-500">Context</span>
          </div>
          <MapZone label="Store KPIs" hint="Live numbers + trends" />
          <MapZone label="People moment" hint="Name, situation, prompt" steps={[6]} stepLabel="Step 6 · context" />
          <MapZone label="Active issues" hint="3 live pressures" steps={[5]} stepLabel="Step 5 · context" />
          <MapZone label="Alerts" hint="Head office + disruption" />
        </div>

        {/* Right column: decisions */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-600">Decide</span>
          </div>
          <div className="rounded-lg bg-surface-raised p-3 ring-1 ring-ink-200/60">
            <div className="mb-2 flex items-center gap-1">
              <TabPreview label="Focus" />
              <TabPreview label="Team" />
              <TabPreview label="Respond" />
              <TabPreview label="Confidence" />
            </div>
            <div className="space-y-1.5 text-[11px]">
              <StepLine number={1} label="Priority focus" tab="Focus" />
              <StepLine number={2} label="Action approach" tab="Focus" />
              <StepLine number={3} label="Leadership style" tab="Team" />
              <StepLine number={4} label="Resource allocation" tab="Team" />
              <StepLine number={5} label="Primary issue" tab="Respond" note="context on left" optional />
              <StepLine number={6} label="People moment" tab="Respond" note="context on left" />
              <StepLine number={7} label="Confidence" tab="Confidence" />
            </div>
            <div className="mt-2 h-7 rounded-md bg-ink-900 text-center text-[10px] font-semibold leading-7 text-white">
              Submit decision
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapZone({
  label,
  hint,
  steps,
  stepLabel,
}: {
  label: string;
  hint: string;
  steps?: number[];
  stepLabel?: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-surface-raised p-2.5 ring-1 ring-ink-200/60">
      {steps && steps[0] !== undefined ? (
        <StepBadge number={steps[0]} size="sm" />
      ) : (
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-300" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-ink-900">{label}</div>
        <div className="text-[11px] text-ink-500">{hint}</div>
        {stepLabel ? (
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-600">{stepLabel}</div>
        ) : null}
      </div>
    </div>
  );
}

function TabPreview({ label }: { label: string }) {
  return (
    <div className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-semibold text-ink-700">{label}</div>
  );
}

function StepLine({
  number,
  label,
  tab,
  note,
  optional,
}: {
  number: number;
  label: string;
  tab: string;
  note?: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-muted px-2 py-1.5">
      <StepBadge number={number} size="sm" />
      <span className="flex-1 font-semibold text-ink-900">{label}</span>
      {optional ? <span className="text-[10px] text-ink-500">optional</span> : null}
      <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-semibold text-ink-700 ring-1 ring-ink-200">
        {tab}
      </span>
      {note ? <span className="text-[10px] italic text-ink-500">{note}</span> : null}
    </div>
  );
}

function ResultsPanel({ team, state }: { team: TeamPublic; state: SessionStatePublic }) {
  const rank = state.leaderboard.find((l) => l.teamId === team.id)?.rank ?? 0;
  const kpis: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
  return (
    <div className="quiet-scroll flex flex-1 items-center justify-center overflow-auto p-5">
      <Card className="w-full max-w-4xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <Pill tone="info">Shift {state.round?.number} complete</Pill>
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
            <div className="text-base font-semibold">{team.strength ?? "—"}</div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-900">
            <span className="text-[11px] font-medium uppercase tracking-wide">Risk</span>
            <div className="text-base font-semibold">{team.risk ?? "—"}</div>
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
      <div className="flex items-center gap-2 text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
