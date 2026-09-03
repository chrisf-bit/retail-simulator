import type {
  Decision,
  HiddenDrivers,
  Metrics,
  Goal,
  Priority,
  ActionApproach,
  LeadershipStyle,
  ResourceAllocation,
  Issue,
  DisruptionEvent,
  MomentArchetype,
  TeamMoment,
} from "@sim/shared";
import {
  CONFIDENCE_MULTIPLIERS,
  METRIC_KEYS,
  HIDDEN_KEYS,
  GOAL_KEYS,
  GOAL_LABELS,
  METRICS_OF_GOAL,
} from "@sim/shared";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// NOTE: every impact figure below is provisional. This decision-to-delta model
// (priority / action / leadership / allocation) is the interim scoring surface
// and will be replaced by the prioritisation/ranking model. Numbers are placeholders
// until the calibration session, per the SME validation pack.

const PRIORITY_METRIC_EFFECTS: Record<Priority, Partial<Metrics>> = {
  safety_loss: { shrink: +4, waste: +2, audits: +2, sales_vs_budget: -1 },
  people_team: { esat: +5, availability: +1, sales_vs_budget: -1 },
  customer: { csat: +5, sales_vs_budget: +2, availability: +1 },
  commercial: { sales_vs_budget: +5, volume_lfl: +2, csat: -1, esat: -1 },
};

const PRIORITY_HIDDEN_EFFECTS: Record<Priority, Partial<HiddenDrivers>> = {
  safety_loss: { safety_risk: -4, trust: +1 },
  people_team: { trust: +3, capability: +2 },
  customer: { trust: +2 },
  commercial: { leadership_consistency: +1, trust: -1 },
};

const ACTION_METRIC_EFFECTS: Record<ActionApproach, Partial<Metrics>> = {
  standard: { availability: +3, scc: +1, csat: -1 },
  adapt_local: { csat: +3, esat: +2, availability: -2 },
  escalate: { availability: -1, esat: -2, shrink: +1 },
  reallocate: { availability: +1, esat: +1, csat: +1, sales_vs_budget: -1 },
};

const ACTION_HIDDEN_EFFECTS: Record<ActionApproach, Partial<HiddenDrivers>> = {
  standard: { leadership_consistency: +3, capability: -1 },
  adapt_local: { capability: +3, leadership_consistency: -2 },
  escalate: { trust: -3, capability: -2 },
  reallocate: { capability: +1, trust: +1 },
};

const LEADERSHIP_METRIC_EFFECTS: Record<LeadershipStyle, Partial<Metrics>> = {
  directive: { availability: +2, esat: -2 },
  collaborative: { esat: +3, availability: -1 },
  coaching: { esat: +2, csat: +1, sales_vs_budget: -1 },
  delegated: { esat: +1, availability: -1 },
};

const LEADERSHIP_HIDDEN_EFFECTS: Record<LeadershipStyle, Partial<HiddenDrivers>> = {
  directive: { leadership_consistency: +2, trust: -1, capability: -1 },
  collaborative: { trust: +3, capability: +1 },
  coaching: { capability: +4, trust: +2 },
  delegated: { capability: +2, leadership_consistency: -2 },
};

function allocationEffects(a: ResourceAllocation): { metric: Partial<Metrics>; hidden: Partial<HiddenDrivers> } {
  const total = Math.max(1, a.shop_floor + a.backroom + a.customer_service + a.problem_resolution);
  const norm = {
    shop_floor: a.shop_floor / total,
    backroom: a.backroom / total,
    customer_service: a.customer_service / total,
    problem_resolution: a.problem_resolution / total,
  };

  const deviation = (v: number) => (v - 0.25) * 20;

  const metric: Partial<Metrics> = {
    sales_vs_budget: Math.round(deviation(norm.shop_floor) - deviation(norm.backroom) * 0.5),
    availability: Math.round(deviation(norm.backroom) - deviation(norm.customer_service) * 0.3),
    csat: Math.round(deviation(norm.customer_service)),
    shrink: Math.round(deviation(norm.problem_resolution) * 0.6),
  };

  const hidden: Partial<HiddenDrivers> = {
    safety_risk: Math.round(-deviation(norm.problem_resolution) * 0.5),
    capability: Math.round(deviation(norm.customer_service) * 0.3),
  };

  const spread = Math.max(norm.shop_floor, norm.backroom, norm.customer_service, norm.problem_resolution) -
    Math.min(norm.shop_floor, norm.backroom, norm.customer_service, norm.problem_resolution);
  if (spread > 0.6) {
    metric.esat = (metric.esat ?? 0) - 2;
    hidden.trust = (hidden.trust ?? 0) - 1;
  } else if (spread < 0.15) {
    metric.esat = (metric.esat ?? 0) + 1;
  }

  return { metric, hidden };
}

