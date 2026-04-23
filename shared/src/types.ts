export type Priority = "safety_loss" | "people_team" | "customer" | "commercial";
export type ActionApproach = "standard" | "adapt_local" | "escalate" | "reallocate";
export type LeadershipStyle = "directive" | "collaborative" | "coaching" | "delegated";
export type ConfidenceLevel = "cautious" | "measured" | "confident";
export type ConnectionStatus = "connected" | "struggling" | "dropped";

export type KpiKey =
  | "sales"
  | "shrinkage"
  | "customer"
  | "engagement"
  | "operations";

export type HiddenDriverKey =
  | "safety_risk"
  | "trust"
  | "capability"
  | "leadership_consistency";

export type Severity = "low" | "medium" | "high";

export interface Kpis {
  sales: number;
  shrinkage: number;
  customer: number;
  engagement: number;
  operations: number;
}

export interface HiddenDrivers {
  safety_risk: number;
  trust: number;
  capability: number;
  leadership_consistency: number;
}

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
}

export interface Alert {
  id: string;
  kind: "head_office" | "operational";
  title: string;
  message: string;
  timestamp: number;
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

export interface TrendSeries {
  sales: number[];
  shrinkage: number[];
  customer: number[];
  engagement: number[];
  operations: number[];
  safety_risk: number[];
  trust: number[];
  capability: number[];
  leadership_consistency: number[];
}

export interface TeamPublic {
  id: string;
  name: string;
  score: number;
  lastMovement: number;
  kpis: Kpis;
  lastDecision?: Decision;
  lastKpiDelta?: Partial<Kpis>;
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
  kpis: Kpis;
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
  kpiDelta: Partial<Kpis>;
  hiddenDelta: Partial<HiddenDrivers>;
  kpisAfter: Kpis;
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
  considerations: string[];
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
  "facilitator:join": { sessionId: string };
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
  "session:created": { sessionId: string; code: string };
  "session:joined": { sessionId: string; teamId: string };
  "session:state": SessionStatePublic;
  "team:state": TeamPublic & { hidden?: HiddenDrivers };
  "error": { message: string };
};
