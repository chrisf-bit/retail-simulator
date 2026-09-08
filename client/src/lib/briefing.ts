import { BRIEFING_STEP_COUNT } from "@sim/shared";

// Content for the facilitator-driven briefing walkthrough. The array length must
// equal BRIEFING_STEP_COUNT (the server clamps the shared step index to that
// range); the assertion below fails the build if they drift apart.
export const BRIEFING_STEPS: Array<{ title: string; body: string; teamsSee: string }> = [
  {
    title: "Welcome to your store",
    body: "This is your store screen. Over the next few minutes we'll walk through every part of it, so you know exactly what you are looking at when the first shift opens.",
    teamsSee: "The full screen, at rest.",
  },
  {
    title: "Read your store",
    body: "The HUD across the top is your live scoreboard. Five goals, each with a health bar and a trend. Lime is healthy, magenta is under pressure, red needs you. Watch it move as decisions land.",
    teamsSee: "The metrics HUD lights up and the bars move.",
  },
  {
    title: "What's happening",
    body: "On the left is your Context. Active issues are what is live in the store right now; Alerts are messages from head office and operations. Read these before you act.",
    teamsSee: "The Context column with issues and alerts.",
  },
  {
    title: "Set your focus",
    body: "On the right, your decisions, in five quick tabs. Start with Focus: your priority under pressure, and how you will act on it.",
    teamsSee: "The Focus tab, with a priority and action selected.",
  },
  {
    title: "Lead your team",
    body: "Team is how you lead and where you put people. Pick a leadership style, then split 100% of your team's time across the four areas of the store.",
    teamsSee: "The Team tab; sliders glide to a 100% split.",
  },
  {
    title: "Target an issue",
    body: "Issue lets you point your effort at one thing that matters, or deliberately stay broad. Targeting sharpens your impact, and either way it is a real choice.",
    teamsSee: "The Issue tab, with one issue targeted.",
  },
  {
    title: "Handle the people moment",
    body: "People is a real member of your team who needs you this shift. How you respond shapes trust and capability, quietly, behind the scores.",
    teamsSee: "The People tab, with a response chosen.",
  },
  {
    title: "Back your plan",
    body: "Confidence multiplies everything you just decided, good and bad. Play it cautious, measured, or confident. It is the last call you make each shift.",
    teamsSee: "The Confidence tab, with a level chosen.",
  },
  {
    title: "Expect the unexpected",
    body: "Some shifts, something breaks. A disruption can strike at any moment, like this. Read it, adapt your decisions, and keep leading. Not every shift has one.",
    teamsSee: "A disruption strikes in the Alerts column.",
  },
  {
    title: "The store is yours",
    body: "That is the whole picture: read the store, make your call, back it. When you start Shift 1, the clock runs.",
    teamsSee: "The full screen, bright and ready.",
  },
];

if (BRIEFING_STEPS.length !== BRIEFING_STEP_COUNT) {
  throw new Error(
    `BRIEFING_STEPS length (${BRIEFING_STEPS.length}) must equal BRIEFING_STEP_COUNT (${BRIEFING_STEP_COUNT}).`,
  );
}

export function briefingStepGuidance(step: number): { tone: "info"; headline: string; body: string } {
  const clamped = Math.max(0, Math.min(BRIEFING_STEPS.length - 1, step));
  const s = BRIEFING_STEPS[clamped];
  return {
    tone: "info",
    headline: `Walkthrough ${clamped + 1} of ${BRIEFING_STEPS.length}: ${s.title}`,
    body: s.body,
  };
}
