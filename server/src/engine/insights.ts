import { nanoid } from "nanoid";
import type {
  ConfidenceLevel,
  FacilitatorScript,
  LeadershipStyle,
  MomentArchetype,
  Priority,
  SessionInsights,
  SessionPattern,
  SessionPhase,
  TeamFull,
  TeamInsight,
} from "@sim/shared";
import { ARCHETYPE_LABELS, CONFIDENCE_LABELS, LEADERSHIP_LABELS, PRIORITY_LABELS } from "@sim/shared";

export function generateInsights(
  teams: TeamFull[],
  phase: SessionPhase,
  roundNumber: number,
): SessionInsights {
  return {
    teams: teams.map(teamInsight),
    patterns: sessionPatterns(teams, roundNumber),
    script: phaseScript(phase, roundNumber),
  };
}

function teamInsight(team: TeamFull): TeamInsight {
  const observations: string[] = [];
  const considerations: string[] = [];
  const questions: string[] = [];
  const history = team.history;

  if (history.length === 0) {
    return {
      teamId: team.id,
      teamName: team.name,
      observations: ["No decisions submitted yet."],
      considerations: ["Watch how they organise themselves before the first round starts."],
      questions: ["Who do you think is going to end up driving the decisions on your team?"],
      strengthNote: team.strength,
      riskNote: team.risk,
    };
  }

  const priorities = history.map((h) => h.decision.priority);
  const priorityCounts = countBy(priorities);
  const dominantPriority = entriesOf(priorityCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantPriority && dominantPriority[1] === history.length && history.length >= 2) {
    observations.push(
      `Chose ${PRIORITY_LABELS[dominantPriority[0] as Priority]} as priority every round (${dominantPriority[1]}/${history.length}).`,
    );
    considerations.push("A single consistent priority can be conviction, or it can be a default they have not questioned.");
  } else if (entriesOf(priorityCounts).length >= 3 && history.length >= 2) {
    observations.push(`Spread their priority across ${entriesOf(priorityCounts).length} different focus areas.`);
    considerations.push("Priority-hopping can be responsive or reactive. Worth exploring which they think it is.");
  }

  const styles = history.map((h) => h.decision.leadership);
  const directiveCount = styles.filter((s) => s === "directive").length;
  if (directiveCount >= 2) {
    observations.push(`Used directive leadership in ${directiveCount} of ${styles.length} rounds.`);
    considerations.push(
      "Defaulting to directive under pressure can dent trust quietly. Worth surfacing what their team might be reading into it.",
    );
    questions.push("What would change if you coached this one through instead of directing?");
  }
  const styleSet = new Set(styles);
  if (history.length >= 3 && styleSet.size === 1) {
    observations.push(`Held the same leadership style (${LEADERSHIP_LABELS[styles[0]]}) across all rounds.`);
    considerations.push("Style consistency is a choice. Was it deliberate, or was it that pressure narrowed their options?");
  }

  const escalations = history.filter((h) => h.decision.action === "escalate").length;
  if (escalations >= 2) {
    observations.push(`Escalated ${escalations} of ${history.length} rounds.`);
    considerations.push("Frequent escalation can signal careful judgement or low trust in their own authority. Both are worth naming.");
    questions.push("What makes a decision yours to own versus one to send upward?");
  }

  const latest = history[history.length - 1];
  const salesDelta = latest.kpiDelta.sales ?? 0;
  if (salesDelta >= 8) observations.push(`Sales moved up sharply (+${salesDelta}) in round ${latest.round}.`);
  if (salesDelta <= -6) observations.push(`Sales slipped by ${salesDelta} in round ${latest.round}.`);

  if (team.kpis.customer < 45) {
    considerations.push("Customer experience has dipped below 45. Worth probing where the customer sits in their thinking right now.");
    questions.push("If you could only move one KPI next round, which would you pick and why?");
  } else if (team.kpis.customer > 75) {
    observations.push(`Customer experience is holding high (${team.kpis.customer}).`);
  }

  if (team.hidden.trust < 40) {
    considerations.push("Team trust has eroded. The signals that cause that are usually small and cumulative.");
    questions.push("How would your team describe the last 10 minutes of working with you?");
  } else if (team.hidden.trust > 75) {
    observations.push(`Trust is building strongly (${team.hidden.trust}).`);
  }

  if (team.hidden.capability > 72) {
    considerations.push("Their team is growing in capability. If they can name how, they can repeat it.");
  }
  if (team.hidden.capability < 40) {
    considerations.push("Capability is not building. Ask whether the way they are leading is creating learning or avoiding it.");
  }

  if (team.hidden.safety_risk > 60) {
    observations.push(`Safety risk has drifted high (${team.hidden.safety_risk}).`);
    considerations.push("Safety sitting high is rarely a sustainable trade. Ask what it would cost to bring it back down.");
    questions.push("Which risk are you most comfortable carrying, and which one is quietly bothering you?");
  }

  if (team.hidden.leadership_consistency < 35) {
    considerations.push("Leadership consistency is low. Their team may be getting mixed signals about what good looks like.");
  }

  const allocs = history.map((h) => h.decision.allocation);
  if (allocs.length >= 2) {
    const avgResolution = allocs.reduce((a, b) => a + b.problem_resolution, 0) / allocs.length;
    if (avgResolution < 15) {
      considerations.push("Problem resolution has been under-resourced in every round. That is a tell about where their attention defaults.");
    }
    const avgFloor = allocs.reduce((a, b) => a + b.shop_floor, 0) / allocs.length;
    if (avgFloor > 45) {
      considerations.push("They have leaned heavily on shop floor. Ask what might be going unnoticed in the backroom or with the team.");
    }
  }

  const confidences = history.map((h) => h.decision.confidence).filter((c): c is ConfidenceLevel => !!c);
  if (confidences.length >= 2) {
    const counts = countBy(confidences);
    const entries = entriesOf(counts).sort((a, b) => b[1] - a[1]);
    const [top, topN] = entries[0] ?? ["measured", 0];
    if (topN === confidences.length && top !== "measured") {
      observations.push(`Played ${CONFIDENCE_LABELS[top as ConfidenceLevel]} in every round so far.`);
      if (top === "confident") {
        considerations.push(
          "Consistent confidence amplifies everything. If the call is right the lead opens up; if it's wrong the hole gets deeper.",
        );
        questions.push("What's your tell that a call is worth pressing versus one worth hedging on?");
      }
      if (top === "cautious") {
        considerations.push(
          "Playing cautious round after round protects downside, but it caps the upside too. Worth surfacing whether that is habit or strategy.",
        );
      }
    }
  }

  const momentArchetypes = history.map((h) => h.momentArchetype).filter((a): a is MomentArchetype => !!a);
  const momentSkips = history.length - momentArchetypes.length;
  if (history.length >= 2 && momentArchetypes.length >= 2) {
    const counts = countBy(momentArchetypes);
    const dominant = entriesOf(counts).sort((a, b) => b[1] - a[1])[0];
    if (dominant && dominant[1] === momentArchetypes.length) {
      observations.push(
        `Used ${ARCHETYPE_LABELS[dominant[0] as MomentArchetype]} every time a direct report came to them.`,
      );
      if (dominant[0] === "directive") {
        considerations.push(
          "Their default in people moments is directive. New managers of managers often over-rely on this under pressure.",
        );
        questions.push("What do you think your team learns from a directive answer versus a question back to them?");
      }
      if (dominant[0] === "delegate") {
        considerations.push(
          "Consistently handing decisions back can read as trust or as avoidance. Worth surfacing how it is landing.",
        );
      }
      if (dominant[0] === "coaching") {
        observations.push("Holding a coaching stance with their direct reports is a rare default.");
      }
    }
  }
  if (momentSkips > 0 && history.length >= 2) {
    observations.push(`Did not respond to ${momentSkips} of ${history.length} people moments.`);
    considerations.push(
      "Skipping a people moment is itself a signal. Their direct report just didn't get a response.",
    );
  }

  const primaryPicks = history.filter((h) => h.decision.primaryIssueId).length;
  if (primaryPicks === 0 && history.length >= 2) {
    observations.push("Have not picked a primary issue to target in any round.");
    considerations.push("Skipping primary focus suggests either caution or not reading deeply. Worth finding out which.");
  } else if (primaryPicks === history.length && history.length >= 2) {
    observations.push(`Picked a primary issue in every round (${primaryPicks}/${history.length}).`);
  }

  if (questions.length === 0) {
    questions.push("Looking at this round, what is one decision you would make differently if you ran it again?");
  }

  return {
    teamId: team.id,
    teamName: team.name,
    observations: observations.slice(0, 3),
    considerations: considerations.slice(0, 3),
    questions: questions.slice(0, 2),
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
          text: `Every team chose ${PRIORITY_LABELS[p as Priority]} as their priority this round. Ask what made it feel obvious.`,
        });
      } else if (c >= Math.ceil(teams.length * 0.75) && teams.length >= 3) {
        patterns.push({
          id: nanoid(6),
          tone: "info",
          text: `${c} of ${teams.length} teams chose ${PRIORITY_LABELS[p as Priority]} this round. Worth surfacing the outlier's reasoning.`,
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

  const avgCustomer = teams.reduce((a, t) => a + t.kpis.customer, 0) / teams.length;
  if (avgCustomer < 50 && teams.length >= 2) {
    patterns.push({
      id: nanoid(6),
      tone: "warn",
      text: `Customer KPI is averaging ${Math.round(avgCustomer)} across the room. Ask whether the customer is being assumed rather than served.`,
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
        text: `Every team chose ${ARCHETYPE_LABELS[topArch as MomentArchetype]} in the people moment. Ask what felt unavailable about the other options.`,
      });
    } else if (topArch === "directive" && topCount >= Math.ceil(teams.length * 0.75)) {
      patterns.push({
        id: nanoid(6),
        tone: "warn",
        text: `Directive is the dominant instinct in people moments across the room. For new managers of managers, that is worth naming.`,
      });
    }
  }

  return patterns.slice(0, 5);
}

function phaseScript(phase: SessionPhase, roundNumber: number): FacilitatorScript {
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
          "Frame the context: each team runs a retail store across six shifts of five minutes each.",
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
        headline: `Round ${roundNumber} is live`,
        talkTrack: [
          "Stay out of the way. Resist the urge to coach mid-round.",
          "Trigger the disruption when you want to test adaptability, not before minute two.",
          "Make notes on body language and who is speaking in each team.",
        ],
        watchFor: [
          "Who dominates, who is silent.",
          "Whether teams re-read issues or anchor on their first reading.",
          "How decisively they shift when the disruption lands.",
        ],
      };
    case "round_results":
      return {
        headline: `Debrief shift ${roundNumber}`,
        talkTrack: [
          "What surprised you most about this shift?",
          "Which single decision do you think moved the needle most?",
          "Where did you feel the pressure bite hardest?",
          "If you could replay this shift, what would you do differently?",
        ],
        watchFor: [
          "Who says 'we' versus 'I' when explaining the shift.",
          "Whether teams attribute the outcome to luck, the game, or their choices.",
        ],
      };
    case "debrief":
      return {
        headline: "Full session debrief",
        talkTrack: [
          "Looking across all six shifts, what pattern do you see in your own decisions?",
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

function countBy<T extends string>(arr: T[]): Partial<Record<T, number>> {
  const out: Partial<Record<T, number>> = {};
  for (const v of arr) out[v] = (out[v] ?? 0) + 1;
  return out;
}

function entriesOf<T extends string>(rec: Partial<Record<T, number>>): Array<[T, number]> {
  return Object.entries(rec) as Array<[T, number]>;
}
