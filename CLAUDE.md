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

## Design principles

These are absolute. Do not deviate without an explicit reason.

### Hard rules

1. **No emojis anywhere.** Ever. Use Lucide icons only.
2. **No em-dashes.** Ever. Use regular hyphens (`-`), periods, or commas. Em-dashes read as AI-generated copy.
3. **No scrolling at the page level.** Content fits the viewport, every phase, every role. Internal panel scroll is only permitted when a single panel's content genuinely overflows on small viewports (and should be rare).
4. **No AI co-author attribution** on commits or in code. Do not add `Co-Authored-By` lines.

### Palette

One warm accent. Strict.

- **Brand**: Sainsbury's orange `#ee6a00` (brand-500). Used for active states, primary CTA, numerical highlights. That is the only warm tone.
- **Ink**: monochrome near-black family for text, borders, structure. `#17181a` (ink-900) down to `#f7f8fa` (ink-50).
- **Surfaces**:
  - Page background is `#121316` (surface-base), warm near-black.
  - Dark data panels use `#222326` (surface-panel).
  - White `#ffffff` (surface-raised) is used for the decision panel on team and for landing / lobby / briefing / results cards.
- **Status**: `ok` emerald `#0f9d58`, `risk` rose `#d93f5a`. Rose is used sparingly (disruption banner, delta-down arrows). No amber. No cream. No beige. Anything in the `#ffdfc2` / `#fff3e8` range reads as beige against the orange and is banned.
- **Colour-blind consideration**: user is colour blind. Avoid dark reds. Keep contrast high. Status is always conveyed with an icon or shape in addition to colour.

### Data vs decision

Strong visual separation, this is load-bearing:

- **Data / insight panels** (left column on team, most of facilitator): `Card tone="data"`, dark `bg-surface-panel`, white text, inner tiles on `bg-white/5`.
- **Decision panels** (right column on team, controls on facilitator): `Card` default, white with `shadow-card` and a `ring-1 ring-black/5`.
- **Zone labels**: small eyebrow text above each zone. "Context" (grey) on the left, "Decide" (orange) on the right.

### Typography

- `font-semibold` (600) is the ceiling for headings. No `font-black`. No `font-extrabold`.
- `font-medium` for labels. Normal weight for body.
- `num` utility class (tabular-nums + tight letter-spacing) for any numeric display (timers, scores, KPI values).
- `tracking-tight` for headings, normal for body. `tracking-tighter` only for hero-size headings.
- Use `text-[13px]` or `text-sm` for body inside cards. `text-lg` for section titles. `text-xl` or `text-2xl` for hero.
- Uppercase eyebrows use `text-[11px] font-medium uppercase tracking-wide` and muted colour (`text-ink-500` on light, `text-white/50` on dark).

### Layout

- Team page main area is `grid grid-cols-[minmax(340px,1fr)_2fr]`, i.e. 1/3 context, 2/3 decide.
- Facilitator page main area is `grid grid-cols-12` with a 7/5 split.
- Cards use `rounded-2xl`. Inner tiles use `rounded-xl` or `rounded-lg`.
- Generous padding: `p-4` minimum on inner tiles, `p-5` or `p-6` on cards. Landing cards use `p-8`.
- Gaps between cards at least `gap-4`, more typically `gap-5`.
- For anything that needs to be fixed to the bottom of a card, use CSS grid with explicit rows (`grid-rows-[1fr_auto]`) rather than flex, because the Card component's class forwarding has bitten us before.

### Buttons

- `primary`: brand orange fill, white text. This is the single most important CTA.
- `secondary`: `ink-900` fill, white text.
- `quiet`: `ink-100` fill, dark text. For inline controls (disrupt now, end shift early).
- `ghost`: transparent. For back buttons and cancels.
- `danger`: rose fill. Reserved for genuine alarms.
- No chunky drop shadows. No custom `shadow-btn-ink` offsets. Use `press` class for the subtle press interaction.
- Buttons are rounded-full (pill shape). Keep them at their natural width. Do not stretch to full width unless it is a submit-inside-a-form situation.

### Pills

- Use `tone` + optional `strong` for solid fills.
- Soft pills use `bg-ink-100` + accent text colour, never `bg-brand-50` (reads as beige).
- Surface prop exists for dark card backgrounds (`surface="dark"`).

### Don't

- Don't use emojis.
- Don't use em-dashes in code or copy.
- Don't use beige, cream, amber, yellow, or any warm tone other than Sainsbury's orange.
- Don't use `font-black` or `font-extrabold`.
- Don't let content scroll at the page level.
- Don't hand-write drop shadows. Use the tokens in `tailwind.config.ts`.
- Don't silently drop `className` from shared components. Always include it in `cn()`.

---

## Game mechanics

**Cadence**: 5 shifts x 5 minutes each.

**Flow**: lobby -> briefing -> shift (x5) -> debrief.

**Each shift** auto-triggers a disruption at the 1-minute mark. Facilitator can also "Disrupt now" early. Shift ends when the timer hits zero or all teams submit.

**Decisions**: 7 inputs grouped into 5 tabs.

| Tab | Inputs | Required |
|---|---|---|
| 1. Focus | Priority focus, Action approach | Both |
| 2. Team | Leadership style, Resource allocation (4 sliders, must total 100%) | Both |
| 3. Issue | Primary issue from the 3 active issues | Optional |
| 4. People | Response to a named direct report's situation | Required when a moment is present |
| 5. Confidence | Cautious x0.75 / Measured x1.00 / Confident x1.35 | Required |

