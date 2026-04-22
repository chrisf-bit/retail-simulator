import type {
  KpiKey,
  Priority,
  ActionApproach,
  LeadershipStyle,
  HiddenDriverKey,
  MomentArchetype,
  ConfidenceLevel,
} from "./types";

export const ROUND_COUNT = 3;
export const ROUND_DURATION_MS = 4 * 60 * 1000;
export const BRIEFING_DURATION_MS = 5 * 60 * 1000;
export const DEBRIEF_DURATION_MS = 10 * 60 * 1000;

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 8;
export const DEFAULT_EXPECTED_TEAMS = 4;

export const KPI_LABELS: Record<KpiKey, string> = {
  sales: "Sales Performance",
  shrinkage: "Shrinkage / Loss",
  customer: "Customer Experience",
  engagement: "Team Engagement",
  operations: "Operational Execution",
};

export const KPI_SHORT: Record<KpiKey, string> = {
  sales: "Sales",
  shrinkage: "Shrinkage",
  customer: "Customer",
  engagement: "Engagement",
  operations: "Operations",
};

export const KPI_INVERTED: Record<KpiKey, boolean> = {
  sales: false,
  shrinkage: true,
  customer: false,
  engagement: false,
  operations: false,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  safety_loss: "Safety / Loss",
  people_team: "People / Team",
  customer: "Customer",
  commercial: "Commercial",
};

export const ACTION_LABELS: Record<ActionApproach, string> = {
  standard: "Apply standard process",
  adapt_local: "Adapt locally",
  escalate: "Escalate",
  reallocate: "Reallocate resource",
};

export const LEADERSHIP_LABELS: Record<LeadershipStyle, string> = {
  directive: "Directive",
  collaborative: "Collaborative",
  coaching: "Coaching",
  delegated: "Delegated",
};

export const DEFAULT_ALLOCATION = {
  shop_floor: 25,
  backroom: 25,
  customer_service: 25,
  problem_resolution: 25,
};

export const HIDDEN_LABELS: Record<HiddenDriverKey, string> = {
  safety_risk: "Safety risk",
  trust: "Team trust",
  capability: "Capability",
  leadership_consistency: "Leadership consistency",
};

export const HIDDEN_INVERTED: Record<HiddenDriverKey, boolean> = {
  safety_risk: true,
  trust: false,
  capability: false,
  leadership_consistency: false,
};

export const ARCHETYPE_LABELS: Record<MomentArchetype, string> = {
  directive: "Directive",
  coaching: "Coaching",
  delegate: "Delegate",
  collaborative: "Collaborative",
};

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  cautious: "Cautious",
  measured: "Measured",
  confident: "Confident",
};

export const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  cautious: "Play it safe - smaller swings, smaller upside",
  measured: "Standard stake - the plan stands on its merits",
  confident: "Press the call - bigger wins, bigger losses if wrong",
};

export const CONFIDENCE_MULTIPLIERS: Record<ConfidenceLevel, number> = {
  cautious: 0.75,
  measured: 1.0,
  confident: 1.35,
};
