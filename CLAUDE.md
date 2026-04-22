# Retail Leadership Simulation

A real-time, multi-team, facilitator-led retail leadership simulation for enterprise L&D. Teams share a laptop and make time-boxed decisions across five shifts. Every decision moves live KPIs and four hidden drivers (trust, capability, safety risk, leadership consistency).

Repo: https://github.com/chrisf-bit/retail-simulator

---

## Stack

- **Monorepo** via npm workspaces: `client/` + `server/` + `shared/`
- **Client**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide icons, Socket.IO client. Deployed to Vercel.
- **Server**: Node 20 + Express + Socket.IO. In-memory state. Runs via `tsx` in both dev and prod (no tsc build step). Deployed to Render.
- **Shared**: TypeScript types + constants consumed by both sides.

---

## Commands

From the repo root:

```
npm install          # install everything (workspaces)
npm run dev          # client on :5173, server on :3001
npm run typecheck    # all three workspaces
```

**Always run `npm run typecheck` before pushing.** Vercel's build has TypeScript type-checking enabled and will fail on errors.

---

## Design language

### Palette

One accent. Strict.

- **Brand**: Sainsbury's orange `#ee6a00` (brand-500). Used for active states, primary CTA, numerical highlights.
- **Ink**: monochrome near-black family for text, borders, structure. `#17181a` (ink-900) down to `#f7f8fa` (ink-50).
- **Surfaces**: page is `#121316` (surface-base) — dark. Dark panels use `#222326` (surface-panel). White is `#ffffff` (surface-raised), used for the decision panel and landing cards.
- **Status**: `ok` emerald `#0f9d58`, `risk` rose `#d93f5a` (used sparingly — disruption banner, delta arrows only). No amber. No cream/beige.

### Data vs decision

Strong visual separation — this is load-bearing:

- **Data/insight panels** (left column on team, most of facilitator): `Card tone="data"` — dark `bg-surface-panel`, white text, inner tiles on `bg-white/5`.
- **Decision panels** (right column on team, controls on facilitator): `Card` default — white with `shadow-card` and a `ring-1 ring-black/5`.
- **Zone labels**: small eyebrow text above each zone — "Context" (grey) on the left, "Decide" (orange) on the right.

### Typography

- `font-semibold` (600) is the ceiling for headings. No `font-black`.
- `font-medium` for labels. Normal weight for body.
- `num` utility class (tabular-nums + tight letter-spacing) for any numeric display.
- `tracking-tight` for headings, normal for body.

### Layout

- **No scrolling**. Hard rule. Viewport must always fit all content. Internal panel scroll is only acceptable as a fallback.
- Team page is `grid-cols-[minmax(340px,1fr)_2fr]` — 1/3 context, 2/3 decide.
- Facilitator page is `grid-cols-12` with a 7/5 split.

### Buttons

- `primary` = brand orange fill, white text.
- `secondary` = `ink-900` fill, white text.
- `quiet` = `ink-100` fill, dark text (for inline controls).
- No chunky drop shadows. No `shadow-btn-ink`-style custom offsets.

---

## Game mechanics

**Cadence**: 5 shifts × 5 minutes each.

**Flow**: lobby → briefing → shift (×6) → debrief.

**Each shift** auto-triggers a disruption at the 1-minute mark. Facilitator can also "Disrupt now" early. Shift ends when timer hits zero or all teams submit.

**Decisions**: 7 inputs grouped into 5 tabs:

| Tab | Inputs | Required |
|---|---|---|
| 1. Focus | Priority focus, Action approach | Both |
| 2. Team | Leadership style, Resource allocation (4 sliders, total 100%) | Both |
| 3. Issue | Primary issue from the 3 active issues | Optional |
| 4. People | Response to a named direct report's situation | Required when a moment is present |
| 5. Confidence | Cautious ×0.75 / Measured ×1.00 / Confident ×1.35 | Required |

**Confidence** multiplies every outcome (visible KPIs and hidden drivers) for the whole shift — good and bad.

**Trend data**: every team's series includes 16 weeks of pre-session baseline history plus the shifts played so far. Round 1 decisions already have meaningful trend context to read into.

