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
    bestArchetype: "coaching",
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
    bestArchetype: "directive",
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
    bestArchetype: "coaching",
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
    bestArchetype: "coaching",
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
    bestArchetype: "collaborative",
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
    bestArchetype: "collaborative",
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
    bestArchetype: "collaborative",
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
    bestArchetype: "collaborative",
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
    bestArchetype: "coaching",
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
    bestArchetype: "coaching",
  },
  {
    id: "mom_aisha_flex",
    persona: { name: "Aisha Khan", role: "Customer Assistant", tenure: "8 years, caring commitments" },
    situation:
      "Aisha catches you during an availability conversation. \"This new approach - it feels like the flexibility only ever runs one way, towards the store. I've caring commitments at home and I'm worried what this does to them.\"",
    prompt: "Aisha is experienced and well respected, and she is raising this openly. How do you respond?",
    options: [
      { id: "opt_a", label: "Reassure her the change is happening and explain the safeguards that are in place.", archetype: "directive" },
      { id: "opt_b", label: "Ask what specifically concerns her, and what flexibility that works both ways would look like.", archetype: "coaching" },
      { id: "opt_c", label: "Ask her line manager to agree an arrangement with her and update you afterwards.", archetype: "delegate" },
      { id: "opt_d", label: "Share the store's coverage needs and agree an availability window together that works for both sides.", archetype: "collaborative" },
    ],
    bestArchetype: "coaching",
  },
  {
    id: "mom_marcus_online",
    persona: { name: "Marcus Green", role: "Online Manager", tenure: "18 months in role" },
    situation:
      "Online is under real pressure. A multiskilled colleague who could cover is reluctant to move across from their usual area. Their manager, Marcus, tells you they are trained for Online but lack the confidence.",
    prompt: "You need the cover, and you want the colleague to grow into it. How do you handle it?",
    options: [
      { id: "opt_a", label: "Move them onto Online and explain that everyone works where customers need them most.", archetype: "directive" },
      { id: "opt_b", label: "Ask the colleague what is making them hesitant and what would help them feel confident there.", archetype: "coaching" },
      { id: "opt_c", label: "Trust Marcus to handle the conversation and close the gap.", archetype: "delegate" },
      { id: "opt_d", label: "Bring the colleague and Marcus together to agree the support they need and how they will build confidence.", archetype: "collaborative" },
    ],
    bestArchetype: "collaborative",
  },
  {
    id: "mom_sophie_release",
    persona: { name: "Sophie Allen", role: "Trading Manager", tenure: "2 years in role" },
    situation:
      "A nearby store has asked for weekend support. One of your colleagues wants the overtime but has never worked there, and their manager, Sophie, is uneasy about releasing them.",
    prompt: "Both stores are watching how you call this. What do you do?",
    options: [
      { id: "opt_a", label: "Decide whether your store can spare them and tell both managers what will happen.", archetype: "directive" },
      { id: "opt_b", label: "Ask Sophie what is driving her concern and what would make releasing the colleague possible.", archetype: "coaching" },
      { id: "opt_c", label: "Let the colleague and the two managers arrange it between themselves.", archetype: "delegate" },
      { id: "opt_d", label: "Work with Sophie to check local demand, the colleague's skills and the support at the other store before agreeing.", archetype: "collaborative" },
    ],
    bestArchetype: "collaborative",
  },
  {
    id: "mom_priya_shah_process",
    persona: { name: "Priya Shah", role: "Online Manager", tenure: "Recently promoted" },
    situation:
      "A usually reliable colleague's performance has dipped. Priya, recently promoted into the manager role, wants to start a formal process straight away.",
    prompt: "Priya is looking to you to endorse the formal route. How do you respond?",
    options: [
      { id: "opt_a", label: "Tell her to begin documenting the performance concerns.", archetype: "directive" },
      { id: "opt_b", label: "Ask what has changed, what conversations have already happened and what support has been offered.", archetype: "coaching" },
      { id: "opt_c", label: "Trust Priya to follow the process she believes is appropriate.", archetype: "delegate" },
      { id: "opt_d", label: "Review the evidence together and agree the next conversation with the colleague.", archetype: "collaborative" },
    ],
    bestArchetype: "coaching",
  },
  {
    id: "mom_liam_joke",
    persona: { name: "Liam Evans", role: "Customer Assistant", tenure: "Experienced high performer" },
    situation:
      "During the morning huddle, Liam, a respected high performer, makes a belittling joke about a new colleague. It lands badly and the new starter looks crushed.",
    prompt: "It happened in front of the whole team. How do you handle it?",
    options: [
      { id: "opt_a", label: "Stop the comment, reinforce the standard you expect and speak to him privately afterwards.", archetype: "directive" },
      { id: "opt_b", label: "Ask him later how he thinks the comment may have landed.", archetype: "coaching" },
      { id: "opt_c", label: "Ask the huddle leader to deal with it and update you.", archetype: "delegate" },
      { id: "opt_d", label: "Bring the two colleagues together to clear the air.", archetype: "collaborative" },
    ],
    bestArchetype: "directive",
  },
  {
    id: "mom_ben_foster_welfare",
    persona: { name: "Ben Foster", role: "Team Leader", tenure: "6 years in role" },
    situation:
      "A colleague is visibly shaken after a customer verbally abused them. They insist they can carry on because the department is already short-staffed. Their team leader, Ben, is waiting for your call.",
    prompt: "The colleague wants to push through it. What do you do?",
    options: [
      { id: "opt_a", label: "Take them off the shop floor, check their welfare and make sure the incident is handled through the correct process.", archetype: "directive" },
      { id: "opt_b", label: "Ask them what they feel able to do and what support they would find helpful.", archetype: "coaching" },
      { id: "opt_c", label: "Ask Ben to look after the colleague and manage the department.", archetype: "delegate" },
      { id: "opt_d", label: "Agree with the colleague and Ben how to balance their welfare with the immediate coverage gap.", archetype: "collaborative" },
    ],
    bestArchetype: "directive",
  },
  {
    id: "mom_hannah_signoff",
    persona: { name: "Hannah Bell", role: "Assistant Manager", tenure: "5 years in role" },
    situation:
      "Hannah has built a strong plan for the busiest weekend of the month. She has run weekends like this well before, but she is asking you to approve every single deployment decision.",
    prompt: "She is more than capable, yet she is leaning on you to sign off each call. How do you respond?",
    options: [
      { id: "opt_a", label: "Review the plan and tell her exactly what you want changed.", archetype: "directive" },
      { id: "opt_b", label: "Ask which elements of the plan she feels least confident about.", archetype: "coaching" },
      { id: "opt_c", label: "Confirm the outcomes you need, then ask Hannah to finalise and deliver the plan.", archetype: "delegate" },
      { id: "opt_d", label: "Work through each part of the plan with her before approving it.", archetype: "collaborative" },
    ],
    bestArchetype: "delegate",
  },
  {
    id: "mom_jack_nightshift",
    persona: { name: "Jack Turner", role: "Team Leader", tenure: "3 years in role" },
    situation:
      "Jack has spotted that a change to the night-shift pattern would improve coverage, but it would disrupt longstanding arrangements for three colleagues. He is unsure how to proceed and has brought it to you.",
    prompt: "Jack could have pushed it through or sat on it, but he has come to you. How do you steer it?",
    options: [
      { id: "opt_a", label: "Tell Jack to implement the change - the current coverage is not working.", archetype: "directive" },
      { id: "opt_b", label: "Ask him what he thinks a fair outcome would look like.", archetype: "coaching" },
      { id: "opt_c", label: "Ask Jack to consult the colleagues and decide how to proceed.", archetype: "delegate" },
      { id: "opt_d", label: "Explore the options with Jack and agree how the colleagues will be involved before anything changes.", archetype: "collaborative" },
    ],
    bestArchetype: "collaborative",
  },
  {
    id: "mom_matthew_handover",
    persona: { name: "Matthew Collins", role: "Assistant Manager", tenure: "1 year in role" },
    situation:
      "In your handover, the previous Store Manager described Matthew as resistant to change, inconsistent and needing close management. You have never worked with him, and you have not yet heard his side.",
    prompt: "The handover has coloured your view before you have even met him. How do you approach Matthew?",
    options: [
      { id: "opt_a", label: "Explain the concerns raised, set clear expectations and monitor him closely from the outset.", archetype: "directive" },
      { id: "opt_b", label: "Ask Matthew how he thinks his first year has gone, what he is proud of and where he wants to develop.", archetype: "coaching" },
      { id: "opt_c", label: "Treat it as a fresh start, give him greater responsibility and trust him to show what he can do.", archetype: "delegate" },
      { id: "opt_d", label: "Hold the handover as one perspective, meet Matthew with an open mind and agree what good looks like as you form your own view.", archetype: "collaborative" },
    ],
    bestArchetype: "collaborative",
  },
];
