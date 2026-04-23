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

function teamInsight(team: TeamFull, roundNumber: number): TeamInsight {
  const observations: string[] = [];
  const questions: string[] = [];
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
    const bigMover = Object.entries(latest.kpiDelta)
      .map(([k, v]) => [k, v ?? 0] as const)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    if (bigMover && Math.abs(bigMover[1]) >= 5) {
      const dir = bigMover[1] > 0 ? "up" : "down";
      observations.push(`Biggest move was ${bigMover[0]} (${dir} ${Math.abs(bigMover[1])}).`);
    }

    // --- Varied questions: each trigger has a pool, picked by team+round seed ---
    const pushed: string[] = [];

    if (d.confidence === "confident") {
      pushed.push(
        pick(
          [
            "What told you this was a shift to press forward rather than ease into?",
            "What would you need to see to back off the confident stance next shift?",
            "If you could label the feeling behind that confidence, what would it be?",
          ],
          seed + ":conf-high",
        ),
      );
    } else if (d.confidence === "cautious") {
      pushed.push(
        pick(
          [
            "What made caution feel like the right stance for shift one?",
            "What would have had to be different for you to press forward instead?",
            "How did playing cautious sit with the rest of your team?",
          ],
          seed + ":conf-low",
        ),
      );
    }

    if (d.leadership === "directive") {
      pushed.push(
        pick(
          [
            "If you had more time on that shift, what might you have done instead of directing?",
            "What signalled to you that directive was the stance that fit?",
            "How did you want your team to feel after you made those calls?",
          ],
          seed + ":lead-dir",
        ),
      );
    } else if (d.leadership === "coaching") {
      pushed.push(
        pick(
          [
            "What did coaching cost you in speed, and was it worth it?",
            "When did you feel the urge to switch out of coaching into something more direct?",
          ],
          seed + ":lead-coach",
        ),
      );
    } else if (d.leadership === "delegated") {
      pushed.push(
        pick(
          [
            "How did you decide what to hand over versus what to hold on to?",
            "What would have to go wrong for you to pull the decisions back in?",
          ],
          seed + ":lead-del",
        ),
      );
    }

    if (!d.primaryIssueId) {
      pushed.push(
        pick(
          [
            "How do you decide what is worth giving focus to versus what can wait?",
            "When you scanned the issues, what pulled your attention first and why?",
          ],
          seed + ":no-primary",
        ),
      );
    }

    if (latest.momentArchetype === "directive") {
      pushed.push(
        pick(
          [
            "What do you think your direct report wanted most from that exchange?",
            "What stopped you from turning that into a question back to them?",
          ],
          seed + ":mom-dir",
        ),
      );
    } else if (latest.momentArchetype === "delegate") {
      pushed.push(
        pick(
          [
            "What made it feel right to hand that back to them in the moment?",
            "How confident are you that they left with what they needed?",
          ],
          seed + ":mom-del",
        ),
      );
    }

    if (bigMover && bigMover[1] <= -5) {
      pushed.push(`What do you think pulled ${bigMover[0]} down that shift?`);
    } else if (bigMover && bigMover[1] >= 8) {
      pushed.push(`What do you think lifted ${bigMover[0]} that sharply?`);
    }

    // Fallback closers, rotated so all teams don't land on the same one.
    if (pushed.length === 0) {
      pushed.push(
        pick(
          [
            "What one decision do you most want to pull apart from that shift?",
            "If you ran that shift again, what would you try differently?",
            "What did that shift tell you about how you lead under pressure?",
          ],
          seed + ":fallback",
        ),
      );
    }

    questions.push(...pushed);

    return {
      teamId: team.id,
      teamName: team.name,
      observations: observations.slice(0, 4),
      questions: questions.slice(0, 3),
      strengthNote: team.strength,
      riskNote: team.risk,
    };
  }

  // --- Multi-round: look for patterns across shifts ---
  const priorities = history.map((h) => h.decision.priority);
  const priorityCounts = countBy(priorities);
  const dominantPriority = entriesOf(priorityCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantPriority && dominantPriority[1] === roundsPlayed) {
    observations.push(
      `Chose ${PRIORITY_LABELS[dominantPriority[0] as Priority]} as priority every shift (${dominantPriority[1]}/${roundsPlayed}).`,
    );
    questions.push(
      pick(
        [
          `What keeps drawing you back to ${PRIORITY_LABELS[dominantPriority[0] as Priority]}?`,
          `If you had to put that priority to one side next shift, what would you lead with?`,
          `What might you be missing by going with ${PRIORITY_LABELS[dominantPriority[0] as Priority]} every time?`,
        ],
        seed + ":prio-same",
      ),
    );
  } else if (entriesOf(priorityCounts).length >= 3) {
    observations.push(`Spread their priority across ${entriesOf(priorityCounts).length} different focus areas.`);
    questions.push(
      pick(
        [
          "Has your priority shifting been responsive to what the room threw up, or reactive?",
          "When you look back, which of your priority picks do you think you got most right?",
        ],
        seed + ":prio-spread",
      ),
    );
  }

  const styles = history.map((h) => h.decision.leadership);
  const directiveCount = styles.filter((s) => s === "directive").length;
  if (directiveCount >= Math.ceil(roundsPlayed * 0.6)) {
    observations.push(`Used directive leadership in ${directiveCount} of ${styles.length} shifts.`);
    questions.push(
      pick(
        [
          "What would have changed if you had coached this one through instead of directing?",
          "Where did the directive stance help you, and where did it cost you?",
          "What does directive look like from your team's side of the conversation?",
        ],
        seed + ":dir-heavy",
      ),
    );
  }
  const styleSet = new Set(styles);
  if (roundsPlayed >= 3 && styleSet.size === 1) {
    observations.push(`Held the same leadership style (${LEADERSHIP_LABELS[styles[0]]}) across all shifts.`);
    questions.push(
      pick(
        [
          "Was holding one style across every shift deliberate, or did pressure narrow your options?",
          "When you imagine changing style next shift, what would it cost you to do that?",
        ],
        seed + ":style-locked",
      ),
    );
  }

  const escalations = history.filter((h) => h.decision.action === "escalate").length;
  if (escalations >= 2) {
    observations.push(`Escalated in ${escalations} of ${roundsPlayed} shifts.`);
    questions.push(
      pick(
        [
          "What makes a decision yours to own versus one to send upward?",
          "If escalation wasn't available, how would you have handled those moments?",
        ],
        seed + ":escalate",
      ),
    );
  }

  const salesDelta = latest.kpiDelta.sales ?? 0;
  if (salesDelta >= 8) observations.push(`Sales moved up sharply (+${salesDelta}) in shift ${latest.round}.`);
  if (salesDelta <= -6) observations.push(`Sales slipped by ${salesDelta} in shift ${latest.round}.`);

  if (team.kpis.customer < 45) {
    questions.push(
      pick(
        [
          "If you could only move one indicator next shift, which would you pick and why?",
          "Where does the customer sit in your thinking right now?",
          "What would a customer walking round your store say about their visit?",
        ],
        seed + ":cust-low",
      ),
    );
  } else if (team.kpis.customer > 75) {
    observations.push(`Customer experience is holding high (${team.kpis.customer}).`);
  }

  if (team.hidden.trust < 40) {
    questions.push(
      pick(
        [
          "How would your team describe the last ten minutes of working with you?",
          "What signal do you think you've been sending that's pulling trust down?",
        ],
        seed + ":trust-low",
      ),
    );
  } else if (team.hidden.trust > 75) {
    observations.push(`Trust is building strongly (${team.hidden.trust}).`);
  }

  if (team.hidden.safety_risk > 60) {
    observations.push(`Safety risk has drifted high (${team.hidden.safety_risk}).`);
    questions.push(
      pick(
        [
          "Which risk are you most comfortable carrying, and which one is quietly bothering you?",
          "What has safety been quietly traded for across these shifts?",
        ],
        seed + ":safety-high",
      ),
    );
  }

  const allocs = history.map((h) => h.decision.allocation);
  if (allocs.length >= 2) {
    const avgResolution = allocs.reduce((a, b) => a + b.problem_resolution, 0) / allocs.length;
    if (avgResolution < 15) {
      questions.push(
        pick(
          [
            "What's behind consistently low resource into problem resolution?",
            "When you rebuild next shift's allocation, what changes first?",
          ],
          seed + ":alloc-res",
        ),
      );
    }
  }

  const confidences = history.map((h) => h.decision.confidence).filter((c): c is ConfidenceLevel => !!c);
  if (confidences.length >= 2) {
    const counts = countBy(confidences);
    const entries = entriesOf(counts).sort((a, b) => b[1] - a[1]);
    const [top, topN] = entries[0] ?? ["measured", 0];
    if (topN === confidences.length && top !== "measured") {
      observations.push(`Played ${CONFIDENCE_LABELS[top as ConfidenceLevel]} in every shift so far.`);
      if (top === "confident") {
        questions.push(
          pick(
            [
              "What tells you a decision is worth pressing on versus one worth hedging?",
              "When has that confident stance caught you out?",
            ],
            seed + ":conf-every",
          ),
        );
      }
      if (top === "cautious") {
        questions.push(
          pick(
            [
              "Is playing cautious every shift habit, or strategy?",
              "What would the shift have to look like for you to press forward?",
            ],
            seed + ":cautious-every",
          ),
        );
      }
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
      if (dominant[0] === "directive") {
        questions.push(
          pick(
            [
              "What does your team learn from a directive answer versus a question back to them?",
              "Which of those people moments do you most wish you'd handled differently?",
            ],
            seed + ":pm-dir",
          ),
        );
      }
    }
  }
  if (momentSkips > 0) {
    observations.push(`Did not respond to ${momentSkips} of ${roundsPlayed} people moments.`);
    questions.push(
      pick(
        [
          "When you passed on the people moment, what was pulling your attention instead?",
          "How does a non-response land from the direct report's side?",
        ],
        seed + ":pm-skip",
      ),
    );
  }

  const primaryPicks = history.filter((h) => h.decision.primaryIssueId).length;
  if (primaryPicks === 0) {
    observations.push("Have not picked a primary issue to target in any shift.");
    questions.push(
      pick(
        [
          "What's stopped you from committing to a primary issue in any shift?",
          "If you had to pick one moment when naming a primary issue would have mattered, which was it?",
        ],
        seed + ":no-primary-multi",
      ),
    );
  } else if (primaryPicks === roundsPlayed) {
    observations.push(`Picked a primary issue in every shift (${primaryPicks}/${roundsPlayed}).`);
  }

  if (questions.length === 0) {
    questions.push(
      pick(
        [
          "Looking at this shift, what one decision would you make differently if you ran it again?",
          "What surprised you most about how that shift played out?",
          "Where did the pressure bite hardest, and what did you do with it?",
        ],
        seed + ":multi-fallback",
      ),
    );
  }

  return {
    teamId: team.id,
    teamName: team.name,
    observations: observations.slice(0, 3),
    questions: questions.slice(0, 3),
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

  const avgCustomer = teams.reduce((a, t) => a + t.kpis.customer, 0) / teams.length;
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
          "Frame the context: each team runs a retail store across five shifts of five minutes each.",
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
          "A disruption lands automatically one minute in. Use Disrupt now if you want to bring it forward.",
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
          "Looking across all five shifts, what pattern do you see in your own decisions?",
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