**Hidden drivers** are visible only after a shift resolves (on the team results panel) and on the facilitator's coaching cards.

---

## Architecture notes

### Server

- `server/src/engine/session.ts` — session state machine, round lifecycle, public-state serialisation.
- `server/src/engine/scoring.ts` — decision-to-delta mapping (priority, action, leadership, allocation, primary-issue bonus, people-moment archetype effects, confidence multiplier, disruption impact).
- `server/src/engine/scenarios.ts` — issue / alert / disruption banks.
- `server/src/engine/moments.ts` — 6 people-moment scenarios.
- `server/src/engine/insights.ts` — facilitator coaching: per-team observations/considerations/questions, room-wide patterns, per-phase talk tracks (round_results and debrief are pure-question prompts).
- `server/src/index.ts` — Socket.IO event routing.

### Client

- `client/src/app/page.tsx` — landing (facilitator create + team join).
- `client/src/app/team/[sessionId]/page.tsx` — team player.
- `client/src/app/facilitator/[sessionId]/page.tsx` — facilitator dashboard.
- `client/src/components/ui.tsx` — shared UI kit (Card, Button, Pill, StepBadge, Sparkline, PhaseGuide, Delta, Bar, etc.).
- `client/src/lib/socket.ts` — singleton Socket.IO client.
- `client/src/lib/useSession.ts` — shared session-state hook with server-time offset.
- `client/src/lib/guidance.ts` — phase-specific headline/body copy for facilitator and team PhaseGuide banner.

---

## Deployment

### Client → Vercel

- Root Directory: `client`
- Install Command: `cd .. && npm install` (critical — monorepo needs root install)
- Build: `npm run build` (default)
- Env var: `NEXT_PUBLIC_SERVER_URL` pointing to Render URL
- Typecheck runs during `next build`; lint disabled in `next.config.mjs` (we don't install eslint)

### Server → Render

- Starter plan or above (free tier sleeps and kills sessions)
- Build: `npm install`
- Start: `npm --workspace server run start` (runs `tsx src/index.ts`)
- Env vars: `PORT` (auto), `CLIENT_ORIGIN` (Vercel URL, no trailing slash)
- Auto-deploys on push to `main`

**In-memory state caveat**: any server restart clears all active sessions. Queue deploys for between sessions.

---

## Gotchas learned

### Card component must forward className

[client/src/components/ui.tsx](client/src/components/ui.tsx) — the `Card` component previously regressed to dropping the `className` prop. Every consumer silently lost their layout classes (`flex`, `grid`, `h-*`, `p-*`, etc.). Fixed, but worth re-checking if layout looks "off" — inspect whether the class list on the rendered div actually contains what you passed.

**Lesson**: when a layout doesn't respond to class changes, inspect the DOM. Don't assume the component forwards what you pass.

### tsx for the server, not tsc

Running the server through `tsx` (not a `tsc` build) sidesteps the "rootDir does not contain source files" error that comes from the workspace path mapping to `@sim/shared`. Do not try to add a `tsc` build step back to `server/package.json`.

### Next.js + workspace install on Vercel

Vercel needs `cd .. && npm install` as the install command, because the client workspace depends on `@sim/shared` which isn't resolvable without a root-level install.

### No scrolling, ever

Global rule. If content doesn't fit, compact, split, or tab it — don't scroll. The decision panel is the one permitted exception and only scrolls internally when a tab's content genuinely overflows on small viewports.

### One accent colour

Adding amber / yellow / secondary-warm tones to a Pill or card background immediately reads as "beige" against the warm Sainsbury's orange. Keep soft pills as `bg-ink-100` with brand-orange TEXT; never use `bg-brand-50` / `bg-brand-100` as a fill.

---

## Open items / ideas not built

- Persistence (currently all in-memory). Obvious next step if running multi-day cohorts or wanting a post-session report.
- Authentication for the facilitator route.
- Post-session debrief export (PDF / email).
- More moment / issue / disruption scenarios for variety across repeat facilitation.
- Facilitator ability to seed team names or pre-configure a cohort.
