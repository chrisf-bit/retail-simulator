import type { HiddenDrivers, Kpis, TeamFull, TrendSeries } from "@sim/shared";
import {
  ACTION_LABELS,
  CONFIDENCE_LABELS,
  HIDDEN_LABELS,
  KPI_SHORT,
  LEADERSHIP_LABELS,
  PRIORITY_LABELS,
  crestFor,
  type CrestAccent,
  type CrestIcon,
  type CrestShape,
} from "@sim/shared";
import type { Session } from "./session.js";

type KpiKey = keyof Kpis;
type HiddenKey = keyof HiddenDrivers;

const KPI_KEYS: KpiKey[] = ["sales", "shrinkage", "customer", "engagement", "operations"];
const HIDDEN_KEYS: HiddenKey[] = ["trust", "capability", "safety_risk", "leadership_consistency"];

// Shrinkage and safety_risk are "lower is better", everyone else "higher is better".
const LOWER_IS_BETTER: Record<string, boolean> = {
  shrinkage: true,
  safety_risk: true,
};

function crestSvg(teamName: string, size = 44): string {
  const c = crestFor(teamName);
  const stroke = "#17181a";
  const fill = "#ffffff";
  const accent = "#ee6a00";
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">${shape(c.shape, stroke, fill)}${accentShape(c.accent, c.shape, accent)}${iconShape(c.icon, stroke)}</svg>`;
}

function shape(s: CrestShape, stroke: string, fill: string): string {
  const attrs = `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"`;
  switch (s) {
    case "shield":
      return `<path d="M32 6 L54 14 V32 C54 46 44 54 32 58 C20 54 10 46 10 32 V14 Z" ${attrs}/>`;
    case "hexagon":
      return `<path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" ${attrs}/>`;
    case "circle":
      return `<circle cx="32" cy="32" r="26" ${attrs}/>`;
    case "square":
      return `<rect x="8" y="8" width="48" height="48" rx="12" ${attrs}/>`;
    case "diamond":
      return `<path d="M32 4 L60 32 L32 60 L4 32 Z" ${attrs}/>`;
  }
}

function accentShape(a: CrestAccent, s: CrestShape, color: string): string {
  switch (a) {
    case "dot":
      return `<circle cx="${s === "diamond" ? 50 : 48}" cy="${s === "diamond" ? 20 : 16}" r="3" fill="${color}"/>`;
    case "stripe":
      return `<path d="M10 20 L54 20" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case "ring":
      return `<circle cx="32" cy="32" r="23" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 4"/>`;
    case "corner":
      return `<path d="M44 8 L56 8 L56 20" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case "underline":
      return `<path d="M18 48 L46 48" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case "bar":
      return `<rect x="30.5" y="14" width="3" height="8" rx="1" fill="${color}"/>`;
  }
}

