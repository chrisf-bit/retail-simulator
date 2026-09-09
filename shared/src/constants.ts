import type {
  Goal,
  MetricKey,
  Priority,
  ActionApproach,
  LeadershipStyle,
  HiddenDriverKey,
  MomentArchetype,
  ConfidenceLevel,
} from "./types";

export const ROUND_COUNT = 8;
export const ROUND_DURATION_MS = 5 * 60 * 1000;

// Disruptions are no longer guaranteed. Each shift has a fixed chance of a
// disruption striking; when it does, it lands at a random point within the
// opening window of the shift (the same moment for every team). Both are
// fractions: DISRUPTION_CHANCE is the per-shift probability, DISRUPTION_WINDOW
// is the fraction of the shift within which it can land.
export const DISRUPTION_CHANCE = 0.5;
export const DISRUPTION_WINDOW = 0.5;

// Number of steps in the facilitator-driven briefing walkthrough. The client
// owns the per-step content and animation; the server only clamps the shared
// step index to this range. Keep in sync with BRIEFING_STEPS in the team page.
export const BRIEFING_STEP_COUNT = 10;

// Number of pre-session weeks in each team's baseline trend. Used by both the
// server (when seeding the baseline) and the client (when drawing the divider
// between history and in-session shifts on sparklines).
export const BASELINE_WEEKS = 16;
export const BRIEFING_DURATION_MS = 5 * 60 * 1000;
export const DEBRIEF_DURATION_MS = 10 * 60 * 1000;

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 8;
export const DEFAULT_EXPECTED_TEAMS = 4;

// Connection health thresholds (milliseconds since last seen)
export const CONNECTION_STRUGGLING_AFTER_MS = 8_000;
export const CONNECTION_DROPPED_AFTER_MS = 25_000;

// How often the client emits a heartbeat
export const HEARTBEAT_INTERVAL_MS = 10_000;

// How often the server re-evaluates connection status for all teams
export const CONNECTION_TICK_MS = 3_000;

// ---------------------------------------------------------------------------
// The frame: five goals, ten metrics
// ---------------------------------------------------------------------------

export const GOAL_KEYS: Goal[] = ["sales", "colleagues", "service", "costs", "risk"];

export const METRIC_KEYS: MetricKey[] = [
  "sales_vs_budget",
  "availability",
  "volume_lfl",
  "esat",
  "csat",
  "labour",
  "shrink",
  "waste",
  "scc",
  "audits",
];

export const HIDDEN_KEYS: HiddenDriverKey[] = [
  "safety_risk",
  "trust",
  "capability",
  "leadership_consistency",
];

export const GOAL_LABELS: Record<Goal, string> = {
  sales: "Sales",
  colleagues: "Engaged Colleagues",
  service: "Brilliant Service",
  costs: "Deliver our Retail Costs",
  risk: "Defined Risk Appetite",
};

export const GOAL_SHORT: Record<Goal, string> = {
  sales: "Sales",
  colleagues: "Colleagues",
  service: "Service",
  costs: "Costs",
  risk: "Risk",
};

export const METRICS_OF_GOAL: Record<Goal, MetricKey[]> = {
  sales: ["sales_vs_budget", "availability", "volume_lfl"],
  colleagues: ["esat"],
  service: ["csat"],
  costs: ["labour", "shrink", "waste", "scc"],
  risk: ["audits"],
};

export const GOAL_OF_METRIC: Record<MetricKey, Goal> = {
  sales_vs_budget: "sales",
  availability: "sales",
  volume_lfl: "sales",
  esat: "colleagues",
  csat: "service",
  labour: "costs",
  shrink: "costs",
  waste: "costs",
  scc: "costs",
  audits: "risk",
};

export const METRIC_LABELS: Record<MetricKey, string> = {
  sales_vs_budget: "Sales vs budget",
  availability: "Availability",
  volume_lfl: "Volume growth (LFL)",
  esat: "Colleague engagement (ESAT)",
  csat: "Customer satisfaction (CSAT)",
  labour: "Labour efficiency",
  shrink: "Shrink control",
  waste: "Waste control",
  scc: "Cost control (SCC)",
  audits: "Satisfactory audits",
};

export const METRIC_SHORT: Record<MetricKey, string> = {
  sales_vs_budget: "Sales",
  availability: "Availability",
  volume_lfl: "Volume LFL",
  esat: "ESAT",
  csat: "CSAT",
  labour: "Labour",
  shrink: "Shrink",
  waste: "Waste",
  scc: "SCC",
  audits: "Audits",
};

// All ten metrics are modelled higher-is-better (cost lines framed as control /
// efficiency scores), so there is no per-metric inversion. Kept as a named
// export in case a future metric genuinely inverts.
export const METRIC_INVERTED: Record<MetricKey, boolean> = {
  sales_vs_budget: false,
  availability: false,
  volume_lfl: false,
  esat: false,
  csat: false,
  labour: false,
  shrink: false,
  waste: false,
  scc: false,
  audits: false,
};

// ---------------------------------------------------------------------------
// Real-world metric definitions (MVP content validation, 2026-09-09)
// ---------------------------------------------------------------------------
// The engine runs every metric on an abstract 0-100, higher-is-better scale.
// These defs anchor that scale to the store's real numbers: `floor` maps to 0,
// `ceiling` maps to 100, with the validated `baseline` (each team's starting
// position) and `target` expressed in real units. The helpers convert a 0-100
// value to its real display string and locate the baseline / target on the
// 0-100 scale. Ordinal metrics (medal, audit) carry tier labels worst -> best,
// and their floor/ceiling/baseline/target are tier indices.

