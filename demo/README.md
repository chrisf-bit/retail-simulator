# NCP sales demo

A self-contained, clickable preview of the Plumfield Leadership Simulation, built
for prospect pitches (first cut: NCP).

## What it is

`ncp-preview.html` is a single, standalone HTML file - no server, no build, no
internet. Double-click it to open in any browser.

It previews **shifts 3-6** of a session with **four NCP teams** playing head to
head:

- **Team view** - play a team through the real decision panel (Focus / Team /
  Issue / People / Confidence), then end the shift and watch the HUD resolve and
  the hidden drivers reveal. Pick which team you play under "Playing as".
- **Facilitator view** - the head-to-head leaderboard (animated overtake) plus
  the four coaching cards: each team's decisions, metrics, the coaching question,
  and hidden drivers.

## Scripted, on authentic figures

The outcomes are **scripted** so the story always lands, but every number was
**computed by the real scoring engine** (`server/src/engine/scoring.ts`) run
offline with four scripted teams across six shifts. It is not a hand-drawn
mock-up.

The narrative arc:

- Shifts 3-4: **Deansgate** leads - the confident, customer-pleasing fast starter.
- Shift 5: **Paradise** overtakes - steady, people-first leadership.
- Shift 6: **Arndale** finishes last; its hidden drivers (trust ~47, capability
  ~26) show the cost of chasing the scoreboard. **Heathrow** holds safety risk
  near zero - the safe pair of hands.

Alerts shown in the Context column are authentic copy from the content bank and
are illustrative only (alerts are not scored).

## Notes

- Purely a marketing/sales asset. It is independent of the live app - nothing
  here affects the deployed client or server.
- Dark theme only, matching the product's design home.
