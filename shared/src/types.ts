export type Priority = "safety_loss" | "people_team" | "customer" | "commercial";
export type ActionApproach = "standard" | "adapt_local" | "escalate" | "reallocate";
export type LeadershipStyle = "directive" | "collaborative" | "coaching" | "delegated";
export type ConfidenceLevel = "cautious" | "measured" | "confident";
export type ConnectionStatus = "connected" | "struggling" | "dropped";

// The five retail goals (from the Sainsbury's frame). Each goal carries one or
// more metrics; see METRICS_OF_GOAL in constants.ts.
export type Goal =
  | "sales"
  | "colleagues"
  | "service"
  | "costs"
  | "risk";

// The ten metrics that sit beneath the five goals. All are modelled as
// higher-is-better performance scores (0-100), including the cost lines which
// are framed as control/efficiency scores. Placeholder scale until calibration.
export type MetricKey =
  // Sales
  | "sales_vs_budget"
  | "availability"
  | "volume_lfl"
  // Engaged Colleagues
  | "esat"
  // Brilliant Service
  | "csat"
  // Deliver our Retail Costs
  | "labour"
  | "shrink"
  | "waste"
  | "scc"
  // Defined Risk Appetite
  | "audits";

export type HiddenDriverKey =
  | "safety_risk"
  | "trust"
  | "capability"
  | "leadership_consistency";

// A single number per metric / driver / trend key. Record shape lets the
// engine and UI iterate over keys generically rather than naming each field.
export type Metrics = Record<MetricKey, number>;
export type HiddenDrivers = Record<HiddenDriverKey, number>;

export type TrendKey = MetricKey | HiddenDriverKey;
export type TrendSeries = Record<TrendKey, number[]>;

export type Severity = "low" | "medium" | "high";

// Scenario governance tag. "A" is realism-only; "A+B" is governed by a
// Sainsbury's policy and cannot be scored until a policy owner signs off.
export type ScenarioType = "A" | "A+B";

export interface ResourceAllocation {
  shop_floor: number;
  backroom: number;
  customer_service: number;
  problem_resolution: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  tags: Priority[];
  icon?: string;
}

export interface Alert {
  id: string;
  kind: "head_office" | "operational";
  title: string;
  message: string;
  timestamp: number;
  icon?: string;
}

export type MomentArchetype = "directive" | "coaching" | "delegate" | "collaborative";

export interface MomentOption {
  id: string;
  label: string;
  archetype: MomentArchetype;
}

export interface Persona {
  name: string;
  role: string;
  tenure: string;
}

export interface TeamMoment {
  id: string;
  persona: Persona;
  situation: string;
  prompt: string;
  options: MomentOption[];
}

export interface Decision {
  priority: Priority;
  action: ActionApproach;
  leadership: LeadershipStyle;
  allocation: ResourceAllocation;
  confidence: ConfidenceLevel;
  primaryIssueId?: string;
  momentResponseId?: string;
  submittedAt: number;
}

export type SessionPhase =
  | "lobby"
  | "briefing"
  | "round"
  | "round_results"
  | "debrief"
  | "finished";

export type RoundPhase = "active" | "disrupted" | "locked" | "reveal";

export interface TeamPublic {
  id: string;
  name: string;
  score: number;
  lastMovement: number;
  metrics: Metrics;
  lastDecision?: Decision;
  lastMetricDelta?: Partial<Metrics>;
  lastHiddenDelta?: Partial<HiddenDrivers>;
  revealedHidden?: HiddenDrivers;
  trend: TrendSeries;
  submitted: boolean;
  strength?: string;
  risk?: string;
  connectionStatus: ConnectionStatus;
}

export interface TeamFull {
  id: string;
  name: string;
  score: number;
  lastMovement: number;
  metrics: Metrics;
  lastDecision?: Decision;
  submitted: boolean;
  strength?: string;
  risk?: string;
  hidden: HiddenDrivers;
  history: RoundHistoryEntry[];
  lastSeenAt: number;
}

export interface RoundHistoryEntry {
  round: number;
  decision: Decision;
  momentArchetype?: MomentArchetype;
  momentPersonaName?: string;
  metricDelta: Partial<Metrics>;
  hiddenDelta: Partial<HiddenDrivers>;
  metricsAfter: Metrics;
  hiddenAfter: HiddenDrivers;
  roundScore: number;
}

export interface RoundState {
  number: number;
  phase: RoundPhase;
  startedAt: number;
  endsAt: number;
  durationMs: number;
  issues: Issue[];
  alerts: Alert[];
  moment?: TeamMoment;
  disruption?: DisruptionEvent;
}

export interface DisruptionEvent {
  id: string;
  title: string;
  message: string;
  impact: string;
  triggeredAt: number;
  scene?: string;
}

export interface FacilitatorPrompt {
  id: string;
  teamId?: string;
  teamName?: string;
  tone: "info" | "warning" | "positive";
  text: string;
}

export interface TeamInsight {
  teamId: string;
  teamName: string;
  observations: string[];
  questions: string[];
  strengthNote?: string;
  riskNote?: string;
}

export interface SessionPattern {
  id: string;
  tone: "info" | "warn" | "positive";
  text: string;
}

export interface FacilitatorScript {
  headline: string;
  talkTrack: string[];
  watchFor: string[];
}

export interface SessionInsights {
  teams: TeamInsight[];
  patterns: SessionPattern[];
  script: FacilitatorScript;
}

export interface SessionStatePublic {
  id: string;
  code: string;
  expectedTeams: number;
  phase: SessionPhase;
  round?: RoundState;
  teams: TeamPublic[];
  leaderboard: Array<{
    teamId: string;
    name: string;
    rank: number;
    score: number;
    movement: number;
  }>;
  prompts: FacilitatorPrompt[];
  insights: SessionInsights;
  serverNow: number;
}

export type ClientToServer = {
  "session:create": { expectedTeams?: number };
  "session:join": { code: string; teamName: string };
  "session:rejoin": { sessionId: string; teamId: string };
  "facilitator:join": { sessionId: string; token: string };
  "facilitator:start_briefing": { sessionId: string };
  "facilitator:start_round": { sessionId: string };
  "facilitator:end_round": { sessionId: string };
  "facilitator:trigger_disruption": { sessionId: string };
  "facilitator:pause": { sessionId: string };
  "facilitator:next_phase": { sessionId: string };
  "team:submit_decision": {
    sessionId: string;
    teamId: string;
    decision: Omit<Decision, "submittedAt">;
  };
  "team:ping": { sessionId: string; teamId: string };
};

export type ServerToClient = {
  "session:created": { sessionId: string; code: string; facilitatorToken: string };
  "session:joined": { sessionId: string; teamId: string };
  "session:state": SessionStatePublic;
  "team:state": TeamPublic & { hidden?: HiddenDrivers };
  "error": { message: string };
};
