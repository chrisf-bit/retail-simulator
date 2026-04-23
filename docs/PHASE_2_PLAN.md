# Phase 2: resilience, persistence, and post-session reports

## Goals

1. **Connection protection**: if a team's device drops its connection, it rejoins automatically with no state loss and no action required from the team or facilitator.
2. **Connection health visibility**: facilitator sees per-team connection status as a coloured indicator (green = connected, amber = struggling, red = dropped) so they know whether to hold the room or press on.
3. **Persistent storage**: an accidental server restart mid-session no longer destroys the session. Teams reconnect and find the session exactly as it was.
4. **Post-session report**: facilitator can download a per-team report at the end of a session highlighting strengths and development areas, suitable for sharing with participants or their manager.

## Non-goals (out of scope for this phase)

- Multi-session history dashboards.
- Participant accounts / authentication.
- Cross-device facilitator login (still URL-based for now).
- Real-time video or comms.
- Multi-tenant (multiple orgs on one deployment).

---

## Architecture decisions

### 1. Persistence

**Recommendation**: Render persistent disk + JSON snapshot file.

**Reasoning**:
- The data model is small (a handful of active sessions, each a few KB).
- State is session-scoped, not relational. No aggregations across sessions yet.
- A disk-backed JSON file matches the in-memory model exactly: on boot, load the file and repopulate `SessionStore`. On every state change, debounced-write the file back.
- Zero network dependency, so no extra latency on every state broadcast.
- Cheap: Render disks are $0.25/GB/month, minimum 1GB.
- Simpler than standing up Postgres / Redis for a project where we only have session state.

**Alternative considered**: Supabase Postgres (free tier). Pros: proper querying, future-ready for reports, multi-session analytics. Cons: adds a network hop on every write, schema migrations, more code. Worth revisiting in Phase 3 if we add accounts, history, or cross-session analytics.

**Decision**: **A. Disk + JSON**.

---

### 2. Connection protection

**Recommendation**: server tracks `lastSeenAt` per team, derives status with three thresholds.

**How it works**:
- Server adds a `lastSeenAt: number` to each team in `TeamFull`.
- On every socket event from a team (join, rejoin, submit decision, periodic heartbeat), update `lastSeenAt = Date.now()`.
- Server runs a ticker every 3 seconds that computes derived `connectionStatus` per team and broadcasts session state if any changed.
- Client emits a lightweight `team:ping` every 10 seconds while visible.

**Thresholds**:
- `connected` (green): last seen < 8s ago.
- `struggling` (amber): 8s to 25s.
- `dropped` (red): > 25s.

**On reconnect**:
- Socket.IO already retries automatically. The client's `useSession` hook listens for `connect` events.
- When `connect` fires, the client immediately emits `session:rejoin` with the `teamId` stored in `sessionStorage`.
- Server validates the team still exists in the session, re-joins the socket to the room, and emits fresh `session:state`.
- UI updates seamlessly.

**Edge case: server restart kills the session**:
- Client emits rejoin, server returns `error: "session not found"`.
- Client shows a friendly "Session ended, see your facilitator" screen, clears stored teamId.
- Persistence (above) prevents this outside of catastrophic restart.

**UI indicator design**:
- **Facilitator view**: small coloured dot next to each team's name in the leaderboard and coaching cards.
- **Team view**: small pill in the header next to the timer (only visible when status is not `connected`).

---

### 3. Report download

**Recommendation**: server-side HTML render, downloadable as an HTML file, print-to-PDF in the browser if the facilitator wants a PDF.

**Reasoning**:
- Avoids a heavy PDF library on the server.
- Facilitators can download HTML, open in browser, and use "Print to PDF" for a polished PDF.
- HTML report can include sparklines (SVG) and coaching content natively.
- Future upgrade path: a headless-Chrome PDF generator or a third-party service if polished PDF out-of-the-box becomes important.

**Alternative considered**: server-side PDF generation via `pdfkit` or `puppeteer`. Pros: one-click PDF download. Cons: bigger dependency, Puppeteer adds ~100MB to the Render instance.

**Decision**: **A. HTML download, print-to-PDF in browser**.

**Report content (per team)**:
- Final rank and score
- Shift-by-shift score movement line chart
- Each KPI: start, end, delta, sparkline
- Hidden drivers: final values + sparkline
- Decision patterns: priority mix, action mix, leadership mix, confidence mix (stacked bar or donut)
- People moment responses list
- Strengths (derived from positive patterns): 3 bullets
- Development areas (derived from negative patterns): 3 bullets, framed as questions ("Worth exploring: ...")
- Coaching questions the facilitator asked (from the insights engine)

