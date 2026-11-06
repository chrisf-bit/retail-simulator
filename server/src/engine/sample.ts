// Builds a throwaway session populated with dummy teams and full eight-week
// histories, run through the real scoring engine, so the end-of-session report
// can be rendered and tested without playing a whole game. Used by the hidden
// report-testing easter egg on the create screen. Never registered in the store.
import type { Decision } from "@sim/shared";
import { applyDecision } from "./scoring.js";
import { ISSUE_BANK, DISRUPTION_BANK } from "./scenarios.js";
import { MOMENT_BANK } from "./moments.js";
import { Session } from "./session.js";

const disAB = DISRUPTION_BANK.find((d) => d.type === "A+B");
const disA = DISRUPTION_BANK.find((d) => d.type === "A");

// Eight weeks of shared content. Disruptions land in weeks 4 and 6.
const WEEKS = Array.from({ length: 8 }, (_, i) => ({
  issues: [(i * 3) % ISSUE_BANK.length, (i * 3 + 1) % ISSUE_BANK.length, (i * 3 + 2) % ISSUE_BANK.length],
  moment: i % MOMENT_BANK.length,
  dis: i === 3 ? disAB : i === 5 ? disA : undefined,
}));

type Alloc = Decision["allocation"];
interface Style {
  name: string;
  pri: Decision["priority"]; act: Decision["action"]; lead: Decision["leadership"]; conf: Decision["confidence"];
  arch: string; alloc: Alloc;
  priFor?: (w: number) => Decision["priority"];
  actFor?: (w: number) => Decision["action"];
  leadFor?: (w: number) => Decision["leadership"];
  archFor?: (w: number) => string;
}

const STYLES: Style[] = [
  { name: "Team Northgate", pri: "commercial", act: "standard", lead: "directive", conf: "confident", arch: "directive",
    alloc: { shop_floor: 55, backroom: 20, customer_service: 15, problem_resolution: 10 } },
  { name: "Team Riverside", pri: "people_team", act: "adapt_local", lead: "coaching", conf: "measured", arch: "coaching",
    alloc: { shop_floor: 25, backroom: 20, customer_service: 35, problem_resolution: 20 },
    actFor: (w) => (w === 3 ? "escalate" : "adapt_local") },
  { name: "Team Kingsway", pri: "safety_loss", act: "escalate", lead: "collaborative", conf: "measured", arch: "collaborative",
    alloc: { shop_floor: 20, backroom: 30, customer_service: 20, problem_resolution: 30 },
    actFor: (w) => (w === 3 ? "escalate" : w === 5 ? "reallocate" : "escalate") },
  { name: "Team Harbour", pri: "customer", act: "adapt_local", lead: "coaching", conf: "confident", arch: "coaching",
    alloc: { shop_floor: 20, backroom: 20, customer_service: 40, problem_resolution: 20 },
    priFor: (w) => (w >= 4 ? "commercial" : "customer"),
    leadFor: (w) => (w >= 4 ? "directive" : "coaching"),
    archFor: (w) => (w >= 4 ? "directive" : "coaching") },
];

function decisionFor(s: Style, wk: number): Decision {
  const w = WEEKS[wk];
  const issues = w.issues.map((i) => ISSUE_BANK[i]);
  const ids = issues.map((i) => i.id);
  const effort: Record<string, number> = {};
  ids.forEach((id, i) => (effort[id] = i === 0 ? 60 : 20));
  const moment = MOMENT_BANK[w.moment];
  const arch = s.archFor?.(wk) ?? s.arch;
  const opt = moment.options.find((o) => o.archetype === arch) ?? moment.options[0];
  return {
    priority: s.priFor?.(wk) ?? s.pri,
    action: s.actFor?.(wk) ?? s.act,
    leadership: s.leadFor?.(wk) ?? s.lead,
    confidence: s.conf,
    allocation: s.alloc,
    issueEffort: effort,
    momentResponseId: opt.id,
    submittedAt: 0,
  };
}

export function buildSampleSession(): Session {
  const session = new Session(() => undefined);
  session.code = "SAMPLE";
  for (const s of STYLES) {
    const team = session.addTeam(s.name);
    let score = 0;
    for (let wk = 0; wk < 8; wk++) {
      const w = WEEKS[wk];
      const issues = w.issues.map((i) => ISSUE_BANK[i]);
      const moment = MOMENT_BANK[w.moment];
      const decision = decisionFor(s, wk);
      // Bank disruptions lack the id/triggeredAt a live round adds; scoring never
      // reads those, so cast is safe for sample data.
      const r = applyDecision({ metrics: team.metrics, hidden: team.hidden, decision, issues, moment, disruption: w.dis as never });
      team.metrics = r.nextMetrics;
      team.hidden = r.nextHidden;
      score += r.roundScore;
      const chosenArch = moment.options.find((o) => o.id === decision.momentResponseId)?.archetype;
      team.history.push({
        round: wk + 1, decision, momentArchetype: chosenArch, momentPersonaName: moment.persona.name,
        metricDelta: r.metricDelta, hiddenDelta: r.hiddenDelta, metricsAfter: r.nextMetrics, hiddenAfter: r.nextHidden,
        roundScore: r.roundScore,
        weekContext: { issues: issues.map((i) => i.title), disruption: w.dis?.title },
      });
    }
    team.score = Math.round(score);
    team.lastMovement = team.history[team.history.length - 1].roundScore;
    team.submitted = true;
  }
  return session;
}
