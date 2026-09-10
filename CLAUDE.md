# Retail Leadership Simulation

A real-time, multi-team, facilitator-led retail leadership simulation for enterprise L&D. Teams share a laptop and make time-boxed decisions across eight shifts. Every decision moves live KPIs and four hidden drivers (trust, capability, safety risk, leadership consistency).

Repo: https://github.com/chrisf-bit/retail-simulator

---

## Stack

- **Monorepo** via npm workspaces: `client/` + `server/` + `shared/`
- **Client**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide icons, Socket.IO client. Deployed to Vercel.
- **Server**: Node 20 + Express + Socket.IO. In-memory state with disk-backed persistence (session snapshots to `PERSISTENCE_DIR`, a mounted Render disk at `/var/data` in prod; restored on boot, so game data survives restarts). Runs via `tsx` in both dev and prod (no tsc build step). Deployed to Render.
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

All-dark, Under-Pressure-inspired. The product is **Plumfield Stores**, a fictitious chain - deliberately *not* Sainsbury's. Do not reintroduce orange or any Sainsbury's cue.

Three accents. Magenta and cyan are **semantic zone signals** (not decoration); lime is a reserved data-fill accent. Keep them mapped:

- **Magenta = ACT** (Plumfield brand). `#d033e0` (brand-500), hover `#b31cc4` (brand-600), on-dark tint `#e879f9`/`#f0abfc` (brand-400/300). The decision/input zone, active/selected states, primary CTA, the "Decide" eyebrow, mid-band HUD health.
- **Cyan = READ** (data / insight). `#22d3ee`/`#67e8f9` (teal-400/300 - the token is still named `teal`). Data-panel eyebrows, section labels and data icons (HUD title, Active issues, Alerts, the "Context" eyebrow). Cyan never fills an interactive control - it labels information.
- **Lime = live/healthy data fill.** `#c8e83a`/`#e2f56b` (lime-400/300). Reserved for metric fill bars and healthy HUD readouts (the bright Under Pressure bar look). Never an interactive control, never text-only meaning.
- **Ink**: monochrome family, kept for the rare white surface only.
- **Surfaces (dark tiers - hierarchy comes from stepped elevation + a per-zone accent tint + a 1px accent top-border, not from white)**:
  - Page `#0b0a12` (surface-base), deep violet-black with a faint magenta/cyan corner wash.
  - READ cards `#16121f` (surface-data), cyan-tinted ring.
  - Metrics HUD console `#0d0a15` (surface-console), deepest, cyan ring + cyan ambient glow.
  - ACT / decision panel `#1e1428` (surface-decide), magenta-warm, raised, `ring-brand-500/30` + a soft magenta radial top wash (NOT a hard top-border).
  - **No accent top-border lines on panels.** A 1px accent border on the top edge reads as an "AI design handle" - the user explicitly rejected these. Differentiate zones with surface colour + ring colour + coloured eyebrows (+ the decision panel's soft radial wash) instead.
  - White `#ffffff` (surface-raised) only if a genuine light surface is ever needed.
- **Status**: `ok` emerald `#0f9d58` (`emerald-300/400` on dark), `risk` rose `#f43f6b` (`rose-300/400` on dark). HUD metric health is a three-band scale: ok **lime** / mid **magenta** / low **rose**, with **gradient** bars.
- **Colour-blind consideration**: user is colour blind. Avoid dark reds. Keep contrast high. Status is always conveyed with an icon, arrow or shape in addition to colour (HUD readouts pair health colour with a status dot and a delta arrow).

### Radius scale (consistent curves - load-bearing)

One rhythm, applied everywhere: top-level panels `rounded-2xl`; nested content tiles / inputs `rounded-xl`; small icon/label chips (<=28px) `rounded-lg`; buttons, pills and dots `rounded-full`. Do not mix `rounded-md`/`rounded-lg` on sibling content tiles - it reads as inconsistent.

### Zones: READ vs ACT (load-bearing)

The all-dark UI must never read as flat grey. Every surface belongs to one zone, and the zone is legible from accent + elevation alone:

- **READ zone** (metrics HUD, Active issues, Alerts): `DataCard` (`bg-surface-data`, teal ring), teal eyebrow via `DataHeader`, flat (no glow). "Information - look, don't touch."
- **ACT zone** (the decision panel): `bg-surface-decide`, violet eyebrow, violet ring + faint glow, raised. Selected options fill violet (`bg-brand-500` + violet glow ring); unselected are `bg-white/[0.04]` with `ring-white/10`.
- **Within ACT, type the controls**: *choice* tiles (priority/action/leadership/issue/confidence/people) vs the *allocation* sliders, which live in their own inset control block (`bg-black/20`) so mixing interaction types stays legible.
- **Zone labels**: eyebrow above each zone. "Context" (teal) left, "Decide" (violet) right.

### Metrics HUD

The team round view leads with a full-width console **HUD** band under the header (`MetricsHud` in the team page) - a READ zone, so its title/pulse are teal. Five goal readouts, each with a glowing goal icon, a big tabular value, a delta arrow, a status dot and an animated **gradient** health bar (values view) or sparkline (trends view). It sits on the `#0b0c0f` console field with an ambient teal glow and a slow shimmer. This is the visual centrepiece - keep it bold. Below the HUD the round splits into Context (issues + alerts, left) and Decide (decision panel, right).

### Typography

- `font-semibold` (600) is the ceiling for headings. No `font-black`. No `font-extrabold`.
- `font-medium` for labels. Normal weight for body.
- `num` utility class (tabular-nums + tight letter-spacing) for any numeric display (timers, scores, KPI values).
- `tracking-tight` for headings, normal for body. `tracking-tighter` only for hero-size headings.
- **12px is the hard minimum font size anywhere.** Never use `text-[9px]`, `text-[10px]`, or `text-[11px]` for content. Accessibility floor.
- Use `text-[13px]` or `text-sm` for body inside cards. `text-lg` for section titles. `text-xl` or `text-2xl` for hero.
- Uppercase eyebrows use `text-[12px] font-medium uppercase tracking-wide` and muted colour (`text-ink-500` on light, `text-white/50` on dark).

### Layout

- Team page main area is `grid grid-cols-[minmax(340px,1fr)_2fr]`, i.e. 1/3 context, 2/3 decide.
- Facilitator page main area is `grid grid-cols-12` with a 7/5 split.
- Cards use `rounded-2xl`. Inner tiles use `rounded-xl` or `rounded-lg`.
- Generous padding: `p-4` minimum on inner tiles, `p-5` or `p-6` on cards. Landing cards use `p-8`.
- Gaps between cards at least `gap-4`, more typically `gap-5`.
- For anything that needs to be fixed to the bottom of a card, use CSS grid with explicit rows (`grid-rows-[1fr_auto]`) rather than flex, because the Card component's class forwarding has bitten us before.

### Buttons

- `primary`: brand magenta fill, white text. This is the single most important CTA.
- `secondary`: `ink-900` fill, white text.
- `quiet`: `ink-100` fill, dark text. For inline controls (end shift early).
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
- Don't use beige, cream, amber, orange, or any hue beyond the magenta (ACT), cyan (READ) and lime (data-fill) accents plus the ok/risk status colours.
- Don't use `font-black` or `font-extrabold`.
- Don't let content scroll at the page level.
- Don't hand-write drop shadows. Use the tokens in `tailwind.config.ts`.
- Don't silently drop `className` from shared components. Always include it in `cn()`.

---

## Game mechanics

**Cadence**: 8 shifts x 5 minutes each. Round count is `ROUND_COUNT` in `shared/src/constants.ts`; duration is `ROUND_DURATION_MS`.

**Flow**: lobby -> briefing -> shift (x8) -> debrief.

**Briefing** is a facilitator-driven, animated walkthrough of the real shift screen (not a static explainer). The facilitator steps through `BRIEFING_STEP_COUNT` steps (currently 11) with a Back/Next stepper; the current step is broadcast as `briefingStep` in public state (via the `facilitator:briefing_step` event), so every team's laptop renders the matching demo in lockstep. Only the step index is synced - each screen runs its own local CSS animation, so no frame-level sync is needed. Each step highlights one zone (metrics HUD, Context, one of the five decision tabs, disruption) and dims the rest, driven by synthetic demo data. Step content is shared between the team and facilitator views in `client/src/lib/briefing.ts` (length guarded against `BRIEFING_STEP_COUNT`). `briefingStep` is ephemeral (not persisted); a mid-briefing server restart resets it to 0. On a large-screen venue, a Synthesia AI-avatar welcome video (outgoing manager, room-wide, one audio source) can play before the walkthrough; it points teams to the handover document.

**Handover document**: a persistent "Handover" button in the team header (all phases, `HandoverModal` in the team page) opens a read-only formal handover document as a full-screen modal. Static client-side content (`HANDOVER_SECTIONS` + bracketed placeholders in the modal), identical for every team, so no server state and no sync. Currently placeholder copy (lorem + bracketed guidance) to be replaced with final copy before go-live. Narrative-wise this is the "unreliable narrator" the SME frame calls for: it reflects the outgoing manager's view and is not a reliable ground truth, so teams should read it against what they see on the floor. Dismiss via close button, backdrop, or Escape.

**Each shift** has a `DISRUPTION_CHANCE` (currently 50%) probability of a disruption. When one fires, it lands at a random point within the opening `DISRUPTION_WINDOW` (currently first 50%) of the shift, the same moment for every team (scheduled once, server-side, on the shared round). Some shifts stay clean. There is no facilitator "Disrupt now" override, and the scheduled time is kept off the public round state so teams cannot read it from the socket payload. Shift ends when the timer hits zero or all teams submit.

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
- `client/src/lib/briefing.ts`: shared step content for the briefing walkthrough (title / body / "teams see" line), consumed by both the team `BriefingWalkthrough` and the facilitator stepper. Length is guarded against `BRIEFING_STEP_COUNT`.

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

**Persistence caveat**: sessions are snapshotted to disk (`PERSISTENCE_DIR`, a mounted Render disk at `/var/data`) and restored on boot, so game data survives a restart. A restart still drops all live socket connections (teams/facilitator must reconnect) and resets ephemeral state like `briefingStep` to 0. Still queue deploys for between sessions to avoid the reconnect disruption. If `PERSISTENCE_DIR` is unset it falls back to a relative `./.persistence/sessions` on ephemeral storage - confirm the boot log line `[persistence] using directory ...` points at `/var/data` in prod.

---

## Pen testing

A pen test report is required once the sim is fully built. Notes on how to run it.

**Timing**: run it once feature-complete, on the final stable build you intend to ship (ideally the same commit that goes to the final deploy), not while code is still changing. Fix known hardening gaps during build; let the pen test be independent confirmation.

**Method - test locally, not shared prod.** Do not scan the live URLs. Vercel and Render sit behind their own edge WAF / DDoS protection and their Acceptable Use Policies prohibit unauthorised scanning of infra you don't own - a scanner pointed at prod (e.g. Intruder.io) gets blocked at first contact and can breach ToS. Instead run the identical code locally (`npm run dev`, client `:5173`, server `:3001`) and test that. No WAF, no ToS problem, full log access.

**Scope**: the app layer - Next.js client, and especially the Socket.IO server (`server/src/index.ts`), session-join logic, and event handlers. Out of scope: Vercel/Render infrastructure, other tenants, volumetric DoS.

**Coverage - three parts**:
1. Dependency CVEs: `npm audit --workspaces --include-workspace-root` (and/or `npx snyk test`).
2. Automated web scan: OWASP ZAP Automated Scan against `http://localhost:5173` and `http://localhost:3001`, then Report -> Generate Report (HTML/PDF). Free, one comprehensive report. Note: ZAP does NOT test the WebSocket layer.
3. Access-control & logic testing (manual, highest value - no scanner finds these). A committed adversarial suite lives at [pentest.mjs](pentest.mjs): build shared, start the server locally, then `npm run pentest` (or `PENTEST_URL=... npm run pentest`). It drives the server as a hostile `socket.io-client` and asserts every gate below. Run it after touching any socket handler or validation.

**Known logic/auth findings - now FIXED and guarded by [pentest.mjs](pentest.mjs)** (were build-hardening gaps, hardened 2026-09-10 in `server/src/index.ts` + `session.ts`):
- Facilitator events (`start_briefing / start_round / end_round / briefing_step / next_phase`) are role-gated via `requireFacilitator` (the socket must have authenticated as this session's facilitator). A participant who knows the session id can no longer drive the room.
- `team:submit_decision` / `team:ping` are ownership-gated via `requireTeamOwner` (`socket.data.teamId === teamId`).
- Per-team session tokens: `session:join` mints a random token, stores only its SHA-256 hash on the team, returns the raw token once; `session:rejoin` requires a matching token (legacy pre-token sessions allowed through). Client keeps it in sessionStorage.
- `decision` payloads are validated server-side (`sanitizeDecision`): enums, allocation finite / in-range / totals 100, ids must reference the live round. Rejected outright otherwise.
- Rate limit (40 events / 5s per socket), per-socket session-creation cap, per-handler try/catch, and `uncaughtException`/`unhandledRejection` backstops. Explicit 1MB `maxHttpBufferSize`.
- Headers: server sends nosniff, X-Frame-Options DENY, HSTS, a locked-down default CSP (report route overrides with its own), no `X-Powered-By`; client sets a full CSP + security headers in `client/next.config.mjs` (CSP `connect-src` is pinned to `NEXT_PUBLIC_SERVER_URL` - verify it on a Vercel preview, easy to relax if a screen breaks). CORS allowlists `CLIENT_ORIGIN` + localhost (falls back permissive only if `CLIENT_ORIGIN` is unset - keep it set in prod).
- Session id is `nanoid(10)` and the 5-char join code only works during lobby/briefing, so enumeration is not the exposure; the auth gates above are.

**Dependency audit status** (2026-09-10): `npm audit fix` patched the shippable runtime advisories (the `ws` / `socket.io-parser` socket-layer DoS/memory issues, `nanoid`), lockfile-only. Deliberately left: `next`/`postcss` (needs a Next 14->16 major), `qs` via express (needs express 5 major; query surface is tiny), and `esbuild` (dev-server file-read on Windows; we use tsx's transform API, not esbuild's dev server) - all build-time / dev-only or breaking-major with low real exposure. Re-run `npm audit` every few months and apply non-breaking fixes.

**Infrastructure security (shared responsibility model)**: the hosting layer is the providers' responsibility, evidenced with their compliance docs, not pen tested by us. Include a short section in the report citing Vercel (`vercel.com/security`, SOC 2 Type II) and Render (`render.com/security`, SOC 2 Type II); grab the actual SOC 2 reports/certificates from their Trust Centers if the client is formal. Suggested framing: infrastructure security is handled by the hosting providers under a shared responsibility model; both maintain SOC 2 Type II certification.

**Report structure**: executive summary; scope & rules of engagement (name the commit); methodology; findings (severity/CVSS, evidence, plain-English remediation, auth gap first); appendices (ZAP report, `npm audit` output); infrastructure/shared-responsibility section.

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

### Accents, mapped to zones

Magenta = ACT, cyan = READ, lime = live data-fill. That mapping is the whole point - do not use magenta to label a data panel, or cyan/lime to fill an interactive control. Beyond magenta, cyan, lime and the ok/risk status pair, add no further hues (no amber, orange). Never use `bg-brand-50`/`bg-brand-100` as a fill (too pale to read as the accent).

### Language

- "Shift", not "Round" in user-facing copy. `Round` is kept as the server field name.
- "Your decisions" (plural) because the panel asks for multiple steps.
- Decision tab 5 is called **Confidence**, not "Stake". Gambling connotations are out.
- Persona ranks use store-realistic titles (Duty Manager, Assistant Manager, Shift Supervisor, Team Leader). No "Deputy".

---

## Open items / ideas not built

- Persistence: done (disk-backed session snapshots restored on boot; see the Deployment section). A hosted database would be the next step only for multi-day cohorts or a persistent post-session report store.
- Authentication for the facilitator route.
- Post-session debrief export (PDF / email).
- More moment / issue / disruption scenarios for variety across repeat facilitation.
- Facilitator ability to seed team names or pre-configure a cohort.
