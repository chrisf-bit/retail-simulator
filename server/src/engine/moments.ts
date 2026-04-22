import type { TeamMoment } from "@sim/shared";

export const MOMENT_BANK: TeamMoment[] = [
  {
    id: "mom_sam_pushback",
    persona: { name: "Sam Taylor", role: "Duty Manager", tenure: "12 years in store" },
    situation:
      "Sam corners you in the backroom, arms crossed. \"Your allocation plan won't work. We'll be drowning on shop floor by three. I've run this store through worse and I'm telling you now.\"",
    prompt: "Sam has more store experience than you. You have the decision rights. How do you respond?",
    options: [
      { id: "opt_a", label: "Hold the line. Explain your rationale and move on.", archetype: "directive" },
      { id: "opt_b", label: "Ask them what specifically they're seeing that you might be missing.", archetype: "coaching" },
      { id: "opt_c", label: "Tell them you trust their call - adjust the plan to theirs.", archetype: "delegate" },
      { id: "opt_d", label: "Invite them to refine the plan with you in the next five minutes.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_alex_conflict",
    persona: { name: "Alex Rivera", role: "Assistant Manager", tenure: "6 months in role" },
    situation:
      "Alex pulls you aside looking uncomfortable. \"Two of the team leaders had a flare-up this morning over the rota. I don't know whether to step in or let them sort it. What would you do?\"",
    prompt: "Alex is asking for your view. They're new to leading leaders. How do you respond?",
    options: [
      { id: "opt_a", label: "Give them your answer so they can act on it.", archetype: "directive" },
      { id: "opt_b", label: "Ask them what they think the risks of each choice are.", archetype: "coaching" },
      { id: "opt_c", label: "Tell them it's their call and you'll back whichever they pick.", archetype: "delegate" },
      { id: "opt_d", label: "Offer to think it through with them for ten minutes now.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_jo_absent",
    persona: { name: "Jo Chen", role: "Shift Supervisor", tenure: "4 months in role" },
    situation:
      "Jo has now missed two shift briefings this week. The team leaders have started asking around whether the briefings even matter. Jo is capable but you're picking up a pattern.",
    prompt: "You need to land this conversation well. How do you open it?",
    options: [
      { id: "opt_a", label: "Be clear: briefings are non-negotiable, and you need to see them there.", archetype: "directive" },
      { id: "opt_b", label: "Ask them what's getting in the way and what support they need.", archetype: "coaching" },
      { id: "opt_c", label: "Let them own it - ask them what they want to commit to.", archetype: "delegate" },
      { id: "opt_d", label: "Revisit the briefing together - is the time or format working?", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_priya_leave",
    persona: { name: "Priya Patel", role: "Team Leader", tenure: "3 years, top performer" },
    situation:
      "Priya catches you near the lockers at end of shift. \"I've been offered another role at a competitor. I'm seriously considering it. I feel like I'm treading water here and nothing's changing.\"",
    prompt: "Priya is one of your strongest. You have a few minutes before her next shift. How do you respond?",
    options: [
      { id: "opt_a", label: "Lay out what you can realistically offer and where the constraints sit.", archetype: "directive" },
      { id: "opt_b", label: "Ask her what 'treading water' looks like to her, specifically.", archetype: "coaching" },
      { id: "opt_c", label: "Tell her you trust her to weigh it up - and that you'll respect her call.", archetype: "delegate" },
      { id: "opt_d", label: "Offer to co-design what the next 90 days could look like.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_dan_flat",
    persona: { name: "Dan Morgan", role: "Assistant Manager", tenure: "5 years, recently passed over for promotion" },
    situation:
      "Dan delivered a flat \"whatever you think\" to a junior colleague's suggestion this morning. It landed badly - you saw the colleague visibly deflate. Dan is technically strong but has felt distant since the promotion round.",
    prompt: "This is a pattern you've been letting slide. How do you handle it?",
    options: [
      { id: "opt_a", label: "Pull Dan aside and name the behaviour - tell them the bar.", archetype: "directive" },
      { id: "opt_b", label: "Ask Dan how they think their responses are landing with the team.", archetype: "coaching" },
      { id: "opt_c", label: "Have the junior colleague feed back directly to Dan.", archetype: "delegate" },
      { id: "opt_d", label: "Sit with Dan and talk honestly about what the last few months have been like.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_rota_request",
    persona: { name: "Mia Kowalski", role: "Team Leader", tenure: "18 months in role" },
    situation:
      "Mia asks for flexibility on shifts for a personal situation, but the change would strain the rota others just accepted. She says she hasn't told anyone else on the team why.",
    prompt: "The fair-process question is live. How do you handle the request?",
    options: [
      { id: "opt_a", label: "Decline - protecting equity across the team matters more than any one case.", archetype: "directive" },
      { id: "opt_b", label: "Ask Mia what she thinks a fair outcome looks like.", archetype: "coaching" },
      { id: "opt_c", label: "Approve it and trust her to manage any fallout with the team.", archetype: "delegate" },
      { id: "opt_d", label: "Work out a solution together that could extend to others later.", archetype: "collaborative" },
    ],
  },
];
