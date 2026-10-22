import { nanoid } from "nanoid";
import type {
  ConfidenceLevel,
  FacilitatorScript,
  HiddenDriverKey,
  LeadershipStyle,
  MetricKey,
  MomentArchetype,
  Priority,
  ResourceAllocation,
  RoundHistoryEntry,
  SessionInsights,
  SessionPattern,
  SessionPhase,
  TeamFull,
  TeamInsight,
} from "@sim/shared";
import {
  ARCHETYPE_LABELS,
  CONFIDENCE_LABELS,
  HIDDEN_LABELS,
  LEADERSHIP_LABELS,
  METRIC_KEYS,
  METRIC_LABELS,
  METRIC_SHORT,
  PRIORITY_LABELS,
  ROUND_COUNT,
} from "@sim/shared";

// The largest share (%) of issue effort a decision placed on any single issue.
// A high top share reads as concentrating on a lead issue; a low one as
// spreading thinly. 0 when no effort was directed at all.
function topEffortShare(effort?: Record<string, number>): number {
  if (!effort) return 0;
  const vals = Object.values(effort).filter((v) => Number.isFinite(v));
  return vals.length ? Math.max(0, ...vals) : 0;
}

export function generateInsights(
  teams: TeamFull[],
  phase: SessionPhase,
  roundNumber: number,
): SessionInsights {
  return {
    teams: teams.map((t) => teamInsight(t, roundNumber)),
    patterns: sessionPatterns(teams, roundNumber),
    script: phaseScript(phase, roundNumber, teams),
  };
}

/**
 * Deterministic pick from a pool using a seed string. Same seed always picks
 * the same item, so two teams who made identical decisions still get different
 * questions because their teamId + round differ.
 */
function pick<T>(pool: T[], seed: string): T {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

/**
 * Walk a pool by round so a single team never hears the same question twice in
 * a session (as long as the pool is at least ROUND_COUNT long). The per-team
 * hash offset means two teams on the same shift still land on different wording,
 * while each team's own sequence steps cleanly through the pool.
 */
function pickForRound<T>(pool: T[], teamId: string, roundNumber: number): T {
  let h = 5381;
  for (let i = 0; i < teamId.length; i++) h = ((h << 5) + h + teamId.charCodeAt(i)) >>> 0;
  const offset = h % pool.length;
  return pool[(offset + roundNumber) % pool.length];
}

// A move of this size (0-100 metric scale) counts as the shift's real story.
// Below it, the shift read as broadly flat and we anchor on the flattest metric.
const SIGNIFICANT_MOVE = 4;

/**
 * The single round-debrief question for a team, anchored on their most
 * significant metric move this shift. When the shift produced a real swing we
 * ask about the biggest mover, framed by direction; when the whole shift stayed
 * broadly flat we ask about the metric that moved least. Seeded by team+round,
 * so two teams that land on the same metric still get different wording, and the
 * question is specific to that team's own movement rather than generic.
 */
function significantMoveQuestion(
  metricDelta: Partial<Record<MetricKey, number>>,
  teamId: string,
  roundNumber: number,
): string {
  const byMagnitude = METRIC_KEYS.map((key) => ({ key, delta: metricDelta[key] ?? 0 })).sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );
  const biggest = byMagnitude[0];
  const flattest = byMagnitude[byMagnitude.length - 1];

  if (biggest && Math.abs(biggest.delta) >= SIGNIFICANT_MOVE) {
    const name = METRIC_LABELS[biggest.key];
    const d = Math.round(biggest.delta);
    if (biggest.delta > 0) {
      return pickForRound(
        [
          `${name} moved up the most this shift (+${d}). What do you think lifted it?`,
          `Your biggest gain this shift was ${name} (+${d}). Was that where you were aiming?`,
          `${name} climbed harder than anything else this shift. Which decision do you think drove that?`,
          `Of everything on the board, ${name} responded best (+${d}). What were you doing that it rewarded?`,
          `${name} is up ${d}. If you handed that result to another team to repeat, what would you tell them to do?`,
          `You pushed ${name} up ${d}. Deliberate target, or a side effect of something else you were chasing?`,
          `${name} rose while the rest held roughly still. What did that cost you elsewhere, if anything?`,
          `${name} gained ${d}. How much of that is your call, and how much the shift you happened to be dealt?`,
        ],
        teamId,
        roundNumber,
      );
    }
    return pickForRound(
      [
        `${name} fell the most this shift (${d}). What do you think pulled it down?`,
        `Your sharpest drop this shift was ${name} (${d}). Did you see it coming?`,
        `${name} took the biggest hit this shift. What would you do to protect it next time?`,
        `${name} slid ${d} while your attention was elsewhere. What was pulling you away from it?`,
        `${name} is down ${d}. At what point in the shift do you think it started to go?`,
        `You lost ${d} on ${name}. A price you chose to pay, or one that caught you out?`,
        `${name} dropped further than anything else this shift. What signal do you think you missed?`,
        `${name} fell ${d}. What would you have needed to notice earlier to hold it?`,
      ],
      teamId,
      roundNumber,
    );
  }

  const name = METRIC_LABELS[flattest.key];
  return pickForRound(
    [
      `Nothing moved far this shift - ${name} least of all. Was holding steady the shift you intended?`,
      `${name} barely shifted this round. What would it have taken to move it?`,
      `This shift left ${name} almost where it started. Is that a win here, or a missed opportunity?`,
      `${name} sat still while you worked. Were you protecting it, or just not reaching it?`,
      `${name} is roughly where it began. If you had wanted to move it, what would you have done differently?`,
      `The needle on ${name} hardly moved this shift. Did it need to?`,
      `${name} held flat. Was that a steady hand, or a stall you did not intend?`,
      `You left ${name} untouched this shift. What kept taking priority over it?`,
    ],
    teamId,
    roundNumber,
  );
}