**Confidence** multiplies every outcome (visible KPIs and hidden drivers) for the whole shift, good and bad.

**Trend data**: every team's series includes 16 weeks of pre-session baseline history plus the shifts played so far. Round 1 decisions already have meaningful trend context to read into.

**Hidden drivers** are visible only after a shift resolves (on the team results panel) and on the facilitator's coaching cards.

**Panel caps** (server side, enforced by `pickN` in `session.ts`):

- Active issues: always exactly 3 per shift.
- Alerts: up to 2 operational/head-office alerts, plus optional 1 disruption = 3 visible max.
- Designs assume these caps. Do not render more without re-laying out the left column.

**Facilitator guidance**: the coaching script for each phase is generated server-side (`insights.ts`). Debrief and round-results talk-tracks are pure questions with no lead-in instruction ("Don't reveal the scoring logic" style copy is banned). Per-team coaching cards expose observations, considerations and questions without giving away prescriptions.

---

## Architecture notes

### Server

- `server/src/engine/session.ts`: session state machine, round lifecycle, public-state serialisation.
- `server/src/engine/scoring.ts`: decision-to-delta mapping (priority, action, leadership, allocation, primary-issue bonus, people-moment archetype effects, confidence multiplier, disruption impact).
- `server/src/engine/scenarios.ts`: issue / alert / disruption banks.
- `server/src/engine/moments.ts`: 6 people-moment scenarios.
- `server/src/engine/insights.ts`: facilitator coaching. Per-team observations / considerations / questions, room-wide patterns, per-phase talk tracks.
- `server/src/index.ts`: Socket.IO event routing.

### Client

- `client/src/app/page.tsx`: landing (facilitator create + team join).
- `client/src/app/team/[sessionId]/page.tsx`: team player.
- `client/src/app/facilitator/[sessionId]/page.tsx`: facilitator dashboard.
- `client/src/components/ui.tsx`: shared UI kit (Card, Button, Pill, StepBadge, Sparkline, PhaseGuide, Delta, Bar, etc.).
- `client/src/lib/socket.ts`: singleton Socket.IO client.
- `client/src/lib/useSession.ts`: shared session-state hook with server-time offset.
- `client/src/lib/guidance.ts`: phase-specific headline / body copy for facilitator and team PhaseGuide banner.

---

## Deployment

### Client -> Vercel

- Root Directory: `client`
- Install Command: `cd .. && npm install` (critical, monorepo needs root install)
- Build: `npm run build` (default)
- Env var: `NEXT_PUBLIC_SERVER_URL` pointing to Render URL
- Typecheck runs during `next build`. Lint is disabled in `next.config.mjs` (we don't install eslint).

### Server -> Render

- Starter plan or above. Free tier sleeps and kills sessions.
- Build: `npm install`
- Start: `npm --workspace server run start` (runs `tsx src/index.ts`)
- Env vars: `PORT` (auto), `CLIENT_ORIGIN` (Vercel URL, no trailing slash)
- Auto-deploys on push to `main`

**In-memory state caveat**: any server restart clears all active sessions. Queue deploys for between sessions.

---

## Gotchas learned the hard way

### Card component must forward className

See `client/src/components/ui.tsx`. The `Card` component previously regressed to dropping the `className` prop. Every consumer silently lost their layout classes (`flex`, `grid`, `h-*`, `p-*` and so on). Fixed, but worth re-checking if a layout looks "off". Inspect whether the class list on the rendered div actually contains what you passed.

Lesson: when a layout doesn't respond to class changes, inspect the DOM first. Don't assume the component forwards what you pass.

### tsx for the server, not tsc

Running the server through `tsx` (not a `tsc` build) sidesteps the "rootDir does not contain source files" error that comes from the workspace path mapping to `@sim/shared`. Do not try to add a `tsc` build step back to `server/package.json`.

### Next.js + workspace install on Vercel

Vercel needs `cd .. && npm install` as the install command, because the client workspace depends on `@sim/shared` which isn't resolvable without a root-level install.

### No scrolling, ever

Global rule. If content doesn't fit, compact, split, or tab it. Don't add overflow-auto to the page. The decision panel is the one permitted exception and only scrolls internally when a tab's content genuinely overflows on small viewports.

### One accent colour, one warm tone

Adding amber, yellow or any secondary warm tone to a Pill or card background immediately reads as beige against the Sainsbury's orange. Keep soft pills as `bg-ink-100` with brand-orange text. Never use `bg-brand-50` or `bg-brand-100` as a fill.

### Language

- "Shift", not "Round" in user-facing copy. `Round` is kept as the server field name.
- "Your decisions" (plural) because the panel asks for multiple steps.
- Decision tab 5 is called **Confidence**, not "Stake". Gambling connotations are out.
- Persona ranks use store-realistic titles (Duty Manager, Assistant Manager, Shift Supervisor, Team Leader). No "Deputy".

---

## Open items / ideas not built

- Persistence (currently all in-memory). Obvious next step if running multi-day cohorts or wanting a post-session report.
- Authentication for the facilitator route.
- Post-session debrief export (PDF / email).
- More moment / issue / disruption scenarios for variety across repeat facilitation.
- Facilitator ability to seed team names or pre-configure a cohort.