function issueFitBonus(
  issues: Issue[],
  decision: Decision,
): { metric: Partial<Metrics>; hidden: Partial<HiddenDrivers> } {
  const fits = issues.filter((i) => i.tags.includes(decision.priority));
  const fitScore = fits.reduce((acc, i) => acc + (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1), 0);
  const misses = issues.length - fits.length;

  const metric: Partial<Metrics> = {
    sales_vs_budget: fitScore,
    csat: Math.floor(fitScore / 2),
    availability: -misses,
  };
  const hidden: Partial<HiddenDrivers> = {
    trust: fitScore > 0 ? +1 : -1,
  };

  if (decision.primaryIssueId) {
    const chosen = issues.find((i) => i.id === decision.primaryIssueId);
    if (chosen) {
      const severityWeight = chosen.severity === "high" ? 6 : chosen.severity === "medium" ? 4 : 2;
      const aligned = chosen.tags.includes(decision.priority);
      if (aligned) {
        metric.availability = (metric.availability ?? 0) + severityWeight;
        metric.csat = (metric.csat ?? 0) + Math.ceil(severityWeight / 2);
        hidden.trust = (hidden.trust ?? 0) + 2;
        hidden.capability = (hidden.capability ?? 0) + 2;
        if (chosen.tags.includes("safety_loss")) {
          metric.shrink = (metric.shrink ?? 0) + severityWeight;
          hidden.safety_risk = (hidden.safety_risk ?? 0) - severityWeight;
        }
      } else {
        metric.availability = (metric.availability ?? 0) + Math.floor(severityWeight / 2);
        hidden.leadership_consistency = (hidden.leadership_consistency ?? 0) - 2;
      }
    }
  } else {
    hidden.leadership_consistency = (hidden.leadership_consistency ?? 0) - 1;
    metric.availability = (metric.availability ?? 0) - 1;
  }

  return { metric, hidden };
}

const MOMENT_METRIC_EFFECTS: Record<MomentArchetype, Partial<Metrics>> = {
  directive: { availability: +2, esat: -2 },
  coaching: { esat: +4, csat: +1, availability: -1 },
  delegate: { esat: +2, availability: -1 },
  collaborative: { esat: +3, csat: +1 },
};

const MOMENT_HIDDEN_EFFECTS: Record<MomentArchetype, Partial<HiddenDrivers>> = {
  directive: { leadership_consistency: +3, capability: -2, trust: -1 },
  coaching: { capability: +5, trust: +3, leadership_consistency: -1 },
  delegate: { capability: +2, leadership_consistency: -2, trust: +1 },
  collaborative: { trust: +5, capability: +1, leadership_consistency: +1 },
};

function momentEffects(
  decision: Decision,
  moment?: TeamMoment,
): { metric: Partial<Metrics>; hidden: Partial<HiddenDrivers> } {
  if (!moment) return { metric: {}, hidden: {} };
  if (!decision.momentResponseId) {
    return {
      metric: { esat: -3, availability: -1 },
      hidden: { trust: -3, leadership_consistency: -2, capability: -1 },
    };
  }
  const chosen = moment.options.find((o) => o.id === decision.momentResponseId);
  if (!chosen) return { metric: {}, hidden: {} };
  return {
    metric: MOMENT_METRIC_EFFECTS[chosen.archetype],
    hidden: MOMENT_HIDDEN_EFFECTS[chosen.archetype],
  };
}

function disruptionEffects(
  disruption: DisruptionEvent | undefined,
  decision: Decision,
): { metric: Partial<Metrics>; hidden: Partial<HiddenDrivers> } {
  if (!disruption) return { metric: {}, hidden: {} };

  const metric: Partial<Metrics> = { sales_vs_budget: -2, csat: -2, availability: -1 };
  const hidden: Partial<HiddenDrivers> = { safety_risk: +2, trust: -1 };

  if (decision.action === "escalate" && disruption.title.toLowerCase().includes("fire")) {
    metric.availability = (metric.availability ?? 0) + 3;
    hidden.safety_risk = (hidden.safety_risk ?? 0) - 3;
  }
  if (decision.action === "adapt_local" && disruption.title.toLowerCase().includes("competitor")) {
    metric.sales_vs_budget = (metric.sales_vs_budget ?? 0) + 4;
    hidden.capability = (hidden.capability ?? 0) + 1;
  }
  if (decision.action === "reallocate") {
    metric.availability = (metric.availability ?? 0) + 2;
  }

  return { metric, hidden };
}

function mergeDelta<T extends object>(acc: Partial<T>, patch: Partial<T>): Partial<T> {
  const out: any = { ...acc };
  for (const k of Object.keys(patch) as (keyof T)[]) {
    const val = patch[k];
    if (typeof val === "number") {
      out[k] = ((out[k] as number) ?? 0) + val;
    }
  }
  return out;
}