// ---------------------------------------------------------------------------
// Per-team coaching question: a rotating set of "lenses"
// ---------------------------------------------------------------------------
// The single "Ask them" question on each coaching card used to be metric-driven
// every shift, so by mid-session it read as the same question with a different
// metric name. Instead we offer several distinct question CONSTRUCTS - metric
// move, where they focused, how they led, how they staked it, how they handled
// the person, how they split resource, a hidden-driver trade-off, their arc so
// far, and a counterfactual - each grounded in what that team actually did.
//
// Selection is relevance-weighted (the most notable facet of the shift wins) but
// guarded so it never repeats the construct the team heard last shift. The net
// effect: a different SHAPE of question each shift, always specific to the team.
// Pure questions only - no lead-ins and nothing that reveals the scoring logic.

interface LensCtx {
  teamId: string;
  roundNumber: number;
  // History up to and including the shift being asked about. latest = last entry.
  history: RoundHistoryEntry[];
}

interface Lens {
  id: string;
  // Material-and-importance score for this shift, or null if the lens has nothing
  // to say (e.g. no people moment, or no driver tension). Higher wins.
  relevance: (c: LensCtx) => number | null;
  question: (c: LensCtx) => string;
}

function latestOf(c: LensCtx): RoundHistoryEntry {
  return c.history[c.history.length - 1];
}
function priorOf(c: LensCtx): RoundHistoryEntry | undefined {
  return c.history[c.history.length - 2];
}

function heaviestAllocation(a: ResourceAllocation): { where: string; starved: string; pct: number } {
  const entries: Array<[string, number]> = [
    ["the shop floor", a.shop_floor],
    ["back office processes", a.backroom],
    ["customer service", a.customer_service],
    ["problem resolution", a.problem_resolution],
  ];
  entries.sort((x, y) => y[1] - x[1]);
  return { where: entries[0][0], starved: entries[entries.length - 1][0], pct: entries[0][1] };
}

const HIDDEN_GOOD_UP: Record<HiddenDriverKey, boolean> = {
  trust: true,
  capability: true,
  leadership_consistency: true,
  safety_risk: false, // up is bad
};

// Notable improvement / worsening among the hidden drivers this shift.
function hiddenTension(hd: Partial<Record<HiddenDriverKey, number>>): { gain?: HiddenDriverKey; cost?: HiddenDriverKey } {
  let gain: { k: HiddenDriverKey; m: number } | undefined;
  let cost: { k: HiddenDriverKey; m: number } | undefined;
  for (const k of Object.keys(HIDDEN_GOOD_UP) as HiddenDriverKey[]) {
    const d = hd[k] ?? 0;
    if (Math.abs(d) < 4) continue;
    const improved = HIDDEN_GOOD_UP[k] ? d > 0 : d < 0;
    const mag = Math.abs(d);
    if (improved) {
      if (!gain || mag > gain.m) gain = { k, m: mag };
    } else {
      if (!cost || mag > cost.m) cost = { k, m: mag };
    }
  }
  return { gain: gain?.k, cost: cost?.k };
}