function iconShape(i: CrestIcon, stroke: string): string {
  const a = `stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  switch (i) {
    case "storefront":
      return `<g ${a} transform="translate(20 22)"><path d="M1 5 L4 1 H20 L23 5"/><path d="M3 5 V21 H21 V5"/><path d="M1 5 H23"/><path d="M10 21 V14 H14 V21"/></g>`;
    case "trolley":
      return `<g ${a} transform="translate(18 26)"><path d="M2 2 H6 L8 6"/><path d="M8 6 H26 L23 15 H10 Z"/><circle cx="12" cy="19" r="2"/><circle cx="22" cy="19" r="2"/></g>`;
    case "basket":
      return `<g ${a} transform="translate(18 22)"><path d="M8 6 C8 2 12 0 14 0 C16 0 20 2 20 6"/><path d="M2 6 H26 L23 20 H5 Z"/><path d="M10 6 L11 20"/><path d="M18 6 L17 20"/></g>`;
    case "tag":
      return `<g ${a} transform="translate(18 18)"><path d="M2 14 L14 2 L28 2 L28 16 L16 28 Z"/><circle cx="22" cy="8" r="2"/></g>`;
    case "scales":
      return `<g ${a} transform="translate(18 22)"><path d="M14 2 V22"/><path d="M8 22 H20"/><path d="M3 8 H25"/><path d="M7 8 L4 14"/><path d="M7 8 L10 14"/><path d="M21 8 L18 14"/><path d="M21 8 L24 14"/><path d="M3 14 H11"/><path d="M17 14 H25"/></g>`;
    case "key":
      return `<g ${a} transform="translate(18 22)"><circle cx="8" cy="12" r="6"/><circle cx="8" cy="12" r="2" fill="${stroke}"/><path d="M14 12 H28"/><path d="M22 12 V16"/><path d="M26 12 V15"/></g>`;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function signed(n: number): string {
  if (n > 0) return `+${Math.round(n)}`;
  return `${Math.round(n)}`;
}

function deltaDirection(before: number, after: number, inverted: boolean): "up" | "down" | "flat" {
  const delta = after - before;
  if (Math.abs(delta) < 1) return "flat";
  const improved = inverted ? delta < 0 : delta > 0;
  return improved ? "up" : "down";
}

function analyseTeam(team: TeamFull): { strengths: string[]; development: string[] } {
  const strengths: string[] = [];
  const development: string[] = [];
  const h = team.history;
  const rounds = h.length;

  if (rounds === 0) {
    return {
      strengths: ["No decisions recorded. Consider a replay to generate a full report."],
      development: [],
    };
  }

  // --- KPI movement across the session ---
  const firstKpis = h[0].kpisAfter;
  const lastKpis = h[rounds - 1].kpisAfter;
  for (const k of KPI_KEYS) {
    const inverted = !!LOWER_IS_BETTER[k];
    const before = firstKpis[k];
    const after = lastKpis[k];
    const improved = inverted ? after < before - 3 : after > before + 3;
    const worsened = inverted ? after > before + 3 : after < before - 3;
    if (improved) {
      strengths.push(
        `${KPI_SHORT[k]} moved from ${before} to ${after} across the session, a genuine shift.`,
      );
    } else if (worsened) {
      development.push(
        `${KPI_SHORT[k]} drifted from ${before} to ${after} across the session. Worth unpacking what was traded for that.`,
      );
    }
  }

  // --- Hidden drivers end-state ---
  if (team.hidden.trust >= 70) {
    strengths.push(`Built high team trust (${team.hidden.trust}). Teams who trust lead with less friction.`);
  } else if (team.hidden.trust < 40) {
    development.push(`Team trust closed low (${team.hidden.trust}). Worth reflecting on small cumulative signals.`);
  }

  if (team.hidden.capability >= 70) {
    strengths.push(`Capability grew to ${team.hidden.capability}. Growth under pressure is the rarer outcome.`);
  } else if (team.hidden.capability < 40) {
    development.push(`Capability did not build (${team.hidden.capability}). Leading under pressure often defaults to doing rather than developing.`);
  }

  if (team.hidden.safety_risk >= 65) {
    development.push(`Safety risk closed at ${team.hidden.safety_risk}. Risk tolerance is a choice worth naming explicitly.`);
  } else if (team.hidden.safety_risk <= 30) {
    strengths.push(`Kept safety risk low (${team.hidden.safety_risk}) without sacrificing other outcomes.`);
  }

  if (team.hidden.leadership_consistency >= 70) {
    strengths.push(`Consistent leadership read (${team.hidden.leadership_consistency}). Predictability compounds.`);
  } else if (team.hidden.leadership_consistency < 40) {
    development.push(`Leadership consistency ended at ${team.hidden.leadership_consistency}. Mixed signals are usually invisible to the leader sending them.`);
  }

  // --- Decision patterns ---
  const priorities = h.map((r) => r.decision.priority);
  const priorityCounts = priorities.reduce<Record<string, number>>((acc, p) => {
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});
  const priorityEntries = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1]);
  if (priorityEntries[0] && priorityEntries[0][1] === rounds && rounds >= 3) {
    development.push(
      `Chose ${PRIORITY_LABELS[priorityEntries[0][0] as keyof typeof PRIORITY_LABELS]} in every shift. Worth asking whether that was conviction or default.`,
    );
  } else if (priorityEntries.length >= 3 && rounds >= 3) {
    strengths.push(`Varied priority across ${priorityEntries.length} focus areas, responding to what each shift threw up.`);
  }

  const leaderships = h.map((r) => r.decision.leadership);
  const directiveCount = leaderships.filter((s) => s === "directive").length;
  if (directiveCount === rounds && rounds >= 3) {
    development.push(`Used directive leadership every shift. Under pressure that can become the only tool available.`);
  } else if (new Set(leaderships).size >= 3) {
    strengths.push(`Drew on ${new Set(leaderships).size} different leadership styles across the session.`);
  }

  const escalations = h.filter((r) => r.decision.action === "escalate").length;
  if (escalations >= Math.ceil(rounds / 2) && rounds >= 3) {
    development.push(`Escalated in ${escalations} of ${rounds} shifts. Frequent escalation can protect judgement or outsource it.`);
  }

  const confidences = h.map((r) => r.decision.confidence);
  const confidentRounds = confidences.filter((c) => c === "confident").length;
  const cautiousRounds = confidences.filter((c) => c === "cautious").length;
  if (confidentRounds === rounds && rounds >= 3) {
    development.push(`Played confident every shift. That amplifies outcomes in both directions.`);
  } else if (cautiousRounds === rounds && rounds >= 3) {
    development.push(`Played cautious every shift. Protects downside, but caps upside too.`);
  }

  const momentResponses = h.filter((r) => r.decision.momentResponseId).length;
  const momentSkips = rounds - momentResponses;
  if (momentSkips >= 2) {
    development.push(`Did not respond to ${momentSkips} people moments. Silence is itself a signal to a direct report.`);
  }

  const primaryPicks = h.filter((r) => r.decision.primaryIssueId).length;
  if (primaryPicks === rounds && rounds >= 3) {
    strengths.push(`Named a primary issue in every shift. Focus pays back when the room is noisy.`);
  } else if (primaryPicks === 0 && rounds >= 3) {
    development.push(`Did not name a primary issue in any shift. Spreading attention evenly is often a form of avoidance.`);
  }

  // --- Allocation tells ---
  const allocs = h.map((r) => r.decision.allocation);
  if (allocs.length >= 2) {
    const avgResolution = allocs.reduce((a, b) => a + b.problem_resolution, 0) / allocs.length;
    if (avgResolution < 15) {
      development.push(`Problem resolution was consistently under-resourced (${Math.round(avgResolution)}% average).`);
    }
  }

  if (strengths.length === 0) {
    strengths.push("No standout patterns this session. The raw shift-by-shift log below tells the fuller story.");
  }
  if (development.length === 0) {
    development.push("No pronounced development gaps. Reinforcement of what already worked is the opportunity here.");
  }

  return {
    strengths: strengths.slice(0, 5),
    development: development.slice(0, 5),
  };
}

function kpiRow(
  label: string,
  baseline: number,
  start: number,
  final: number,
  inverted: boolean,
): string {
  const dir = deltaDirection(start, final, inverted);
  const dirClass = dir === "up" ? "up" : dir === "down" ? "down" : "flat";
  const dirLabel = dir === "up" ? "Improved" : dir === "down" ? "Declined" : "Held";
  return `
    <tr>
      <td class="label">${escapeHtml(label)}</td>
      <td class="num">${baseline}</td>
      <td class="num">${start}</td>
      <td class="num">${final}</td>
      <td class="delta ${dirClass}">${dirLabel} (${signed(final - start)})</td>
    </tr>
  `.trim();
}

function teamKpiTable(team: TeamFull, baseline: TrendSeries): string {
  if (team.history.length === 0) return "<p>No shifts played.</p>";
  const start = team.history[0].kpisAfter;
  const rows = KPI_KEYS.map((k) =>
    kpiRow(
      KPI_SHORT[k],
      baseline[k][0] ?? 0,
      start[k],
      team.kpis[k],
      !!LOWER_IS_BETTER[k],
    ),
  ).join("\n");
  return `
    <table class="kpi">
      <thead>
        <tr><th>Indicator</th><th>Baseline (16w ago)</th><th>Session start</th><th>Session end</th><th>Movement</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

function teamHiddenTable(team: TeamFull, baseline: TrendSeries): string {
  if (team.history.length === 0) return "";
  const start = team.history[0].hiddenAfter;
  const rows = HIDDEN_KEYS.map((k) => {
    const inverted = !!LOWER_IS_BETTER[k];
    const dir = deltaDirection(start[k], team.hidden[k], inverted);
    const dirClass = dir === "up" ? "up" : dir === "down" ? "down" : "flat";
    const dirLabel = dir === "up" ? "Improved" : dir === "down" ? "Declined" : "Held";
    return `
      <tr>
        <td class="label">${escapeHtml(HIDDEN_LABELS[k])}</td>
        <td class="num">${baseline[k][0] ?? 0}</td>
        <td class="num">${start[k]}</td>
        <td class="num">${team.hidden[k]}</td>
        <td class="delta ${dirClass}">${dirLabel} (${signed(team.hidden[k] - start[k])})</td>
      </tr>
    `.trim();
  }).join("\n");
  return `
    <table class="kpi">
      <thead>
        <tr><th>Hidden driver</th><th>Baseline</th><th>Start</th><th>End</th><th>Movement</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

function shiftLogTable(team: TeamFull): string {
  if (team.history.length === 0) return "";
  const rows = team.history
    .map((h) => {
      const d = h.decision;
      return `
        <tr>
          <td class="num">${h.round}</td>
          <td>${escapeHtml(PRIORITY_LABELS[d.priority])}</td>
          <td>${escapeHtml(LEADERSHIP_LABELS[d.leadership])}</td>
          <td>${escapeHtml(ACTION_LABELS[d.action])}</td>
          <td>${escapeHtml(CONFIDENCE_LABELS[d.confidence])}</td>
          <td class="num">${signed(h.roundScore)}</td>
        </tr>
      `.trim();
    })
    .join("\n");
  return `
    <table class="log">
      <thead>
        <tr><th>Shift</th><th>Priority</th><th>Leadership</th><th>Action</th><th>Confidence</th><th>Score</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

function teamSection(team: TeamFull, rank: number, baseline: TrendSeries): string {
  const { strengths, development } = analyseTeam(team);
  const strengthsList = strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  const developmentList = development.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  return `
    <section class="team">
      <header class="team-header">
        <div class="rank">#${rank}</div>
        <div class="crest">${crestSvg(team.name, 48)}</div>
        <div>
          <h2>${escapeHtml(team.name)}</h2>
          <p class="sub">Final score <strong class="num">${signed(team.score)}</strong> over ${team.history.length} shift${team.history.length === 1 ? "" : "s"}.</p>
        </div>
      </header>

      <div class="cols">
        <div class="col">
          <h3>Strengths</h3>
          <ul class="bullets">${strengthsList}</ul>
        </div>
        <div class="col">
          <h3>Development focus</h3>
          <ul class="bullets">${developmentList}</ul>
        </div>
      </div>

      <h3>KPI trajectory</h3>
      ${teamKpiTable(team, baseline)}

      <h3>Hidden drivers</h3>
      ${teamHiddenTable(team, baseline)}

      <h3>Shift by shift</h3>
      ${shiftLogTable(team)}
    </section>
  `.trim();
}

export function generateReport(session: Session): string {
  const teams = Array.from(session.teams.values());
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const generatedAt = Date.now();
  const shiftsPlayed = teams[0]?.history.length ?? 0;

  const leaderboardRows = ranked
    .map(
      (t, i) => `
        <tr>
          <td class="num">${i + 1}</td>
          <td><div class="team-cell"><span class="crest-small">${crestSvg(t.name, 22)}</span>${escapeHtml(t.name)}</div></td>
          <td class="num">${signed(t.score)}</td>
        </tr>
      `.trim(),
    )
    .join("\n");

  const teamSections = ranked.map((t, i) => teamSection(t, i + 1, session.baselineTrend)).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Retail Leadership Simulation - Session ${escapeHtml(session.code)}</title>
<style>
  :root {
    --brand: #ee6a00;
    --ink-900: #17181a;
    --ink-700: #3a3c40;
    --ink-500: #6b6f75;
    --ink-300: #c7c9cd;
    --ink-100: #eef0f3;
    --ink-50: #f7f8fa;
    --ok: #0f9d58;
    --risk: #b8324a;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink-900);
    background: #fff;
    font-size: 13px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 32px 40px 80px;
  }
  header.top {
    border-bottom: 2px solid var(--ink-900);
    padding-bottom: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
  }
  header.top .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--ink-700);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  header.top .brand .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    background: var(--brand);
    border-radius: 3px;
  }
  header.top h1 {
    margin: 6px 0 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  header.top .meta {
    text-align: right;
    color: var(--ink-500);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
  }
  header.top .meta .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 18px;
    font-weight: 600;
    color: var(--ink-900);
    letter-spacing: 0.08em;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .summary .stat {
    background: var(--ink-50);
    border: 1px solid var(--ink-100);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .summary .stat .label {
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--ink-500);
    font-weight: 500;
    margin-bottom: 4px;
  }
  .summary .stat .value {
    font-size: 22px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    margin: 0 0 4px;
  }
  h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-500);
    margin: 20px 0 8px;
  }
  p { margin: 0 0 8px; }
  .num { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 4px;
  }
  table.kpi th, table.kpi td,
  table.log th, table.log td,
  table.leaderboard th, table.leaderboard td {
    padding: 8px 10px;
    border-bottom: 1px solid var(--ink-100);
    text-align: left;
    vertical-align: middle;
  }
  table th {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-500);
    font-weight: 500;
    border-bottom: 1px solid var(--ink-300);
  }
  table .num { text-align: right; }
  table th.num { text-align: right; }
  table td.delta { font-weight: 500; }
  table td.delta.up { color: var(--ok); }
  table td.delta.down { color: var(--risk); }
  table td.delta.flat { color: var(--ink-500); }
  table.leaderboard { margin-bottom: 24px; max-width: 480px; }
  section.team {
    margin-top: 32px;
    padding-top: 28px;
    border-top: 1px solid var(--ink-100);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  section.team:first-of-type {
    border-top: none;
    padding-top: 0;
  }
  section.team .team-header {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 4px;
  }
  section.team .team-header .rank {
    font-size: 22px;
    font-weight: 600;
    color: var(--brand);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    min-width: 40px;
  }
  section.team .team-header .crest { line-height: 0; }
  .team-cell { display: inline-flex; align-items: center; gap: 8px; }
  .crest-small { line-height: 0; display: inline-flex; }
  section.team .sub { color: var(--ink-500); font-size: 12px; }
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 12px;
  }
  ul.bullets {
    padding-left: 18px;
    margin: 0;
  }
  ul.bullets li {
    margin-bottom: 6px;
    color: var(--ink-700);
  }
  footer.bottom {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid var(--ink-100);
    font-size: 11px;
    color: var(--ink-500);
    display: flex;
    justify-content: space-between;
  }
  .print-hint {
    margin: 24px 0 0;
    padding: 12px 16px;
    background: var(--ink-50);
    border: 1px solid var(--ink-100);
    border-radius: 10px;
    font-size: 12px;
    color: var(--ink-700);
  }
  @media print {
    .page { max-width: none; padding: 20px 24px 40px; }
    .print-hint { display: none; }
    section.team { page-break-inside: avoid; }
    header.top { page-break-after: avoid; }
  }
