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
      { id: "opt_c", label: "Tell them you trust their judgement. Adjust the plan to theirs.", archetype: "delegate" },
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
      { id: "opt_c", label: "Tell them the decision is theirs and you'll back whichever way they go.", archetype: "delegate" },
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
      { id: "opt_c", label: "Tell her you trust her to weigh it up, and that you'll respect whichever way she goes.", archetype: "delegate" },
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
  {
    id: "mom_ben_whistle",
    persona: { name: "Ben Okafor", role: "Team Leader", tenure: "2 years in role" },
    situation:
      "Ben pulls you into the back office looking uncomfortable. \"I've watched the same colleague under-ring discounted items for friends three times this week. I haven't told anyone. I don't want to get it wrong.\"",
    prompt: "Ben is asking you to take the next step. How do you respond?",
    options: [
      { id: "opt_a", label: "Thank them and tell them you'll take it from here. Loss prevention picks it up next.", archetype: "directive" },
      { id: "opt_b", label: "Ask them what made this the moment they decided to speak up.", archetype: "coaching" },
      { id: "opt_c", label: "Tell them they've done the right thing and ask how they want to see it handled.", archetype: "delegate" },
      { id: "opt_d", label: "Walk through the process with them so they know what happens next and their part in it.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_kate_feedback",
    persona: { name: "Kate Ryan", role: "Duty Manager", tenure: "7 years in store" },
    situation:
      "You gave Kate feedback this morning about how she handled a customer complaint. She nodded in the moment but has been cool all afternoon, avoiding eye contact. You're about to head into a planning session together.",
    prompt: "You sense the feedback didn't land the way you intended. How do you open the next conversation?",
    options: [
      { id: "opt_a", label: "Park it and push on with the planning session. Performance stands, don't dilute it.", archetype: "directive" },
      { id: "opt_b", label: "Check in: ask how the feedback sat with her overnight.", archetype: "coaching" },
      { id: "opt_c", label: "Leave her space. Trust her to raise it if she needs to.", archetype: "delegate" },
      { id: "opt_d", label: "Name what you're noticing and offer to replay the conversation together.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_nadia_overstretch",
    persona: { name: "Nadia Hassan", role: "Assistant Manager", tenure: "1 year in role" },
    situation:
      "Nadia has quietly been covering two team leader roles for a fortnight while you recruit. She keeps saying \"I'm fine\" but you've seen her stay 90 minutes past shift three days running. She has asked for \"a quick five minutes\".",
    prompt: "You know what's coming. What's the stance you want to walk in with?",
    options: [
      { id: "opt_a", label: "Get ahead of it: tell her what you're taking off her plate, effective now.", archetype: "directive" },
      { id: "opt_b", label: "Ask her what 'fine' has actually looked like for her these two weeks.", archetype: "coaching" },
      { id: "opt_c", label: "Hand her the choice: what does she want to drop, and what does she want to keep?", archetype: "delegate" },
      { id: "opt_d", label: "Sit down together and rebuild the coverage plan from scratch.", archetype: "collaborative" },
    ],
  },
  {
    id: "mom_ryan_return",
    persona: { name: "Ryan Doyle", role: "Team Leader", tenure: "Back from 6 months off sick" },
    situation:
      "Ryan is two weeks back after long-term sick leave. Everyone has been warm, but his team has been carefully skirting the bigger decisions around him. He catches you at the coffee machine. \"I feel like I'm being handled. Am I?\"",
    prompt: "It's a direct question and he's looking at you. How do you respond?",
    options: [
      { id: "opt_a", label: "Be straight: yes, the team has been cautious. Tell him what you'll change.", archetype: "directive" },
      { id: "opt_b", label: "Ask him what being handled feels like from where he's standing.", archetype: "coaching" },
      { id: "opt_c", label: "Tell him his team will take their cue from him. What does he want to signal?", archetype: "delegate" },
      { id: "opt_d", label: "Suggest you and he meet the team together and reset expectations openly.", archetype: "collaborative" },
    ],
  },
];