const LENSES: Lens[] = [
  {
    id: "metric",
    relevance: (c) => {
      const d = latestOf(c).metricDelta;
      const mag = Math.max(0, ...METRIC_KEYS.map((k) => Math.abs(d[k] ?? 0)));
      // Capped so a big swing competes with, but does not always beat, the
      // decision-based lenses - otherwise we drift back to metrics every shift.
      return Math.max(1, Math.min(6, mag));
    },
    question: (c) => significantMoveQuestion(latestOf(c).metricDelta, c.teamId, c.roundNumber),
  },
  {
    id: "priority",
    relevance: (c) => {
      const cur = latestOf(c).decision.priority;
      const prev = priorOf(c)?.decision.priority;
      if (prev && prev !== cur) return 7;
      const all = c.history.map((h) => h.decision.priority);
      if (c.history.length >= 3 && all.every((p) => p === cur)) return 6;
      return 3;
    },
    question: (c) => {
      const cur = latestOf(c).decision.priority;
      const prev = priorOf(c)?.decision.priority;
      if (prev && prev !== cur) {
        return pickForRound(
          [
            `You moved your priority from ${PRIORITY_LABELS[prev]} to ${PRIORITY_LABELS[cur]} this shift. What changed your read?`,
            `Last shift it was ${PRIORITY_LABELS[prev]}; this shift ${PRIORITY_LABELS[cur]}. What told you to switch?`,
            `You let go of ${PRIORITY_LABELS[prev]} to reach for ${PRIORITY_LABELS[cur]}. What made that the right trade this time?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      const all = c.history.map((h) => h.decision.priority);
      if (c.history.length >= 3 && all.every((p) => p === cur)) {
        return pickForRound(
          [
            `You have reached for ${PRIORITY_LABELS[cur]} every shift so far. What keeps pulling you there first?`,
            `${PRIORITY_LABELS[cur]} has been your opening move all session. When would it be wrong?`,
            `Your priority hasn't changed once - always ${PRIORITY_LABELS[cur]}. Is that conviction, or a blind spot?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `You led with ${PRIORITY_LABELS[cur]} this shift. What made it the first thing you reached for?`,
          `Of everything competing for attention, ${PRIORITY_LABELS[cur]} won this shift. What ruled the others out?`,
          `You put ${PRIORITY_LABELS[cur]} first. What were you prepared to let slide to do it?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "leadership",
    relevance: (c) => {
      const cur = latestOf(c).decision.leadership;
      const prev = priorOf(c)?.decision.leadership;
      if (prev && prev !== cur) return 7;
      const all = c.history.map((h) => h.decision.leadership);
      if (c.history.length >= 3 && all.every((s) => s === cur)) return 6;
      return 3;
    },
    question: (c) => {
      const cur = latestOf(c).decision.leadership;
      const prev = priorOf(c)?.decision.leadership;
      if (prev && prev !== cur) {
        return pickForRound(
          [
            `You shifted from ${LEADERSHIP_LABELS[prev].toLowerCase()} to ${LEADERSHIP_LABELS[cur].toLowerCase()} leadership this shift. What pulled that out of you?`,
            `Your style changed this shift - ${LEADERSHIP_LABELS[prev].toLowerCase()} to ${LEADERSHIP_LABELS[cur].toLowerCase()}. What was the team reading from you?`,
            `You led ${LEADERSHIP_LABELS[cur].toLowerCase()} this shift where you were ${LEADERSHIP_LABELS[prev].toLowerCase()} before. Deliberate, or did the shift force it?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      const all = c.history.map((h) => h.decision.leadership);
      if (c.history.length >= 3 && all.every((s) => s === cur)) {
        return pickForRound(
          [
            `You have led ${LEADERSHIP_LABELS[cur].toLowerCase()} every shift. What would a different style have risked?`,
            `${LEADERSHIP_LABELS[cur]} has been your one gear all session. Where might it be costing you?`,
            `Your leadership style hasn't moved. What would it take for you to lead differently?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `You led ${LEADERSHIP_LABELS[cur].toLowerCase()} this shift. What did you want the team to feel from that?`,
          `What were you hoping a ${LEADERSHIP_LABELS[cur].toLowerCase()} stance would get from the team this shift?`,
          `You chose ${LEADERSHIP_LABELS[cur].toLowerCase()} leadership. What would the opposite have looked like here?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "confidence",
    relevance: (c) => {
      const cur = latestOf(c).decision.confidence;
      const changed = priorOf(c) && priorOf(c)!.decision.confidence !== cur;
      const strong = cur === "confident" || cur === "cautious";
      if (strong) return changed ? 7 : 5;
      return changed ? 4 : 2;
    },
    question: (c) => {
      const cur = latestOf(c).decision.confidence;
      if (cur === "confident") {
        return pickForRound(
          [
            `You pressed confident this shift. What told you it was one to lean into?`,
            `You backed yourself hard this shift. What were you so sure the shift was asking for?`,
            `Confident was a big swing to take. What would have had to be true for it to be the wrong call?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      if (cur === "cautious") {
        return pickForRound(
          [
            `You played cautious this shift. What were you protecting?`,
            `You pulled your stake in this shift. What was telling you to hold back?`,
            `Cautious keeps the downside small but caps the upside too. What made that the trade you wanted?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `You played it measured this shift. A deliberate read, or the safe default?`,
          `You stayed in the middle on confidence. What would have pushed you to lean one way?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "people",
    relevance: (c) => {
      const l = latestOf(c);
      if (!l.momentPersonaName) return null;
      return l.momentArchetype ? 5 : 8; // a skipped moment is the louder signal
    },
    question: (c) => {
      const l = latestOf(c);
      const who = l.momentPersonaName ?? "your direct report";
      if (!l.momentArchetype) {
        return pickForRound(
          [
            `You left ${who}'s moment unanswered this shift. What does a silence like that land as for them?`,
            `${who} came to you and the moment went by without a response. What got in the way?`,
            `You didn't take up ${who}'s situation. What would picking it up have cost you this shift?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `With ${who}, you took a ${ARCHETYPE_LABELS[l.momentArchetype].toLowerCase()} stance. What might a different approach have opened up?`,
          `How do you think ${who} walked away feeling after the way you handled it?`,
          `You answered ${who} ${ARCHETYPE_LABELS[l.momentArchetype].toLowerCase()}ly. What did you read in them that pointed you there?`,
          `If ${who} brought you the same thing next week, would you handle it the same way?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "allocation",
    relevance: (c) => {
      const d = latestOf(c).decision;
      const { pct } = heaviestAllocation(d.allocation);
      const top = topEffortShare(d.issueEffort);
      if (pct >= 55) return 6;
      if (top === 0) return 5;
      if (top > 0 && top < 40) return 6;
      if (pct <= 30) return 4; // evenly spread
      return 3;
    },
    question: (c) => {
      const d = latestOf(c).decision;
      const { where, starved, pct } = heaviestAllocation(d.allocation);
      const top = topEffortShare(d.issueEffort);
      if (pct >= 55) {
        return pickForRound(
          [
            `You put ${pct}% of your people into ${where}. What did ${starved} quietly lose while you did?`,
            `${where} got the lion's share this shift (${pct}%). What were you betting that focus would buy you?`,
            `You loaded ${where} heavily. What would have had to happen for that to leave you exposed?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      if (top === 0) {
        return pickForRound(
          [
            `You put no effort onto the active issues this shift. Where did your attention go instead?`,
            `The issues went untouched this shift. Was that a choice, or did they slip past you?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      if (top > 0 && top < 40) {
        return pickForRound(
          [
            `You spread your effort thinly across all the issues this shift. Concentrating, or hedging?`,
            `No single issue got the bulk of your effort. What would picking one to own have changed?`,
            `You shared effort evenly across the issues. What did that cost the one that mattered most?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `Your resource split was fairly even this shift. A read that nothing needed more, or playing safe?`,
          `You kept your people balanced across the store. What would have made you commit harder somewhere?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "hidden",
    relevance: (c) => {
      const { gain, cost } = hiddenTension(latestOf(c).hiddenDelta);
      return gain && cost ? 8 : null;
    },
    question: (c) => {
      const { gain, cost } = hiddenTension(latestOf(c).hiddenDelta);
      const g = gain ? HIDDEN_LABELS[gain] : "one driver";
      const k = cost ? HIDDEN_LABELS[cost] : "another";
      return pickForRound(
        [
          `${g} improved this shift, but ${k.toLowerCase()} moved the wrong way with it. Which were you willing to trade?`,
          `You gained on ${g.toLowerCase()} and gave ground on ${k.toLowerCase()} this shift. Was that trade a choice or a surprise?`,
          `${g} and ${k.toLowerCase()} pulled against each other this shift. Which one do you most need to hold next?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "trajectory",
    relevance: (c) => {
      if (c.history.length < 3) return null;
      const recent = c.history.slice(-3).map((h) => h.roundScore);
      const rising = recent[2] > 0 && recent[2] >= recent[1];
      const slipping = recent[2] < 0;
      return rising || slipping ? 6 : 3;
    },
    question: (c) => {
      const recent = c.history.slice(-3).map((h) => h.roundScore);
      const rising = recent[2] > 0 && recent[2] >= recent[1];
      const slipping = recent[2] < 0;
      if (rising) {
        return pickForRound(
          [
            `Your last few shifts have built on each other. What's the through-line in how you've been leading?`,
            `You've been climbing. If you had to name the habit that's working, what is it?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      if (slipping) {
        return pickForRound(
          [
            `The last shift went backwards for you. What do you think started the slide?`,
            `Your momentum turned this shift. What were you doing earlier that you've stopped doing?`,
          ],
          c.teamId,
          c.roundNumber,
        );
      }
      return pickForRound(
        [
          `Your results have been fairly flat across the last few shifts. What would it take to break the plateau?`,
          `You've held roughly level for a few shifts now. Is that stability, or a stall?`,
        ],
        c.teamId,
        c.roundNumber,
      );
    },
  },
  {
    id: "counterfactual",
    relevance: () => 2, // always available, low priority - the fallback shape
    question: (c) =>
      pickForRound(
        [
          `What did you choose not to do this shift, and why?`,
          `If you could replay only this shift, what's the single call you'd change?`,
          `What will you be watching for at the start of the next shift because of this one?`,
          `What's the one thing you nearly did this shift but held back from?`,
        ],
        c.teamId,
        c.roundNumber,
      ),
  },
];

const LENS_BY_ID = new Map(LENSES.map((l) => [l.id, l]));

// Pick the lens for a shift: highest relevance wins, excluding the construct used
// last shift so the SHAPE of the question always changes. Ties broken by a
// team+round hash so it stays varied and deterministic.
function selectLens(c: LensCtx, excludeId?: string): Lens {
  const scored = LENSES.map((l) => ({ l, r: l.relevance(c) }))
    .filter((x): x is { l: Lens; r: number } => x.r !== null)
    .filter((x) => x.l.id !== excludeId);
  const pool = scored.length > 0 ? scored : LENSES.map((l) => ({ l, r: l.relevance(c) ?? 0 }));
  const maxR = Math.max(...pool.map((x) => x.r));
  const top = pool.filter((x) => Math.abs(x.r - maxR) < 0.0001);
  return pick(top, `${c.teamId}:${c.roundNumber}:lens`).l;
}

// The per-team coaching question for a multi-round shift. Derives the construct
// used last shift (from the trimmed history) and excludes it, so no team hears
// the same shape of question twice running.
function coachingQuestion(team: TeamFull, roundNumber: number): string {
  const history = team.history;
  const ctx: LensCtx = { teamId: team.id, roundNumber, history };
  let lastId: string | undefined;
  if (history.length >= 2) {
    const prevHistory = history.slice(0, -1);
    const prevCtx: LensCtx = {
      teamId: team.id,
      roundNumber: prevHistory[prevHistory.length - 1].round,
      history: prevHistory,
    };
    lastId = selectLens(prevCtx).id;
  }
  const lens = selectLens(ctx, lastId);
  return lens.question(ctx);
}

function teamInsight(team: TeamFull, roundNumber: number): TeamInsight {
  const observations: string[] = [];
  const history = team.history;
  const seed = `${team.id}:${roundNumber}`;

  if (history.length === 0) {
    return {
      teamId: team.id,
      teamName: team.name,
      observations: ["No decisions submitted yet."],
      questions: [
        pick(
          [
            "Who do you think is going to end up driving the decisions on your team?",
            "What's the first thing you're going to check once the shift opens?",
            "What sort of leader do you want to be today?",
          ],
          seed,
        ),
      ],
      strengthNote: team.strength,
      riskNote: team.risk,
    };
  }

  const latest = history[history.length - 1];
  const roundsPlayed = history.length;
  const isFirstRound = roundsPlayed === 1;

  if (isFirstRound) {
    const d = latest.decision;
    observations.push(
      `Opened with ${PRIORITY_LABELS[d.priority]} as priority and a ${LEADERSHIP_LABELS[d.leadership].toLowerCase()} style.`,
    );
    observations.push(`Played ${CONFIDENCE_LABELS[d.confidence]} on their first shift.`);

    const maxAlloc = Math.max(
      d.allocation.shop_floor,
      d.allocation.backroom,
      d.allocation.customer_service,
      d.allocation.problem_resolution,
    );
    if (maxAlloc >= 45) {
      const where =
        d.allocation.shop_floor === maxAlloc
          ? "shop floor"
          : d.allocation.backroom === maxAlloc
            ? "back office processes"
            : d.allocation.customer_service === maxAlloc
              ? "customer service"
              : "problem resolution";
      observations.push(`Weighted resource heavily into ${where} (${maxAlloc}%).`);
    }
    if (latest.momentArchetype) {
      observations.push(
        `Responded to the people moment with a ${ARCHETYPE_LABELS[latest.momentArchetype].toLowerCase()} stance.`,
      );
    } else {
      observations.push("Did not respond to the people moment.");
    }
    const topShare = topEffortShare(d.issueEffort);
    if (topShare === 0) {
      observations.push("Directed no effort at the active issues.");
    } else if (topShare < 50) {
      observations.push("Spread effort thinly across the issues rather than concentrating on one.");
    }
    const bigMover = Object.entries(latest.metricDelta)
      .map(([k, v]) => [k, v ?? 0] as const)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    if (bigMover && Math.abs(bigMover[1]) >= 5) {
      const dir = bigMover[1] > 0 ? "up" : "down";
      observations.push(`Biggest move was ${METRIC_SHORT[bigMover[0] as MetricKey]} (${dir} ${Math.abs(bigMover[1])}).`);
    }

    return {
      teamId: team.id,
      teamName: team.name,
      observations: observations.slice(0, 4),
      questions: [significantMoveQuestion(latest.metricDelta, team.id, roundNumber)],
      strengthNote: team.strength,
      riskNote: team.risk,
    };
  }

  // --- Multi-round: observations look for patterns across shifts. The single
  // question is always metric-driven (below); these only enrich the context. ---
  const priorities = history.map((h) => h.decision.priority);
  const priorityCounts = countBy(priorities);
  const dominantPriority = entriesOf(priorityCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantPriority && dominantPriority[1] === roundsPlayed) {
    observations.push(
      `Chose ${PRIORITY_LABELS[dominantPriority[0] as Priority]} as priority every shift (${dominantPriority[1]}/${roundsPlayed}).`,
    );
  } else if (entriesOf(priorityCounts).length >= 3) {
    observations.push(`Spread their priority across ${entriesOf(priorityCounts).length} different focus areas.`);
  }

  const styles = history.map((h) => h.decision.leadership);
  const directiveCount = styles.filter((s) => s === "directive").length;
  if (directiveCount >= Math.ceil(roundsPlayed * 0.6)) {
    observations.push(`Used directive leadership in ${directiveCount} of ${styles.length} shifts.`);
  }
  const styleSet = new Set(styles);
  if (roundsPlayed >= 3 && styleSet.size === 1) {
    observations.push(`Held the same leadership style (${LEADERSHIP_LABELS[styles[0]]}) across all shifts.`);
  }

  const escalations = history.filter((h) => h.decision.action === "escalate").length;
  if (escalations >= 2) {
    observations.push(`Escalated in ${escalations} of ${roundsPlayed} shifts.`);
  }

  const salesDelta = latest.metricDelta.sales_vs_budget ?? 0;
  if (salesDelta >= 8) observations.push(`Sales moved up sharply (+${salesDelta}) in shift ${latest.round}.`);
  if (salesDelta <= -6) observations.push(`Sales slipped by ${salesDelta} in shift ${latest.round}.`);

  if (team.metrics.csat > 75) {
    observations.push(`Customer experience is holding high (${team.metrics.csat}).`);
  }

  if (team.hidden.trust > 75) {
    observations.push(`Trust is building strongly (${team.hidden.trust}).`);
  }

  if (team.hidden.safety_risk > 60) {
    observations.push(`Safety risk has drifted high (${team.hidden.safety_risk}).`);
  }

  const confidences = history.map((h) => h.decision.confidence).filter((c): c is ConfidenceLevel => !!c);
  if (confidences.length >= 2) {
    const counts = countBy(confidences);
    const entries = entriesOf(counts).sort((a, b) => b[1] - a[1]);
    const [top, topN] = entries[0] ?? ["measured", 0];
    if (topN === confidences.length && top !== "measured") {
      observations.push(`Played ${CONFIDENCE_LABELS[top as ConfidenceLevel]} in every shift so far.`);
    }
  }

  const momentArchetypes = history.map((h) => h.momentArchetype).filter((a): a is MomentArchetype => !!a);
  const momentSkips = roundsPlayed - momentArchetypes.length;
  if (momentArchetypes.length >= 2) {
    const counts = countBy(momentArchetypes);
    const dominant = entriesOf(counts).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] === momentArchetypes.length) {
      observations.push(
        `Used ${ARCHETYPE_LABELS[dominant[0] as MomentArchetype]} every time a direct report came to them.`,
      );
    }
  }
  if (momentSkips > 0) {
    observations.push(`Did not respond to ${momentSkips} of ${roundsPlayed} people moments.`);
  }

  const concentratedShifts = history.filter((h) => topEffortShare(h.decision.issueEffort) >= 50).length;
  if (concentratedShifts === 0) {
    observations.push("Have not concentrated effort on a lead issue in any shift.");
  } else if (concentratedShifts === roundsPlayed) {
    observations.push(`Concentrated effort on a lead issue in every shift (${concentratedShifts}/${roundsPlayed}).`);
  }

  return {
    teamId: team.id,
    teamName: team.name,
    observations: observations.slice(0, 3),
    questions: [coachingQuestion(team, roundNumber)],
    strengthNote: team.strength,
    riskNote: team.risk,
  };
}

function sessionPatterns(teams: TeamFull[], roundNumber: number): SessionPattern[] {
  const patterns: SessionPattern[] = [];
  if (teams.length === 0) return patterns;

  const lastDecisions = teams
    .map((t) => t.history[t.history.length - 1])
    .filter((h): h is NonNullable<typeof h> => !!h);

  if (lastDecisions.length === teams.length && teams.length >= 2) {
    const priorityCounts = countBy(lastDecisions.map((h) => h.decision.priority));
    for (const [p, c] of entriesOf(priorityCounts)) {
      if (c === teams.length) {
        patterns.push({
          id: nanoid(6),
          tone: "info",
          text: `Every team chose ${PRIORITY_LABELS[p as Priority]} as their priority this shift. Ask what made it feel obvious.`,
        });
      } else if (c >= Math.ceil(teams.length * 0.75) && teams.length >= 3) {
        patterns.push({
          id: nanoid(6),
          tone: "info",
          text: `${c} of ${teams.length} teams chose ${PRIORITY_LABELS[p as Priority]} this shift. Worth surfacing the outlier's reasoning.`,
        });
      }
    }
  }

  if (roundNumber >= 2) {
    const allStyles = new Set<LeadershipStyle>();
    for (const t of teams) for (const h of t.history) allStyles.add(h.decision.leadership);
    for (const s of ["directive", "collaborative", "coaching", "delegated"] as LeadershipStyle[]) {
      if (!allStyles.has(s)) {
        patterns.push({
          id: nanoid(6),
          tone: "warn",
          text: `No team has used ${LEADERSHIP_LABELS[s]} leadership yet. What might be making it feel unavailable?`,
        });
      }
    }
  }

  const avgCustomer = teams.reduce((a, t) => a + t.metrics.csat, 0) / teams.length;
  if (avgCustomer < 50 && teams.length >= 2) {
    patterns.push({
      id: nanoid(6),
      tone: "warn",
      text: `Customer indicator is averaging ${Math.round(avgCustomer)} across the room. Is the customer being assumed rather than served?`,
    });
  }

  const highTrust = teams.filter((t) => t.hidden.trust >= 75);
  if (highTrust.length >= 1 && teams.length >= 2) {
    patterns.push({
      id: nanoid(6),
      tone: "positive",
      text: `${highTrust.map((t) => t.name).join(", ")} ${highTrust.length === 1 ? "is" : "are"} building strong trust. Worth surfacing what they are doing differently.`,
    });
  }

  const highSafetyRisk = teams.filter((t) => t.hidden.safety_risk >= 65);
  if (highSafetyRisk.length >= Math.ceil(teams.length / 2)) {
    patterns.push({
      id: nanoid(6),
      tone: "warn",
      text: `Safety risk is drifting up across the room. Worth naming it explicitly without prescribing a fix.`,
    });
  }

  if (teams.length >= 2) {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top.score - bottom.score > 120) {
      patterns.push({
        id: nanoid(6),
        tone: "info",
        text: `Score gap between ${top.name} and ${bottom.name} is widening. Resist comparing openly, but surface the approach difference.`,
      });
    }
  }

  const latestArchetypes = teams
    .map((t) => t.history[t.history.length - 1]?.momentArchetype)
    .filter((a): a is MomentArchetype => !!a);
  if (latestArchetypes.length === teams.length && teams.length >= 2) {
    const counts = countBy(latestArchetypes);
    const [topArch, topCount] = entriesOf(counts).sort((a, b) => b[1] - a[1])[0] ?? ["directive", 0];
    if (topCount === teams.length) {
      patterns.push({
        id: nanoid(6),
        tone: "info",
        text: `Every team chose ${ARCHETYPE_LABELS[topArch as MomentArchetype]} in the people moment. What felt unavailable about the other options?`,
      });
    } else if (topArch === "directive" && topCount >= Math.ceil(teams.length * 0.75)) {
      patterns.push({
        id: nanoid(6),
        tone: "warn",
        text: `Directive was the dominant instinct in people moments across the room. For new managers of managers, that is worth naming.`,
      });
    }
  }

  return patterns.slice(0, 5);
}

function phaseScript(phase: SessionPhase, roundNumber: number, teams: TeamFull[]): FacilitatorScript {
  switch (phase) {
    case "lobby":
      return {
        headline: "Open the session",
        talkTrack: [
          "Welcome the room and introduce yourself. Keep it brief.",
          "Show the session code on screen. Give teams 60 seconds to join on their shared laptop.",
          "Tell them: this is a simulation, not a test. The aim is to notice your own instincts.",
        ],
        watchFor: ["Who organises their team first.", "Anyone hesitating or looking unsure about setup."],
      };
    case "briefing":
      return {
        headline: "Brief the room (5 minutes)",
        talkTrack: [
          `Frame the context: each team runs a retail store across ${ROUND_COUNT} shifts. The first runs a little longer to settle in; the rest are six minutes each.`,
          "Walk through the decision panel live. Emphasise: there are no right answers, only revealing ones.",
          "Flag the hidden drivers (trust, capability, safety risk, leadership consistency). They shape score without showing.",
          "Remind them: decisions lock when the timer hits zero. Deliberation vs speed is itself a choice.",
        ],
        watchFor: [
          "Who asks clarifying questions versus who just starts planning.",
          "Early tells about who will lead each team.",
        ],
      };
    case "round":
      return {
        headline: `Shift ${roundNumber} is live`,
        talkTrack: [
          "Stay out of the way. Resist the urge to coach mid-shift.",
          "A disruption may strike during the shift, at a moment you will not know in advance - and some shifts stay clean.",
          "Make notes on body language and who is speaking in each team.",
        ],
        watchFor: [
          "Who dominates, who is silent.",
          "Whether teams re-read issues or anchor on their first reading.",
          "How decisively they shift when the disruption lands.",
        ],
      };
    case "round_results":
      return roundResultsScript(roundNumber, teams);
    case "debrief":
      return {
        headline: "Full session debrief",
        talkTrack: [
          `Looking across all ${ROUND_COUNT} shifts, what pattern do you see in your own decisions?`,
          "Where did your leadership instincts serve you well? Where did they let you down?",
          "What did the hidden drivers - trust, capability, safety risk, leadership consistency - reveal about how you were actually leading?",
          "Which shift felt the most different to manage, and why?",
          "What is the one moment you most want to pull apart together as a room?",
          "What is one thing you will try differently on Monday morning?",
        ],
        watchFor: [
          "Insight versus performance. Who is genuinely reflecting and who is defending?",
          "Where the room gets quiet. That is usually where the learning is.",
        ],
      };
    case "finished":
      return {
        headline: "Close cleanly",
        talkTrack: [
          "Thank the room. Signpost any follow-up material.",
          "Leave the final leaderboard visible for 30 seconds while people settle.",
        ],
        watchFor: [],
      };
  }
}

function roundResultsScript(roundNumber: number, teams: TeamFull[]): FacilitatorScript {
  const questions: string[] = [];

  const lastDecisions = teams
    .map((t) => ({ team: t, h: t.history[t.history.length - 1] }))
    .filter((x): x is { team: TeamFull; h: NonNullable<typeof x.h> } => !!x.h);

  if (lastDecisions.length >= 2) {
    const priorityCounts = countBy(lastDecisions.map((x) => x.h.decision.priority));
    const priorityEntries = entriesOf(priorityCounts).sort((a, b) => b[1] - a[1]);
    if (priorityEntries[0] && priorityEntries[0][1] === lastDecisions.length) {
      questions.push(
        `Every team chose ${PRIORITY_LABELS[priorityEntries[0][0] as Priority]} as priority. What made that feel obvious?`,
      );
    } else if (priorityEntries.length >= 3) {
      questions.push("Priorities split across the room this shift. What were you seeing that pulled you one way rather than another?");
    } else if (priorityEntries[0] && priorityEntries[0][1] >= Math.ceil(lastDecisions.length * 0.75) && priorityEntries.length > 1) {
      const majority = PRIORITY_LABELS[priorityEntries[0][0] as Priority];
      const minority = PRIORITY_LABELS[priorityEntries[priorityEntries.length - 1][0] as Priority];
      questions.push(`Most teams went ${majority}, one went ${minority}. What would you want to ask the outlier?`);
    }

    const styleCounts = countBy(lastDecisions.map((x) => x.h.decision.leadership));
    const styleEntries = entriesOf(styleCounts).sort((a, b) => b[1] - a[1]);
    if (styleEntries[0] && styleEntries[0][1] === lastDecisions.length) {
      const style = LEADERSHIP_LABELS[styleEntries[0][0] as LeadershipStyle];
      questions.push(`The whole room led ${style.toLowerCase()} this shift. What did that feel like in the moment?`);
    } else if (styleEntries.length >= 3) {
      questions.push("Leadership styles diverged this shift. What signal do you think your team was reading from you?");
    }

    const confCounts = countBy(lastDecisions.map((x) => x.h.decision.confidence));
    const confidentTeams = lastDecisions.filter((x) => x.h.decision.confidence === "confident");
    const cautiousTeams = lastDecisions.filter((x) => x.h.decision.confidence === "cautious");
    if (confidentTeams.length >= 1 && cautiousTeams.length >= 1) {
      questions.push("Some teams pressed confident, others played cautious. What shifted your read on what this shift was asking for?");
    } else if (confCounts.confident === lastDecisions.length && lastDecisions.length >= 3) {
      questions.push("The room pressed confident across the board. What told everyone this was a shift to lean into?");
    } else if (confCounts.cautious === lastDecisions.length && lastDecisions.length >= 3) {
      questions.push("Every team played cautious this shift. What was the room reading that pulled it toward playing safe?");
    }

    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top.score - bottom.score > 80) {
      questions.push(`The gap between ${top.name} and ${bottom.name} is widening. What approach difference do you think is behind it?`);
    }

    const archetypes = lastDecisions
      .map((x) => x.h.momentArchetype)
      .filter((a): a is MomentArchetype => !!a);
    if (archetypes.length === lastDecisions.length && archetypes.length >= 2) {
      const archCounts = countBy(archetypes);
      const [topArch, topN] = entriesOf(archCounts).sort((a, b) => b[1] - a[1])[0] ?? ["directive", 0];
      if (topN === archetypes.length) {
        questions.push(
          `Every team responded to the people moment with a ${ARCHETYPE_LABELS[topArch as MomentArchetype].toLowerCase()} stance. What felt unavailable about the other options?`,
        );
      }
    } else if (archetypes.length < lastDecisions.length) {
      const skipped = lastDecisions.length - archetypes.length;
      questions.push(`${skipped} team${skipped === 1 ? " did" : "s did"} not respond to the people moment. What does a silence like that land as for the direct report?`);
    }

    const avgTrust = teams.reduce((a, t) => a + t.hidden.trust, 0) / teams.length;
    const avgSafety = teams.reduce((a, t) => a + t.hidden.safety_risk, 0) / teams.length;
    if (avgSafety >= 60) {
      questions.push("Safety risk is drifting up across the room. What might be quietly getting traded for it?");
    }
    if (avgTrust < 45) {
      questions.push("Trust is sitting low across the room. What small signals might be eroding it?");
    }
  }

  // A long, varied closer pool indexed by shift, so the room-level wrap-up does
  // not cycle back on itself over a session. Mixed constructs on purpose.
  const closers = [
    "What surprised you most about this shift?",
    "Where did you feel the pressure bite hardest?",
    "Which single decision do you think moved the needle most?",
    "What did your team argue about before you committed?",
    "If another team had run your shift, what would they have done differently?",
    "What did you not have time to do that you wish you had?",
    "Where did instinct take over from the plan this shift?",
    "What would you tell yourself at the start of this shift if you could go back?",
    "Which call are you least sure about, now that you have seen the result?",
    "What will you carry into the next shift from this one?",
  ];
  questions.push(closers[(roundNumber - 1) % closers.length]);

  return {
    headline: `Debrief shift ${roundNumber}`,
    talkTrack: questions.slice(0, 5),
    watchFor: [
      "Who says 'we' versus 'I' when explaining the shift.",
      "Whether teams attribute the outcome to luck, the game, or their choices.",
    ],
  };
}

function countBy<T extends string>(arr: T[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};
  for (const v of arr) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function entriesOf<T extends string>(rec: Partial<Record<T, number>>): Array<[T, number]> {
  return Object.entries(rec) as Array<[T, number]>;
}
