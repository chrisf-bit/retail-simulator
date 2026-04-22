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

type DecisionTab = "strategy" | "resource" | "confidence";

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
  const [activeTab, setActiveTab] = useState<DecisionTab>("strategy");
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
    setActiveTab("strategy");
  }, [roundNumber]);

  const endsAt = state?.round?.phase === "active" || state?.round?.phase === "disrupted" ? state?.round?.endsAt : undefined;
  const timeLeft = useCountdown(endsAt, offsetMs);

  if (!connected || !state) return <LoadingScreen label="Connecting" />;
  if (!team) return <LoadingScreen label="Loading" />;

  const roundLocked = !state.round || state.round.phase === "locked" || state.round.phase === "reveal";
  const allocationTotal =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;
  const tabComplete = {
    strategy: !!priority && !!action && !!leadership,
    resource: allocationTotal === 100,
    confidence: !!confidence,
  };
  const allChosen = tabComplete.strategy && tabComplete.resource && tabComplete.confidence;
  const inputsActive = !team.submitted && !roundLocked && state.phase === "round";
  const canSubmit = inputsActive && allChosen;
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
        <main className="flex min-h-0 flex-1 gap-5 p-5">
          <section className="flex min-w-0 flex-1 flex-col gap-4">
            <KpiStrip team={team} view={kpiView} onViewChange={setKpiView} />
            {state.round?.moment ? (
              <PeopleMomentPanel
                moment={state.round.moment}
                responseId={momentResponseId}
                onSelect={setMomentResponseId}
                disabled={!inputsActive}
              />
            ) : null}
            <div className="grid min-h-0 flex-1 grid-cols-5 gap-4">
              <IssuesPanel
                state={state}
                primaryIssueId={primaryIssueId}
                onSelect={setPrimaryIssueId}
                disabled={!inputsActive}
              />
              <AlertsPanel state={state} />
            </div>
          </section>

          <section className="flex w-[480px] shrink-0 min-h-0 flex-col">
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
              momentResponseId={momentResponseId}
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
    <Card className="p-5">
      <SectionTitle
        icon={<Gauge className="h-4 w-4" />}
        title="Store performance"
        subtitle={view === "values" ? "Current standings" : "Past 4 months plus rounds played"}
        right={
          <div className="flex rounded-full bg-ink-100 p-1">
            <button
              type="button"
              onClick={() => onViewChange("values")}
              className={cn(
                "press flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                view === "values" ? "bg-surface-raised text-ink-900 shadow-card" : "text-ink-500 hover:text-ink-800",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Values
            </button>
            <button
              type="button"
              onClick={() => onViewChange("trends")}
              className={cn(
                "press flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                view === "trends" ? "bg-surface-raised text-ink-900 shadow-card" : "text-ink-500 hover:text-ink-800",
              )}
            >
              <LineChart className="h-3.5 w-3.5" /> Trends
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-5 gap-3">
        {items.map((i) => (
          <div key={i.key} className="min-w-0">
            <div className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-500">{i.label}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="num text-3xl font-semibold text-ink-900">{i.value}</span>
              <Delta value={team.lastKpiDelta?.[i.key]} invertedMeaning={i.inverted} />
            </div>
            <div className="mt-2">
              {view === "values" ? (
                <Bar value={i.value} inverted={i.inverted} />
              ) : (
                <Sparkline values={i.series} inverted={i.inverted} width={140} height={22} />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PeopleMomentPanel({
  moment,
  responseId,
  onSelect,
  disabled,
}: {
  moment: TeamMoment;
  responseId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-brand-600">
            <HeartHandshake className="h-3.5 w-3.5" /> People moment
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight text-ink-900">{moment.persona.name}</span>
            <span className="text-sm text-ink-500">
              {moment.persona.role} &middot; {moment.persona.tenure}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-700">{moment.situation}</p>
          <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-brand-600">
            <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="italic">{moment.prompt}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {moment.options.map((opt) => {
          const active = responseId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "press rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug transition-colors",
                active
                  ? "bg-ink-900 text-white"
                  : "bg-ink-100 text-ink-800 hover:bg-ink-200",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {opt.label}
            </button>
          );
        })}
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
    <Card className="col-span-3 flex min-h-0 flex-col p-5">
      <SectionTitle
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Active issues"
        subtitle="Tap one to target it"
        right={primaryIssueId ? <Pill tone="info" strong><Target className="h-3 w-3" /> Targeting</Pill> : null}
      />
      <div className="quiet-scroll flex-1 space-y-2 overflow-auto">
        {issues.map((i) => {
          const selected = primaryIssueId === i.id;
          return (
            <button
              key={i.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(i.id)}
              className={cn(
                "press w-full rounded-xl p-3 text-left transition-colors",
                selected
                  ? "bg-brand-50 ring-1 ring-brand-300"
                  : "bg-surface-muted hover:bg-ink-100",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="text-[13px] font-semibold text-ink-900">{i.title}</h4>
                <Pill tone={SEVERITY_TONES[i.severity]}>{i.severity}</Pill>
              </div>
              <p className="text-xs text-ink-600">{i.description}</p>
              {selected ? (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
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
    <Card className="col-span-2 flex min-h-0 flex-col p-5">
      <SectionTitle icon={<BellRing className="h-4 w-4" />} title="Alerts" subtitle="Head office & ops" />
      <div className="quiet-scroll flex-1 space-y-2 overflow-auto">
        {disruption ? (
          <div className="rounded-xl bg-risk p-3 text-white">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-3.5 w-3.5" /> Disruption
            </div>
            <h4 className="text-[13px] font-semibold">{disruption.title}</h4>
            <p className="mt-0.5 text-xs opacity-90">{disruption.message}</p>
          </div>
        ) : null}
        {alerts.map((a) => (
          <div key={a.id} className="rounded-xl bg-surface-muted p-3">
            <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
              {a.kind === "head_office" ? "Head office" : "Operational"}
            </div>
            <h4 className="text-[13px] font-semibold text-ink-900">{a.title}</h4>
            <p className="mt-0.5 text-xs text-ink-600">{a.message}</p>
          </div>
        ))}
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
  momentResponseId,
  inputsActive,
  canSubmit,
  submitted,
  onSubmit,
}: {
  activeTab: DecisionTab;
  setActiveTab: (t: DecisionTab) => void;
  tabComplete: Record<DecisionTab, boolean>;
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
  momentResponseId: string | null;
  inputsActive: boolean;
  canSubmit: boolean;
  submitted: boolean;
  onSubmit: () => void;
}) {
  const total =
    allocation.shop_floor + allocation.backroom + allocation.customer_service + allocation.problem_resolution;
  const completeCount = Object.values(tabComplete).filter(Boolean).length;

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Your decision</div>
          <div className="text-lg font-semibold tracking-tight text-ink-900">
            {submitted ? "Locked in" : `${completeCount} of 3 complete`}
          </div>
        </div>
        {submitted ? (
          <Pill tone="ok" strong>
            <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
          </Pill>
        ) : (
          <div className="flex items-center gap-1">
            {(["strategy", "resource", "stake"] as DecisionTab[]).map((t) => (
              <span
                key={t}
                className={cn(
                  "h-1.5 w-8 rounded-full",
                  tabComplete[t] ? "bg-ok" : "bg-ink-200",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-stretch border-b border-ink-100 px-5">
        <TabButton
          label="Strategy"
          range="Steps 1 – 3"
          active={activeTab === "strategy"}
          done={tabComplete.strategy}
          onClick={() => setActiveTab("strategy")}
        />
        <TabButton
          label="Resource"
          range="Step 4"
          active={activeTab === "resource"}
          done={tabComplete.resource}
          onClick={() => setActiveTab("resource")}
        />
        <TabButton
          label="Confidence"
          range="Step 7"
          active={activeTab === "confidence"}
          done={tabComplete.confidence}
          onClick={() => setActiveTab("confidence")}
        />
      </div>

      <div className="quiet-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-auto p-5">
        {activeTab === "strategy" ? (
          <>
            <StepRadioGroup<Priority>
              step={1}
              label="Priority focus"
              description="Select where you want to prioritise your focus this round."
              options={Object.keys(PRIORITY_LABELS) as Priority[]}
              labels={PRIORITY_LABELS}
              icons={PRIORITY_ICONS}
              value={priority}
              onChange={setPriority}
              disabled={!inputsActive}
            />
            <StepRadioGroup<ActionApproach>
              step={2}
              label="Action approach"
              description="Choose how you'll turn that priority into action."
              options={Object.keys(ACTION_LABELS) as ActionApproach[]}
              labels={ACTION_LABELS}
              icons={ACTION_ICONS}
              value={action}
              onChange={setAction}
              disabled={!inputsActive}
            />
            <StepRadioGroup<LeadershipStyle>
              step={3}
              label="Leadership style"
              description="Pick the stance you'll lead your team with."
              options={Object.keys(LEADERSHIP_LABELS) as LeadershipStyle[]}
              labels={LEADERSHIP_LABELS}
              value={leadership}
              onChange={setLeadership}
              disabled={!inputsActive}
            />
          </>
        ) : null}

        {activeTab === "resource" ? (
          <div>
            <StepHeader step={4} complete={tabComplete.resource} title="Resource allocation">
              <span className="text-xs text-ink-500">Deploy your team's time. Must total 100%.</span>
              <div className="mt-2 flex items-center gap-2">
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
            </StepHeader>
            <div className="mt-4 space-y-3">
              {ALLOCATION_LABELS.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.key} className="flex items-center gap-3">
                    <span className="flex w-40 shrink-0 items-center gap-2 text-[13px] font-medium text-ink-800">
                      <Icon className="h-4 w-4 text-ink-400" /> {a.label}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={allocation[a.key]}
                      disabled={!inputsActive}
                      onChange={(e) => setAllocation({ ...allocation, [a.key]: Number(e.target.value) })}
                      className="flex-1 accent-brand-500"
                    />
                    <span className="w-10 text-right num text-sm font-medium text-ink-800">
                      {allocation[a.key]}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTab === "confidence" ? (
          <ConfidenceGroup value={confidence} onChange={setConfidence} disabled={!inputsActive} />
        ) : null}
      </div>

      <div className="shrink-0 space-y-2 border-t border-ink-100 px-5 py-4">
        <StatusRow
          step={5}
          filled={!!primaryIssueId}
          filledText="Primary issue targeted"
          emptyText="Primary issue (optional) — tap an issue on the left"
        />
        <StatusRow
          step={6}
          filled={!!momentResponseId}
          filledText="People moment response recorded"
          emptyText="People moment — respond above"
        />
        <Button size="xl" onClick={onSubmit} disabled={!canSubmit} className="mt-1 w-full">
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
  label,
  range,
  active,
  done,
  onClick,
}: {
  label: string;
  range: string;
  active: boolean;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-start gap-0.5 py-3 text-left transition-colors",
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
        <span className="text-sm font-semibold tracking-tight">{label}</span>
      </span>
      <span className="ml-6 text-[10px] uppercase tracking-wider text-ink-400">{range}</span>
      {active ? <span className="absolute -bottom-px left-0 h-[2px] w-full bg-ink-900" /> : null}
    </button>
  );
}

function StepHeader({
  step,
  title,
  complete,
  children,
}: {
  step: number;
  title: string;
  complete: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <StepBadge number={step} tone={complete ? "ok" : "neutral"} />
      <div className="flex-1">
        <div className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</div>
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
    </div>
  );
}

function StatusRow({
  step,
  filled,
  filledText,
  emptyText,
}: {
  step: number;
  filled: boolean;
  filledText: string;
  emptyText: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <StepBadge number={step} tone={filled ? "ok" : "neutral"} size="sm" />
      <span className={cn("flex-1 truncate", filled ? "text-ink-900 font-medium" : "text-ink-500")}>
        {filled ? filledText : emptyText}
      </span>
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
    <div>
      <StepHeader step={7} complete={!!value} title="Confidence">
        <span className="text-xs text-ink-500">
          How hard are you pressing this call? Confidence multiplies upside and downside.
        </span>
      </StepHeader>
      <div className="mt-4 grid grid-cols-3 gap-2">
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
                "press flex flex-col items-start gap-1.5 rounded-xl p-3 text-left transition-colors",
                active
                  ? "bg-ink-900 text-white"
                  : "bg-ink-100 text-ink-900 hover:bg-ink-200",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={cn("h-4 w-4", active ? "text-brand-400" : "text-ink-500")} />
                <span className="text-sm font-semibold">{CONFIDENCE_LABELS[opt]}</span>
              </div>
              <span className={cn("text-[11px] leading-snug", active ? "text-white/80" : "text-ink-600")}>
                {CONFIDENCE_DESCRIPTIONS[opt]}
              </span>
              <span
                className={cn(
                  "num rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  active
                    ? "bg-brand-500 text-white"
                    : opt === "confident"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-ink-200 text-ink-700",
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

function StepRadioGroup<T extends string>({
  step,
  label,
  description,
  options,
  labels,
  icons,
  value,
  onChange,
  disabled,
}: {
  step: number;
  label: string;
  description?: string;
  options: T[];
  labels: Record<T, string>;
  icons?: Record<T, React.ComponentType<{ className?: string }>>;
  value: T | null;
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <StepHeader step={step} complete={!!value} title={label}>
        <div className="flex items-center gap-2">
          {description ? <span className="text-xs text-ink-500">{description}</span> : null}
          {value ? <Pill tone="info" strong>{labels[value]}</Pill> : null}
        </div>
      </StepHeader>
      <div className="mt-3 grid grid-cols-2 gap-2">
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
                "press flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                active ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-900 hover:bg-ink-200",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {Icon ? <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-400" : "text-ink-500")} /> : null}
              <span className="truncate">{labels[opt]}</span>
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
  const steps: Array<{
    number: number;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { number: 1, label: "Priority focus", description: "When things start breaking, where does your attention go first? Safety/Loss, People/Team, Customer, or Commercial.", icon: Target },
    { number: 2, label: "Action approach", description: "How will you act on it? Apply the standard, adapt locally, escalate, or reallocate resource.", icon: Compass },
    { number: 3, label: "Leadership style", description: "Directive, Collaborative, Coaching, or Delegated.", icon: Sparkles },
    { number: 4, label: "Resource allocation", description: "Deploy your team's time across shop floor, backroom, customer service, and problem resolution. Must total 100%.", icon: Gauge },
    { number: 5, label: "Primary issue", description: "Pick one live issue to target. Optional, but high impact when it aligns with your priority.", icon: AlertTriangle },
    { number: 6, label: "People moment", description: "A named direct report brings you a real situation. Your response moves trust, capability, and consistency more than almost anything else.", icon: HeartHandshake },
    { number: 7, label: "Confidence", description: "Cautious (×0.75), Measured (×1.00), or Confident (×1.35). Multiplies everything you did this round, good or bad.", icon: Flame },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5">
      <Card tone="dark" className="p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white">
            <Store className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wider text-brand-400">Today you are</div>
            <div className="text-2xl font-semibold tracking-tighter">The store manager</div>
            <p className="mt-1 text-sm text-ink-300">
              3 shifts. 4 minutes each. Every shift you make 7 decisions that shift live KPIs and 4 hidden drivers: trust, capability, safety risk, and leadership consistency.
            </p>
          </div>
        </div>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">Each shift</div>
            <div className="text-lg font-semibold tracking-tight text-ink-900">Seven decisions you'll make</div>
          </div>
          <Pill tone="info" strong>
            <Clock className="h-3 w-3" /> 4 min per shift
          </Pill>
        </div>
        <div className="quiet-scroll flex min-h-0 flex-1 flex-col divide-y divide-ink-100 overflow-auto">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.number} className="flex items-start gap-4 px-5 py-3">
                <StepBadge number={s.number} size="md" tone="neutral" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-ink-400" />
                    <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">{s.label}</h3>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-600">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
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
            <h2 className="mt-2 text-2xl font-semibold tracking-tighter text-ink-900">How the round played out</h2>
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

