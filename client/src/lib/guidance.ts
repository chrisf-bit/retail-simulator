import type { SessionStatePublic } from "@sim/shared";

export interface Guidance {
  tone: "info" | "ok" | "warn" | "risk";
  headline: string;
  body: string;
}

export function facilitatorGuidance(state: SessionStatePublic): Guidance {
  switch (state.phase) {
    case "lobby": {
      const joined = state.teams.length;
      const expected = state.expectedTeams;
      const allIn = joined >= expected;
      return {
        tone: allIn ? "ok" : "info",
        headline: allIn
          ? `All ${expected} teams joined - ready to brief`
          : `Waiting for teams (${joined} of ${expected})`,
        body: allIn
          ? "Everyone is in. Start the briefing when you are ready."
          : `Share session code ${state.code} with each team. You can start the briefing early if needed.`,
      };
    }
    case "briefing":
      return {
        tone: "info",
        headline: "Briefing in progress",
        body: "Run the scenario briefing with the room. Click Start Round 1 when you are ready.",
      };
    case "round": {
      const subs = state.teams.filter((t) => t.submitted).length;
      const total = state.teams.length;
      const disrupted = state.round?.phase === "disrupted";
      if (disrupted) {
        return {
          tone: "risk",
          headline: `Round ${state.round?.number} - disruption active`,
          body: `${subs} of ${total} teams have submitted. Observe how teams respond.`,
        };
      }
      return {
        tone: "warn",
        headline: `Round ${state.round?.number} live`,
        body: `${subs} of ${total} submitted. Trigger a disruption mid-round, or end early if ready.`,
      };
    }
    case "round_results":
      return {
        tone: "ok",
        headline: `Round ${state.round?.number} complete`,
        body: "Review the leaderboard and prompts, then advance when the room is ready.",
      };
    case "debrief":
      return {
        tone: "info",
        headline: "Debrief",
        body: "Work through the facilitator prompts with the room. Close the session when done.",
      };
    case "finished":
      return {
        tone: "ok",
        headline: "Session closed",
        body: "All done. You can safely leave this tab.",
      };
  }
}

export function teamGuidance(state: SessionStatePublic, submitted: boolean): Guidance {
  switch (state.phase) {
    case "lobby":
      return {
        tone: "info",
        headline: "Waiting in the lobby",
        body: "Your facilitator will start the briefing once all teams have joined.",
      };
    case "briefing":
      return {
        tone: "info",
        headline: "Listen to the briefing",
        body: "Round 1 is about to start. Be ready to respond to live store pressures.",
      };
    case "round": {
      const disrupted = state.round?.phase === "disrupted";
      if (submitted) {
        return {
          tone: "ok",
          headline: "Decision locked in",
          body: "You can still watch the clock, but your submission is final for this round.",
        };
      }
      if (disrupted) {
        return {
          tone: "risk",
          headline: "Disruption triggered",
          body: "Update your decision to reflect the new reality before the timer ends.",
        };
      }
      return {
        tone: "warn",
        headline: `Round ${state.round?.number} live`,
        body: "Pick a focus, choose how you will act, lead your team, and deploy resource. Submit before the timer ends.",
      };
    }
    case "round_results":
      return {
        tone: "ok",
        headline: `Round ${state.round?.number} results`,
        body: "Review your movement. Your facilitator will advance to the next round shortly.",
      };
    case "debrief":
      return {
        tone: "info",
        headline: "Debrief time",
        body: "Session complete. Join the room discussion led by your facilitator.",
      };
    case "finished":
      return {
        tone: "ok",
        headline: "Session closed",
        body: "Thanks for taking part.",
      };
  }
}
