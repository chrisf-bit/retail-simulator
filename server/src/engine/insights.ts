import { nanoid } from "nanoid";
import type {
  ConfidenceLevel,
  FacilitatorScript,
  LeadershipStyle,
  MetricKey,
  MomentArchetype,
  Priority,
  SessionInsights,
  SessionPattern,
  SessionPhase,
  TeamFull,
  TeamInsight,
} from "@sim/shared";
import {
  ARCHETYPE_LABELS,
  CONFIDENCE_LABELS,
  LEADERSHIP_LABELS,
  METRIC_KEYS,
  METRIC_LABELS,
  METRIC_SHORT,
  PRIORITY_LABELS,
  ROUND_COUNT,
} from "@sim/shared";

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
function significantMoveQuestion(metricDelta: Partial<Record<MetricKey, number>>, seed: string): string {
  const byMagnitude = METRIC_KEYS.map((key) => ({ key, delta: metricDelta[key] ?? 0 })).sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );
  const biggest = byMagnitude[0];
  const flattest = byMagnitude[byMagnitude.length - 1];

  if (biggest && Math.abs(biggest.delta) >= SIGNIFICANT_MOVE) {
    const name = METRIC_LABELS[biggest.key];
    if (biggest.delta > 0) {
      return pick(
        [
          `${name} moved up the most this shift (+${Math.round(biggest.delta)}). What do you think lifted it?`,
          `Your biggest gain this shift was ${name} (+${Math.round(biggest.delta)}). Was that where you were aiming?`,
          `${name} climbed harder than anything else this shift. Which decision do you think drove that?`,
        ],
        seed + ":mover-up",
      );
    }
    return pick(
      [
        `${name} fell the most this shift (${Math.round(biggest.delta)}). What do you think pulled it down?`,
        `Your sharpest drop this shift was ${name} (${Math.round(biggest.delta)}). Did you see it coming?`,
        `${name} took the biggest hit this shift. What would you do to protect it next time?`,
      ],
      seed + ":mover-down",
    );
  }

  const name = METRIC_LABELS[flattest.key];
  return pick(
    [
      `Nothing moved far this shift - ${name} least of all. Was holding steady the shift you intended?`,
      `${name} barely shifted this round. What would it have taken to move it?`,
      `This shift left ${name} almost where it started. Is that a win here, or a missed opportunity?`,
    ],
    seed + ":flat",
  );
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
            ? "backroom"
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
    if (!d.primaryIssueId) {
      observations.push("Did not pick a primary issue to target.");
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
      questions: [significantMoveQuestion(latest.metricDelta, seed)],
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

  const primaryPicks = history.filter((h) => h.decision.primaryIssueId).length;
  if (primaryPicks === 0) {
    observations.push("Have not picked a primary issue to target in any shift.");
  } else if (primaryPicks === roundsPlayed) {
    observations.push(`Picked a primary issue in every shift (${primaryPicks}/${roundsPlayed}).`);
  }

  return {
    teamId: team.id,
    teamName: team.name,
    observations: observations.slice(0, 3),
    questions: [significantMoveQuestion(latest.metricDelta, seed)],
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
          `Frame the context: each team runs a retail store across ${ROUND_COUNT} shifts of five minutes each.`,
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

  const closers = [
    "What surprised you most about this shift?",
    "Where did you feel the pressure bite hardest?",
    "If you could replay this shift, what would you do differently?",
    "Which single decision do you think moved the needle most?",
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