**Report structure (session level)**:
- Session summary: date, number of teams, final standings
- Room-wide patterns (from insights engine)
- Per-team sections as above

---

## Data model changes

### Shared types

```ts
// Connection status
export type ConnectionStatus = "connected" | "struggling" | "dropped";

// On TeamPublic
connectionStatus: ConnectionStatus;
lastSeenAt?: number;
```

### Server internal

```ts
// TeamFull gets:
socketId?: string;      // current socket, cleared on disconnect
lastSeenAt: number;     // wall clock, updated on any team event
```

### Persistence

```ts
// Serialised session shape (JSON)
interface PersistedSession {
  id: string;
  code: string;
  expectedTeams: number;
  phase: SessionPhase;
  baselineTrend: TrendSeries;
  usedMomentIds: string[];
  teams: Array<TeamFull>;   // minus socketId
  round?: RoundState;
  createdAt: number;
  updatedAt: number;
}
```

Stored at `$DISK_ROOT/sessions/{sessionId}.json`. One file per session. On boot, scan the directory and hydrate.

---

## Rollout in four pull requests

### PR 1: connection protection

- Server: `lastSeenAt` on team, update on all team-originated events, 3s ticker to derive status, include in public state.
- Server: accept `team:ping` event as a heartbeat.
- Client: hook listens for socket `connect`/`disconnect`, emits `session:rejoin` on reconnect, emits `team:ping` every 10s.
- Client: `Connection` component rendering a status dot.
- Facilitator view: dot in leaderboard and coaching card.
- Team view: status pill in header when not connected.

### PR 2: persistence

- Server: add file-based session store layer with snapshot + hydrate.
- Server: debounced write (500ms) on every state change.
- Server: on boot, hydrate from disk. Clean up sessions older than 24h.
- Render: attach a 1GB persistent disk, env var `PERSISTENCE_DIR`.
- Validate: kill-and-restart the server mid-session, verify state returns.

### PR 3: report backend

- Server: `GET /api/sessions/:id/report.html` endpoint. Validates session exists (by id). Returns a self-contained HTML document with embedded CSS and SVG.
- Server: extend insights engine to produce report-specific strengths/development sections from history (richer than the in-round coaching).

### PR 4: report UI + polish

- Facilitator view: "Download report" button in the debrief phase (and after session closes). Links to the report endpoint, opens in a new tab.
- Report page: styled with same design tokens. Printable (CSS `@media print`).
- Small additions: small "Session saved" toast when persistence writes, "Session ended" screen if a team tries to rejoin a dead session.

---

## UI changes

### Team view

- Header: add small `ConnectionPill` between the timer and score. Invisible when `connected`.
- When dropped, team view shows a semi-transparent overlay: "Reconnecting..." with a subtle spinner. No action needed, lifts automatically when reconnected.

### Facilitator view

- Leaderboard: coloured dot before the team name.
- Coaching card: coloured dot next to the team name in the card header.
- New debrief-phase button: "Download session report" (primary CTA alongside "Close session").

### Landing

- No change required.

---

## Deployment implications

### Render

- Add a persistent disk: Dashboard -> Service -> Settings -> Disks -> Add disk. 1GB, mount path `/var/data`.
- Add env var `PERSISTENCE_DIR=/var/data/sessions`.
- Cost: ~$0.25/month on top of current Starter plan.

### Vercel

- No change.

---

## Risks and trade-offs

- **Disk fills up**: mitigated by a 24h cleanup job. Each session is a few KB.
- **Write amplification**: debounced to 500ms, so no more than 2 writes/second/session even under heavy activity.
- **Stale sessions in memory after restart but before hydrate**: not possible because hydrate runs before the HTTP server starts.
- **False "dropped" status on tab background**: browsers may throttle timers on backgrounded tabs, so heartbeats might slow. Acceptable. Status returns to green as soon as the tab is active again.
- **Report download reveals hidden drivers**: by design, reports are for post-session coaching and include the full picture. Facilitator's call whether to share directly with teams.

---

## Resolved decisions

1. **Report content**: summarised patterns only. Full per-shift decision history is out of scope for this phase.
2. **Baseline trend**: per-team in the report. Each team's report reflects their own store's 16-week backstory plus the shifts they played.
   - Server impact: baseline trend moves from session-level to team-level. Generated on team join rather than session creation. Team insights already work off each team's own `history`, so no change there.
3. **Facilitator notes**: not included. Facilitators can write their own notes outside the app if they want.
4. **Session retention**: 24 hours. Cleanup job on server boot and on a 1h interval removes any session whose `updatedAt` is older than 24h.

All decisions above are locked for Phase 2. Revisit in Phase 3 if needed.
