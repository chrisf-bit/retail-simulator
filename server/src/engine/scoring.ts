import type {
  Decision,
  HiddenDrivers,
  Kpis,
  Priority,
  ActionApproach,
  LeadershipStyle,
  ResourceAllocation,
  Issue,
  DisruptionEvent,
} from "@sim/shared";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

const PRIORITY_KPI_EFFECTS: Record<Priority, Partial<Kpis>> = {
  safety_loss: { shrinkage: -4, operations: +2, sales: -1 },
  people_team: { engagement: +5, operations: +1, sales: -1 },
  customer: { customer: +5, sales: +2, engagement: +1 },
  commercial: { sales: +5, customer: -1, engagement: -1 },
};

const PRIORITY_HIDDEN_EFFECTS: Record<Priority, Partial<HiddenDrivers>> = {
  safety_loss: { safety_risk: -4, trust: +1 },
  people_team: { trust: +3, capability: +2 },
  customer: { trust: +2 },
  commercial: { leadership_consistency: +1, trust: -1 },
};

const ACTION_KPI_EFFECTS: Record<ActionApproach, Partial<Kpis>> = {
  standard: { operations: +3, sales: +1, customer: -1 },
  adapt_local: { customer: +3, engagement: +2, operations: -2 },
  escalate: { operations: -1, engagement: -2, shrinkage: -1 },
  reallocate: { operations: +1, engagement: +1, customer: +1, sales: -1 },
};

const ACTION_HIDDEN_EFFECTS: Record<ActionApproach, Partial<HiddenDrivers>> = {
  standard: { leadership_consistency: +3, capability: -1 },
  adapt_local: { capability: +3, leadership_consistency: -2 },
  escalate: { trust: -3, capability: -2 },
  reallocate: { capability: +1, trust: +1 },
};

const LEADERSHIP_KPI_EFFECTS: Record<LeadershipStyle, Partial<Kpis>> = {
  directive: { operations: +2, engagement: -2 },
  collaborative: { engagement: +3, operations: -1 },
  coaching: { engagement: +2, customer: +1, sales: -1 },
  delegated: { engagement: +1, operations: -1 },
};

const LEADERSHIP_HIDDEN_EFFECTS: Record<LeadershipStyle, Partial<HiddenDrivers>> = {
  directive: { leadership_consistency: +2, trust: -1, capability: -1 },
  collaborative: { trust: +3, capability: +1 },
  coaching: { capability: +4, trust: +2 },
  delegated: { capability: +2, leadership_consistency: -2 },
};

function allocationEffects(a: ResourceAllocation): { kpi: Partial<Kpis>; hidden: Partial<HiddenDrivers> } {
  const total = Math.max(1, a.shop_floor + a.backroom + a.customer_service + a.problem_resolution);
  const norm = {
    shop_floor: a.shop_floor / total,
    backroom: a.backroom / total,
    customer_service: a.customer_service / total,
    problem_resolution: a.problem_resolution / total,
  };

  const deviation = (v: number) => (v - 0.25) * 20;

  const kpi: Partial<Kpis> = {
    sales: Math.round(deviation(norm.shop_floor) - deviation(norm.backroom) * 0.5),
    operations: Math.round(deviation(norm.backroom) - deviation(norm.customer_service) * 0.3),
    customer: Math.round(deviation(norm.customer_service)),
    shrinkage: Math.round(-deviation(norm.problem_resolution) * 0.6),
  };

  const hidden: Partial<HiddenDrivers> = {
    safety_risk: Math.round(-deviation(norm.problem_resolution) * 0.5),
    capability: Math.round(deviation(norm.customer_service) * 0.3),
  };

  const spread = Math.max(norm.shop_floor, norm.backroom, norm.customer_service, norm.problem_resolution) -
    Math.min(norm.shop_floor, norm.backroom, norm.customer_service, norm.problem_resolution);
  if (spread > 0.6) {
    kpi.engagement = (kpi.engagement ?? 0) - 2;
    hidden.trust = (hidden.trust ?? 0) - 1;
  } else if (spread < 0.15) {
    kpi.engagement = (kpi.engagement ?? 0) + 1;
  }

  return { kpi, hidden };
}

function issueFitBonus(
  issues: Issue[],
  decision: Decision,
): { kpi: Partial<Kpis>; hidden: Partial<HiddenDrivers> } {
  const fits = issues.filter((i) => i.tags.includes(decision.priority));
  const fitScore = fits.reduce((acc, i) => acc + (i.severity === "high" ? 3 : i.severity === "medium" ? 2 : 1), 0);
  const misses = issues.length - fits.length;

  const kpi: Partial<Kpis> = {
    sales: fitScore,
    customer: Math.floor(fitScore / 2),
    operations: -misses,
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
        kpi.operations = (kpi.operations ?? 0) + severityWeight;
        kpi.customer = (kpi.customer ?? 0) + Math.ceil(severityWeight / 2);
        hidden.trust = (hidden.trust ?? 0) + 2;
        hidden.capability = (hidden.capability ?? 0) + 2;
        if (chosen.tags.includes("safety_loss")) {
          hidden.safety_risk = (hidden.safety_risk ?? 0) - severityWeight;
        }
      } else {
        kpi.operations = (kpi.operations ?? 0) + Math.floor(severityWeight / 2);
        hidden.leadership_consistency = (hidden.leadership_consistency ?? 0) - 2;
      }
    }
  } else {
    hidden.leadership_consistency = (hidden.leadership_consistency ?? 0) - 1;
    kpi.operations = (kpi.operations ?? 0) - 1;
  }

  return { kpi, hidden };
}

