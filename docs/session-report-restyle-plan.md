# Session report - restyle plan (for later)

**Status:** planned, not started. Captured 2026-09-18.
**Trigger to pick up:** after the current round of feedback changes lands.

## TL;DR

The end-of-session report is **already built and shipping** - do not rebuild it. The work
is a **cosmetic restyle** of the existing generator to the Plumfield brand, because it still
uses the old Sainsbury's orange and predates the current design language.

## What already exists (leave the data plumbing alone)

- **Generator:** [`server/src/engine/report.ts`](../server/src/engine/report.ts) -
  `generateReport(session): string` returns a self-contained HTML doc (inline `<style>`,
  inline SVG crests, no scripts, no remote assets).
  - `analyseTeam(team)` derives per-team **Strengths** + **Development focus** bullets from
    real decision patterns: metric movement, hidden-driver end-state, priority variety,
    leadership range, escalation frequency, confidence habit, people-moment skips, issue-effort
    concentration, allocation tells. Capped at 5 each. This is the "did well / focus on"
    content - it is genuine, not placeholder.
  - Tables: leaderboard (ranked by `team.score`), per-team metric trajectory
    (baseline / start / end / movement), hidden drivers, shift-by-shift log.
- **Route:** [`server/src/index.ts:89`](../server/src/index.ts#L89) -
  `GET /api/sessions/:sessionId/report.html?token=...`, gated on `session.facilitatorToken`,
  served with a strict locked-down CSP (`default-src 'none'; style-src 'unsafe-inline';
  img-src data:; font-src data:`). The restyle must stay inside that CSP: inline styles + inline
  SVG only, still no scripts or remote assets.
- **Button:** facilitator page, `openReport()` (~`client/src/app/facilitator/[sessionId]/page.tsx:569`),
  shown when `state.phase === "debrief" || "finished"`. Opens the URL with the facilitator token.
  Likely no client change needed.

## Data facts to get right (the mockup got some of these wrong)

- Metrics are **10 metrics under 5 goals**, not "5 KPIs". Goals: `sales, colleagues, service,
  costs, risk`. Metrics: `sales_vs_budget, availability, volume_lfl, esat, csat, labour, shrink,
  waste, scc, audits` (all higher-is-better). See `shared/src/types.ts` + `METRIC_KEYS` /
  `METRIC_SHORT` / `METRICS_OF_GOAL` in `shared/src/constants.ts`.
- Hidden drivers: `trust, capability, safety_risk, leadership_consistency`. Only `safety_risk`
  is **lower-is-better** (`LOWER_IS_BETTER` in report.ts already handles this).
- There **is** a real score: `team.score`. Ranking is `sort((a,b) => b.score - a.score)`. The
  mockup's invented "composite / 1000" is not a thing - use `team.score` and `signed()`.
- Baseline history lives in `session.baselineTrend` (16 weeks). `team.history[]` holds
  per-shift `metricsAfter`, `hiddenAfter`, `roundScore`, `decision`.

## The actual work: restyle report.ts to Plumfield

This is a **print / PDF document** (there is a print-to-PDF hint; facilitators save it for the
room). So unlike the app, **keep it light / white for paper** - do not force the app's dark home
onto a printed page. The rebrand is about hue and polish, not going dark.

1. **Kill the orange.** Replace `--brand: #ee6a00` and the crest `accent = "#ee6a00"`
   (`crestSvg`) with the Plumfield plum. For a white/print ground use the light-theme accents
   from CLAUDE.md: plum fill `#b31cc4` (brand-600), cyan `#0e7490` (READ), darkened lime
   `#7e9c14` (data-fill), ok `#0f9d58`, risk `#f43f6b` (avoid dark reds - user is colour blind;
   the current `--risk: #b8324a` is a dark red and should go).
2. **Apply the design language, print-safe:**
   - Radius scale (panels `rounded-2xl`-equivalent, tiles `rounded-xl`, pills `rounded-full`).
   - Zone accents: leaderboard / metric tables read as cyan (READ); per-team coaching as plum (ACT).
   - Status always paired with a shape/arrow/dot as well as colour (colour-blind rule). The
     existing `deltaDirection` up/down/flat + `Improved/Declined/Held` labels already do this -
     keep the words, add an arrow glyph (inline SVG).
   - No emojis, no em-dashes, 12px min font, `font-semibold` ceiling, tabular-nums on figures.
3. **Optional visual upgrade (nice-to-have, print-friendly):** port the mockup's touches that
   survive on paper - gradient/solid metric bars, a small per-team composite sparkline built as
   inline SVG (data is in `team.history`), the strength/development split as two tinted columns.
   Use the artifact at the design reference: the scratchpad mockup
   `session-report.html` (this session) is the visual target - but correct its data model to the
   10-metric / 5-goal / real-`team.score` reality above.
4. **Two-theme question:** the app supports light + dark, but a printed report does not toggle.
   Decide: (a) keep it single light/print theme (simplest, recommended), or (b) add a
   `prefers-color-scheme` dark screen view that flips to light `@media print`. Recommend (a)
   unless someone wants to read it on-screen in the dark - the app already covers on-screen.

## Guardrails

- Stay within the report route's strict CSP: inline `<style>` + inline SVG only. **No scripts**
  (so any sparkline/bar must be pure SVG/CSS, computed server-side in the template string).
- Do not reintroduce orange or any Sainsbury's cue anywhere, including crests.
- `npm run typecheck` before pushing (Vercel build type-checks).
- Purely a `report.ts` change; the route, auth, and button should not need touching.

## Rough size

Half a day. It is one file (`report.ts`), no new endpoints, no client work, no data model
changes. The risk is scope creep on the "optional visual upgrade" - the minimum viable win is
just steps 1-2 (de-orange + brand hues + status shapes).