function scaleDelta<T extends object>(delta: Partial<T>, factor: number): Partial<T> {
  if (factor === 1) return delta;
  const out: any = {};
  for (const k of Object.keys(delta) as (keyof T)[]) {
    const v = delta[k];
    if (typeof v === "number") out[k] = Math.round(v * factor);
  }
  return out;
}

function goalAverage(metrics: Metrics, goal: Goal): number {
  const keys = METRICS_OF_GOAL[goal];
  const sum = keys.reduce((acc, k) => acc + metrics[k], 0);
  return sum / Math.max(1, keys.length);
}

export function applyDecision(params: {
  metrics: Metrics;
  hidden: HiddenDrivers;
  decision: Decision;
  issues: Issue[];
  moment?: TeamMoment;
  disruption?: DisruptionEvent;
}): { nextMetrics: Metrics; nextHidden: HiddenDrivers; metricDelta: Partial<Metrics>; hiddenDelta: Partial<HiddenDrivers>; roundScore: number } {
  const { metrics, hidden, decision, issues, moment, disruption } = params;

  let metricDelta: Partial<Metrics> = {};
  let hiddenDelta: Partial<HiddenDrivers> = {};

  metricDelta = mergeDelta(metricDelta, PRIORITY_METRIC_EFFECTS[decision.priority]);
  hiddenDelta = mergeDelta(hiddenDelta, PRIORITY_HIDDEN_EFFECTS[decision.priority]);

  metricDelta = mergeDelta(metricDelta, ACTION_METRIC_EFFECTS[decision.action]);
  hiddenDelta = mergeDelta(hiddenDelta, ACTION_HIDDEN_EFFECTS[decision.action]);

  metricDelta = mergeDelta(metricDelta, LEADERSHIP_METRIC_EFFECTS[decision.leadership]);
  hiddenDelta = mergeDelta(hiddenDelta, LEADERSHIP_HIDDEN_EFFECTS[decision.leadership]);

  const alloc = allocationEffects(decision.allocation);
  metricDelta = mergeDelta(metricDelta, alloc.metric);
  hiddenDelta = mergeDelta(hiddenDelta, alloc.hidden);

  const fit = issueFitBonus(issues, decision);
  metricDelta = mergeDelta(metricDelta, fit.metric);
  hiddenDelta = mergeDelta(hiddenDelta, fit.hidden);

  const mom = momentEffects(decision, moment);
  metricDelta = mergeDelta(metricDelta, mom.metric);
  hiddenDelta = mergeDelta(hiddenDelta, mom.hidden);

  const dis = disruptionEffects(disruption, decision);
  metricDelta = mergeDelta(metricDelta, dis.metric);
  hiddenDelta = mergeDelta(hiddenDelta, dis.hidden);

  const multiplier = CONFIDENCE_MULTIPLIERS[decision.confidence] ?? 1;
  metricDelta = scaleDelta(metricDelta, multiplier);
  hiddenDelta = scaleDelta(hiddenDelta, multiplier);

  const nextMetrics = {} as Metrics;
  for (const k of METRIC_KEYS) {
    nextMetrics[k] = clamp((metrics[k] ?? 0) + (metricDelta[k] ?? 0));
  }

  const nextHidden = {} as HiddenDrivers;
  for (const k of HIDDEN_KEYS) {
    nextHidden[k] = clamp((hidden[k] ?? 0) + (hiddenDelta[k] ?? 0));
  }

  // Score over goals (each goal equally weighted) so the four cost metrics do
  // not accidentally count four times more than colleagues or service. Hidden
  // drivers nudge the total.
  const goalScore = GOAL_KEYS.reduce((acc, g) => acc + goalAverage(nextMetrics, g), 0);
  const roundScore =
    goalScore +
    nextHidden.trust * 0.3 +
    nextHidden.capability * 0.25 +
    nextHidden.leadership_consistency * 0.25 -
    nextHidden.safety_risk * 0.5;

  return { nextMetrics, nextHidden, metricDelta, hiddenDelta, roundScore: Math.round(roundScore) };
}

export function summariseStrength(metrics: Metrics): string {
  const ranked = GOAL_KEYS.map((g) => [GOAL_LABELS[g], goalAverage(metrics, g)] as [string, number]);
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0][0];
}

export function summariseRisk(metrics: Metrics, hidden: HiddenDrivers): string {
  const risks: Array<[string, number]> = [
    ...GOAL_KEYS.map((g) => [`${GOAL_LABELS[g]} slipping`, 100 - goalAverage(metrics, g)] as [string, number]),
    ["Safety risk", hidden.safety_risk],
    ["Trust erosion", 100 - hidden.trust],
  ];
  risks.sort((a, b) => b[1] - a[1]);
  return risks[0][0];
}