function disruptionEffects(
  disruption: DisruptionEvent | undefined,
  decision: Decision,
): { kpi: Partial<Kpis>; hidden: Partial<HiddenDrivers> } {
  if (!disruption) return { kpi: {}, hidden: {} };

  const kpi: Partial<Kpis> = { sales: -2, customer: -2, operations: -1 };
  const hidden: Partial<HiddenDrivers> = { safety_risk: +2, trust: -1 };

  if (decision.action === "escalate" && disruption.title.toLowerCase().includes("fire")) {
    kpi.operations = (kpi.operations ?? 0) + 3;
    hidden.safety_risk = (hidden.safety_risk ?? 0) - 3;
  }
  if (decision.action === "adapt_local" && disruption.title.toLowerCase().includes("competitor")) {
    kpi.sales = (kpi.sales ?? 0) + 4;
    hidden.capability = (hidden.capability ?? 0) + 1;
  }
  if (decision.action === "reallocate") {
    kpi.operations = (kpi.operations ?? 0) + 2;
  }

  return { kpi, hidden };
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

export function applyDecision(params: {
  kpis: Kpis;
  hidden: HiddenDrivers;
  decision: Decision;
  issues: Issue[];
  disruption?: DisruptionEvent;
}): { nextKpis: Kpis; nextHidden: HiddenDrivers; kpiDelta: Partial<Kpis>; hiddenDelta: Partial<HiddenDrivers>; roundScore: number } {
  const { kpis, hidden, decision, issues, disruption } = params;

  let kpiDelta: Partial<Kpis> = {};
  let hiddenDelta: Partial<HiddenDrivers> = {};

  kpiDelta = mergeDelta(kpiDelta, PRIORITY_KPI_EFFECTS[decision.priority]);
  hiddenDelta = mergeDelta(hiddenDelta, PRIORITY_HIDDEN_EFFECTS[decision.priority]);

  kpiDelta = mergeDelta(kpiDelta, ACTION_KPI_EFFECTS[decision.action]);
  hiddenDelta = mergeDelta(hiddenDelta, ACTION_HIDDEN_EFFECTS[decision.action]);

  kpiDelta = mergeDelta(kpiDelta, LEADERSHIP_KPI_EFFECTS[decision.leadership]);
  hiddenDelta = mergeDelta(hiddenDelta, LEADERSHIP_HIDDEN_EFFECTS[decision.leadership]);

  const alloc = allocationEffects(decision.allocation);
  kpiDelta = mergeDelta(kpiDelta, alloc.kpi);
  hiddenDelta = mergeDelta(hiddenDelta, alloc.hidden);

  const fit = issueFitBonus(issues, decision);
  kpiDelta = mergeDelta(kpiDelta, fit.kpi);
  hiddenDelta = mergeDelta(hiddenDelta, fit.hidden);

  const dis = disruptionEffects(disruption, decision);
  kpiDelta = mergeDelta(kpiDelta, dis.kpi);
  hiddenDelta = mergeDelta(hiddenDelta, dis.hidden);

  const nextKpis: Kpis = {
    sales: clamp(kpis.sales + (kpiDelta.sales ?? 0)),
    shrinkage: clamp(kpis.shrinkage + (kpiDelta.shrinkage ?? 0)),
    customer: clamp(kpis.customer + (kpiDelta.customer ?? 0)),
    engagement: clamp(kpis.engagement + (kpiDelta.engagement ?? 0)),
    operations: clamp(kpis.operations + (kpiDelta.operations ?? 0)),
  };

  const nextHidden: HiddenDrivers = {
    safety_risk: clamp(hidden.safety_risk + (hiddenDelta.safety_risk ?? 0)),
    trust: clamp(hidden.trust + (hiddenDelta.trust ?? 0)),
    capability: clamp(hidden.capability + (hiddenDelta.capability ?? 0)),
    leadership_consistency: clamp(hidden.leadership_consistency + (hiddenDelta.leadership_consistency ?? 0)),
  };

  const roundScore =
    nextKpis.sales * 1.0 +
    (100 - nextKpis.shrinkage) * 0.6 +
    nextKpis.customer * 1.1 +
    nextKpis.engagement * 0.9 +
    nextKpis.operations * 0.9 +
    nextHidden.trust * 0.4 +
    nextHidden.capability * 0.3 +
    nextHidden.leadership_consistency * 0.3 -
    nextHidden.safety_risk * 0.6;

  return { nextKpis, nextHidden, kpiDelta, hiddenDelta, roundScore: Math.round(roundScore) };
}

export function summariseStrength(kpis: Kpis): string {
  const entries: Array<[string, number]> = [
    ["Sales", kpis.sales],
    ["Customer", kpis.customer],
    ["Engagement", kpis.engagement],
    ["Operations", kpis.operations],
    ["Loss control", 100 - kpis.shrinkage],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function summariseRisk(kpis: Kpis, hidden: HiddenDrivers): string {
  const risks: Array<[string, number]> = [
    ["Shrinkage", kpis.shrinkage],
    ["Safety risk", hidden.safety_risk],
    ["Low engagement", 100 - kpis.engagement],
    ["Customer drop", 100 - kpis.customer],
    ["Trust erosion", 100 - hidden.trust],
  ];
  risks.sort((a, b) => b[1] - a[1]);
  return risks[0][0];
}
