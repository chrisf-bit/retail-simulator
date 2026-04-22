# Retail Leadership Simulation

A real-time, multi-team, facilitator-led retail leadership simulation designed for enterprise L&D.

Teams compete head-to-head, each managing a retail store. Decisions are made under time pressure across three 4-minute rounds. Every decision modifies visible KPIs, hidden drivers, and a leaderboard, with mid-round disruptions injected by the facilitator or the engine.

---

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Lucide icons. Hosts on Vercel.
- **Backend:** Node.js + Express + Socket.IO. Hosts on Render.
- **Shared:** TypeScript types and constants consumed by both sides.
- **State:** In-memory on the server (structured so a persistence layer can be added later).

---

## Repository layout

```
.
├── client/          Next.js app (team + facilitator UIs)
├── server/          Express + Socket.IO game server
├── shared/          Types and constants used by both
└── package.json     npm workspaces + dev scripts
```

---

## Local setup

Prerequisites: Node 20+, npm 10+.

```
# from the repo root
npm install

# copy env examples
cp server/.env.example server/.env
cp client/.env.local.example client/.env.local

# start both dev servers
npm run dev
```

The client runs on `http://localhost:5173` and the server on `http://localhost:3001`.

### Running one side at a time

```
npm run dev:server
npm run dev:client
```

---

## Flow

1. A facilitator opens `/` and chooses **Create a session**. They are taken to `/facilitator/:sessionId` with a 5-character session code.
2. Each team opens `/` on their shared laptop, selects **Join a session**, and enters the code and a team name. They land on `/team/:sessionId`.
3. The facilitator clicks **Start briefing**, then **Start Round 1**. All teams start the 4-minute countdown simultaneously.
4. Around the midpoint, either the engine or the facilitator can trigger a disruption event.
5. Teams submit a grouped decision (priority, action approach, leadership style, resource allocation). Submissions lock at timer end or when every team has submitted.
6. The round resolves. KPIs, hidden drivers and the leaderboard update. Facilitator prompts are generated. The facilitator advances to the next round.
7. After round 3 the session enters debrief.

---

## Game engine

Located in `server/src/engine/`.

- `scenarios.ts` — issue, alert, and disruption banks.
- `scoring.ts` — decision-to-delta mapping for both visible KPIs and hidden drivers, plus per-round score.
- `prompts.ts` — facilitator prompt generation from team patterns.
- `session.ts` — session state machine, round lifecycle, timer orchestration, and public state shape.

Each decision always produces a positive effect on at least one KPI, a negative effect on at least one KPI, and a change in at least one hidden driver. The round score combines visible KPIs with weighted hidden drivers and a safety-risk penalty.

---

## Realtime events

All events flow over Socket.IO.

Client → server:
- `session:create`
- `session:join` `{ code, teamName }`
- `session:rejoin` `{ sessionId, teamId }`
- `facilitator:join` `{ sessionId }`
- `facilitator:start_briefing`, `start_round`, `end_round`, `trigger_disruption`, `next_phase`
- `team:submit_decision` `{ sessionId, teamId, decision }`

Server → client:
- `session:created` `{ sessionId, code }`
- `session:joined` `{ sessionId, teamId }`
- `session:state` — full public session snapshot, rebroadcast on every change.
- `error` `{ message }`

The server embeds `serverNow` in every snapshot so clients can compute a local offset and render a synchronised countdown.

---

## Design principles

- **No scrolling.** Every key screen fits within the viewport.
- **Enterprise aesthetic.** Inspired by Stripe / Linear / Notion — neutral base, deep blue accent, muted status colours (green / amber / red).
- **No emojis.** Only Lucide icons.
- **Fast decisions.** All four decision inputs live in a single panel with clear hit areas and a single submit action.

---

## Deployment

### Server on Render
- Build command: `npm install && npm --workspace server run build`
- Start command: `npm --workspace server run start`
- Environment variables: `PORT` (Render sets this), `CLIENT_ORIGIN` (your Vercel URL).

### Client on Vercel
- Root directory: `client`
- Environment variable: `NEXT_PUBLIC_SERVER_URL` = your Render URL.

---

## MVP scope and next steps

MVP includes:
- One live session at a time per server instance (indexed by id and code).
- In-memory state (no persistence).
- Hardcoded issue, alert, and disruption banks.
- Single-page team and facilitator UIs with synced timer.

Likely next steps:
- Persistence layer (Postgres or Redis) for crash recovery and session history.
- Authentication for facilitators.
- Scenario authoring tools and multiple simulation packs.
- Richer disruption/event engine with chained consequences.
- Post-session report export.