</style>
</head>
<body>
  <div class="page">
    <header class="top">
      <div>
        <div class="brand"><span class="dot"></span>Retail Leadership Simulation</div>
        <h1>Session report</h1>
      </div>
      <div class="meta">
        <div class="code">${escapeHtml(session.code)}</div>
        <div>${escapeHtml(formatDate(generatedAt))}</div>
      </div>
    </header>

    <div class="summary">
      <div class="stat"><div class="label">Teams</div><div class="value num">${teams.length}</div></div>
      <div class="stat"><div class="label">Shifts played</div><div class="value num">${shiftsPlayed}</div></div>
      <div class="stat"><div class="label">Session started</div><div class="value" style="font-size:13px;">${escapeHtml(formatDate(session.createdAt))}</div></div>
    </div>

    <h3>Final standings</h3>
    <table class="leaderboard">
      <thead>
        <tr><th>Rank</th><th>Team</th><th class="num">Score</th></tr>
      </thead>
      <tbody>${leaderboardRows}</tbody>
    </table>

    <div class="print-hint">
      To save as PDF, use your browser's print dialog and choose "Save as PDF" as the destination.
    </div>

    ${teamSections}

    <footer class="bottom">
      <div>Session ${escapeHtml(session.code)}</div>
      <div>Generated ${escapeHtml(formatDate(generatedAt))}</div>
    </footer>
  </div>
</body>
</html>`;
}