export type MetricFormat = "currency" | "percent" | "growth" | "medal" | "audit";

export interface MetricDef {
  format: MetricFormat;
  floor: number; // real value (or tier index) mapped to 0
  ceiling: number; // real value (or tier index) mapped to 100
  baseline: number; // validated starting value
  target: number; // validated "what good looks like"
  tiers?: string[]; // ordinal labels, worst -> best (medal / audit)
  tiersShort?: string[]; // compact ordinal labels for tight cells
}

export const METRIC_DEFS: Record<MetricKey, MetricDef> = {
  sales_vs_budget: { format: "currency", floor: -225_000, ceiling: 150_000, baseline: -125_000, target: 0 },
  availability: { format: "percent", floor: 96, ceiling: 98.5, baseline: 97, target: 97.5 },
  volume_lfl: { format: "growth", floor: -5, ceiling: 3, baseline: 0.5, target: 0.1 },
  esat: { format: "percent", floor: 60, ceiling: 82, baseline: 65, target: 72 },
  csat: {
    format: "medal",
    floor: 0,
    ceiling: 3,
    baseline: 2,
    target: 3,
    tiers: ["No medal", "Bronze", "Silver", "Gold"],
  },
  labour: { format: "currency", floor: -35_000, ceiling: 35_000, baseline: 5_000, target: 0 },
  shrink: { format: "currency", floor: -60_000, ceiling: 60_000, baseline: 0, target: 0 },
  waste: { format: "currency", floor: -40_000, ceiling: 40_000, baseline: -4_000, target: 0 },
  scc: { format: "currency", floor: -25_000, ceiling: 35_000, baseline: 7_000, target: 0 },
  audits: {
    format: "audit",
    floor: 0,
    ceiling: 3,
    baseline: 2,
    target: 3,
    tiers: ["Concerns raised", "Improvements required", "Satisfactory with opportunities", "Satisfactory"],
    tiersShort: ["Concerns", "Improve", "Satis. +ops", "Satis."],
  },
};

// Normalise a real value onto the metric's 0-100 scale (clamped).
export function metricNormFromReal(key: MetricKey, real: number): number {
  const d = METRIC_DEFS[key];
  const n = ((real - d.floor) / (d.ceiling - d.floor)) * 100;
  return Math.max(0, Math.min(100, n));
}

// Convert a 0-100 value back to its real-world value (or tier index).
export function metricRealFromNorm(key: MetricKey, norm: number): number {
  const d = METRIC_DEFS[key];
  return d.floor + (norm / 100) * (d.ceiling - d.floor);
}

export function metricBaselineNorm(key: MetricKey): number {
  return Math.round(metricNormFromReal(key, METRIC_DEFS[key].baseline));
}

export function metricTargetNorm(key: MetricKey): number {
  return Math.round(metricNormFromReal(key, METRIC_DEFS[key].target));
}

function fmtCurrencyFull(v: number): string {
  const r = Math.round(v / 1000) * 1000;
  const sign = r > 0 ? "+" : r < 0 ? "-" : "";
  return `${sign}£${Math.abs(r).toLocaleString("en-GB")}`;
}

function fmtCurrencyShort(v: number): string {
  const k = Math.round(v / 1000);
  if (k === 0) return "£0";
  return `${k > 0 ? "+" : "-"}£${Math.abs(k)}k`;
}

function tierLabel(d: MetricDef, real: number, short: boolean): string {
  const tiers = (short && d.tiersShort) || d.tiers || [];
  const idx = Math.max(0, Math.min(tiers.length - 1, Math.round(real)));
  return tiers[idx] ?? "";
}

function fmtReal(d: MetricDef, real: number, short: boolean): string {
  switch (d.format) {
    case "currency":
      return short ? fmtCurrencyShort(real) : fmtCurrencyFull(real);
    case "percent":
      return `${real.toFixed(1)}%`;
    case "growth":
      return `${real > 0 ? "+" : ""}${real.toFixed(1)}%`;
    case "medal":
      return tierLabel(d, real, false);
    case "audit":
      return tierLabel(d, real, short);
  }
}

// Full real-world display string for a 0-100 value (e.g. "-£125,000", "97.5%").
export function metricDisplay(key: MetricKey, norm: number): string {
  return fmtReal(METRIC_DEFS[key], metricRealFromNorm(key, norm), false);
}

// Compact real-world display for tight cells (e.g. "-£125k", "Satis. +ops").
export function metricDisplayShort(key: MetricKey, norm: number): string {
  return fmtReal(METRIC_DEFS[key], metricRealFromNorm(key, norm), true);
}

// Exact validated target / baseline labels, formatted straight from the real
// values (no 0-100 round-trip, so they read exactly as the pack states them).
export function metricTargetLabel(key: MetricKey, short = true): string {
  const d = METRIC_DEFS[key];
  return fmtReal(d, d.target, short);
}

export function metricBaselineLabel(key: MetricKey, short = true): string {
  const d = METRIC_DEFS[key];
  return fmtReal(d, d.baseline, short);
}

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
  delegated: "Delegate",
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
  cautious: "Play it safe, smaller swings, smaller upside",
  measured: "Standard stance, the plan stands on its merits",
  confident: "Press forward, bigger wins but bigger losses if wrong",
};

export const CONFIDENCE_MULTIPLIERS: Record<ConfidenceLevel, number> = {
  cautious: 0.75,
  measured: 1.0,
  confident: 1.35,
};
