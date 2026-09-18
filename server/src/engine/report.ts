import type { HiddenDrivers, MetricKey, TeamFull, TrendSeries } from "@sim/shared";
import {
  ACTION_LABELS,
  CONFIDENCE_LABELS,
  HIDDEN_LABELS,
  METRIC_KEYS,
  METRIC_SHORT,
  LEADERSHIP_LABELS,
  PRIORITY_LABELS,
  crestFor,
  type CrestAccent,
  type CrestIcon,
  type CrestShape,
} from "@sim/shared";
import type { Session } from "./session.js";

type HiddenKey = keyof HiddenDrivers;

const HIDDEN_KEYS: HiddenKey[] = ["trust", "capability", "safety_risk", "leadership_consistency"];

// All ten metrics are higher-is-better; only safety_risk (a hidden driver) inverts.
const LOWER_IS_BETTER: Record<string, boolean> = {
  safety_risk: true,
};

function crestSvg(teamName: string, size = 44): string {
  const c = crestFor(teamName);
  const stroke = "#1a1420";
  const fill = "#ffffff";
  const accent = "#b31cc4"; // Plumfield plum (was Sainsbury's orange)
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

// A small inline arrow so status is never colour-alone (a colour-blind reader
// gets the shape too). up = improved, down = declined, flat = held.
function arrowSvg(dir: "up" | "down" | "flat"): string {
  const a = `class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  if (dir === "up") return `<svg ${a}><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
  if (dir === "down") return `<svg ${a}><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
  return `<svg ${a}><path d="M5 12h14"/></svg>`;
}

// The movement cell: arrow + word + signed delta. Words carry the meaning; the
// arrow and colour reinforce it.
function movementCell(before: number, after: number, inverted: boolean): string {
  const dir = deltaDirection(before, after, inverted);
  const label = dir === "up" ? "Improved" : dir === "down" ? "Declined" : "Held";
  return `<span class="delta ${dir}">${arrowSvg(dir)}<span class="delta-word">${label}</span> <span class="num delta-num">(${signed(after - before)})</span></span>`;
}

// A thin 0-100 value bar for the end-state figure. tone maps to an accent var.
function valueBar(value: number, tone: "read" | "data" | "plum" | "risk"): string {
  const pct = Math.max(2, Math.min(100, Math.round(value)));
  return `<span class="vbar"><span class="vbar-fill tone-${tone}" style="width:${pct}%"></span></span>`;
}

// Per-team cumulative score sparkline, pure inline SVG (CSP allows no scripts).
function sparkSvg(values: number[]): string {
  if (values.length < 2) return "";
  const w = 128;
  const h = 34;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rng = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (values.length - 1);
    const y = h - pad - ((v - min) / rng) * (h - 2 * pad);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><path d="${d}" stroke="var(--plum)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.6" fill="var(--plum)"/></svg>`;
}

// Icons for the two coaching columns (strengths / development).
const CHECK_ICON = `<svg class="cico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;
const AIM_ICON = `<svg class="cico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;

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

  // --- Metric movement across the session ---
  const firstMetrics = h[0].metricsAfter;
  const lastMetrics = h[rounds - 1].metricsAfter;
  for (const k of METRIC_KEYS) {
    const inverted = !!LOWER_IS_BETTER[k];
    const before = firstMetrics[k];
    const after = lastMetrics[k];
    const improved = inverted ? after < before - 3 : after > before + 3;
    const worsened = inverted ? after > before + 3 : after < before - 3;
    if (improved) {
      strengths.push(
        `${METRIC_SHORT[k]} moved from ${before} to ${after} across the session, a genuine shift.`,
      );
    } else if (worsened) {
      development.push(
        `${METRIC_SHORT[k]} drifted from ${before} to ${after} across the session. Worth unpacking what was traded for that.`,
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

  const topEffortShare = (effort?: Record<string, number>): number => {
    if (!effort) return 0;
    const vals = Object.values(effort).filter((v) => Number.isFinite(v));
    return vals.length ? Math.max(0, ...vals) : 0;
  };
  const concentratedShifts = h.filter((r) => topEffortShare(r.decision.issueEffort) >= 50).length;
  if (concentratedShifts === rounds && rounds >= 3) {
    strengths.push(`Concentrated effort on a lead issue in every shift. Focus pays back when the room is noisy.`);
  } else if (concentratedShifts === 0 && rounds >= 3) {
    development.push(`Never concentrated effort on a lead issue. Spreading attention evenly is often a form of avoidance.`);
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
  tone: "data" | "plum" | "risk",
  hint?: string,
): string {
  return `
    <tr>
      <td class="label">${escapeHtml(label)}${hint ? `<span class="hint">${escapeHtml(hint)}</span>` : ""}</td>
      <td class="num">${baseline}</td>
      <td class="num">${start}</td>
      <td class="num end">${final}${valueBar(final, tone)}</td>
      <td class="movement">${movementCell(start, final, inverted)}</td>
    </tr>
  `.trim();
}

function teamKpiTable(team: TeamFull, baseline: TrendSeries): string {
  if (team.history.length === 0) return "<p>No shifts played.</p>";
  const start = team.history[0].metricsAfter;
  const rows = METRIC_KEYS.map((k: MetricKey) =>
    kpiRow(
      METRIC_SHORT[k],
      baseline[k][0] ?? 0,
      start[k],
      team.metrics[k],
      !!LOWER_IS_BETTER[k],
      "data",
    ),
  ).join("\n");
  return `
    <table class="kpi read">
      <thead>
        <tr><th>Indicator</th><th class="num">Baseline (16w ago)</th><th class="num">Session start</th><th class="num">Session end</th><th>Movement</th></tr>
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
    return kpiRow(
      HIDDEN_LABELS[k],
      baseline[k][0] ?? 0,
      start[k],
      team.hidden[k],
      inverted,
      inverted ? "risk" : "plum",
      inverted ? "Lower is better" : undefined,
    );
  }).join("\n");
  return `
    <table class="kpi hidden">
      <thead>
        <tr><th>Hidden driver</th><th class="num">Baseline</th><th class="num">Start</th><th class="num">End</th><th>Movement</th></tr>
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
    <table class="log read">
      <thead>
        <tr><th class="num">Shift</th><th>Priority</th><th>Leadership</th><th>Action</th><th>Confidence</th><th class="num">Score</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `.trim();
}

function teamSection(team: TeamFull, rank: number, baseline: TrendSeries): string {
  const { strengths, development } = analyseTeam(team);
  const strengthsList = strengths
    .map((s) => `<li>${CHECK_ICON}<span>${escapeHtml(s)}</span></li>`)
    .join("");
  const developmentList = development
    .map((s) => `<li>${AIM_ICON}<span>${escapeHtml(s)}</span></li>`)
    .join("");

  // Cumulative score trajectory for the header sparkline.
  let running = 0;
  const trail = team.history.map((h) => (running += h.roundScore));
  const spark = sparkSvg(trail);

  return `
    <section class="team">
      <header class="team-header">
        <div class="rank">#${rank}</div>
        <div class="crest">${crestSvg(team.name, 48)}</div>
        <div class="team-id">
          <h2>${escapeHtml(team.name)}</h2>
          <p class="sub">Final score <strong class="num">${signed(team.score)}</strong> over ${team.history.length} shift${team.history.length === 1 ? "" : "s"}.</p>
        </div>
        ${spark ? `<div class="team-spark">${spark}<span class="spark-cap">Score trajectory</span></div>` : ""}
      </header>

      <div class="cols">
        <div class="col coach-did">
          <h3>Strengths</h3>
          <ul class="bullets">${strengthsList}</ul>
        </div>
        <div class="col coach-dev">
          <h3>Development focus</h3>
          <ul class="bullets">${developmentList}</ul>
        </div>
      </div>

      <h3 class="read-label">Metric trajectory</h3>
      ${teamKpiTable(team, baseline)}

      <h3 class="read-label">Hidden drivers</h3>
      ${teamHiddenTable(team, baseline)}

      <h3 class="read-label">Shift by shift</h3>
      ${shiftLogTable(team)}
    </section>
  `.trim();
}

export function generateReport(session: Session): string {
  const teams = Array.from(session.teams.values());
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const generatedAt = Date.now();
  const shiftsPlayed = teams[0]?.history.length ?? 0;
  const topTeam = ranked[0]?.name ?? "-";

  const leaderboardRows = ranked
    .map(
      (t, i) => `
        <tr class="${i === 0 ? "lead" : ""}">
          <td class="num rank-cell">${i + 1}</td>
          <td><div class="team-cell"><span class="crest-small">${crestSvg(t.name, 22)}</span>${escapeHtml(t.name)}</div></td>
          <td class="num score-cell">${signed(t.score)}</td>
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
<title>Plumfield Stores - Session report - ${escapeHtml(session.code)}</title>
<style>
  :root {
    /* Plumfield palette on a white/print ground. Magenta = ACT, cyan = READ,
       lime = data-fill. No orange, no Sainsbury's cue. */
    --plum: #b31cc4;
    --plum-600: #9a17aa;
    --plum-soft: #faeffc;
    --plum-line: #ecd2f1;
    --cyan: #0e7490;
    --cyan-soft: #eef6f9;
    --cyan-line: #cfe5eb;
    --lime: #7e9c14;
    --ok: #0f9d58;
    --ok-soft: #e9f6ef;
    --risk: #e11d48;
    --risk-soft: #fdeaef;
    --ink-900: #1a1420;
    --ink-700: #40384a;
    --ink-500: #6d6578;
    --ink-300: #c9c4d1;
    --ink-100: #ece9f1;
    --ink-50: #f8f6fb;
    --line: #e7e3ee;
    --r-card: 16px;
    --r-tile: 12px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--ink-900);
    background: #fff;
    font-size: 13.5px;
    line-height: 1.5;
    letter-spacing: -0.005em;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    max-width: 920px;
    margin: 0 auto;
    padding: 34px 42px 80px;
  }
  header.top {
    border-bottom: 1px solid var(--line);
    padding-bottom: 18px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 24px;
  }
  header.top .brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }
  header.top .brand .mark {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--plum);
    color: #fff;
    display: grid;
    place-items: center;
    flex: none;
  }
  header.top .brand .mark svg { width: 18px; height: 18px; }
  header.top .brand .name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
  header.top .brand .sub { font-size: 12px; color: var(--ink-500); }
  header.top h1 {
    margin: 12px 0 0;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -0.025em;
  }
  header.top .meta {
    text-align: right;
    color: var(--ink-500);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
  }
  header.top .meta .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 17px;
    font-weight: 600;
    color: var(--ink-900);
    letter-spacing: 0.08em;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 26px;
  }
  .summary .stat {
    background: var(--cyan-soft);
    border: 1px solid var(--cyan-line);
    border-radius: var(--r-tile);
    padding: 14px 16px;
  }
  .summary .stat .label {
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.06em;
    color: var(--cyan);
    font-weight: 600;
    margin-bottom: 5px;
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
    letter-spacing: -0.02em;
    margin: 0 0 3px;
  }
  h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-500);
    margin: 20px 0 8px;
  }
  h3.read-label { color: var(--cyan); }
  p { margin: 0 0 8px; }
  .num { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    margin-bottom: 4px;
  }
  table.kpi th, table.kpi td,
  table.log th, table.log td,
  table.leaderboard th, table.leaderboard td {
    padding: 9px 11px;
    border-bottom: 1px solid var(--ink-100);
    text-align: left;
    vertical-align: middle;
  }
  table th {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ink-500);
    font-weight: 600;
    border-bottom: 1px solid var(--ink-300);
  }
  table.read th { color: var(--cyan); border-bottom-color: var(--cyan-line); }
  table .num { text-align: right; }
  table th.num { text-align: right; }
  td.label { font-weight: 500; }
  td.label .hint {
    display: block;
    font-size: 12px;
    font-weight: 400;
    color: var(--ink-500);
    text-transform: none;
    letter-spacing: 0;
    margin-top: 1px;
  }
  td.end { text-align: right; white-space: nowrap; }
  .vbar {
    display: block;
    height: 5px;
    width: 78px;
    max-width: 100%;
    margin-left: auto;
    margin-top: 5px;
    border-radius: 999px;
    background: var(--ink-100);
    overflow: hidden;
  }
  .vbar-fill { display: block; height: 100%; border-radius: 999px; }
  .tone-data { background: var(--lime); }
  .tone-plum { background: var(--plum); }
  .tone-risk { background: var(--risk); }
  .tone-read { background: var(--cyan); }
  td.movement { white-space: nowrap; }
  .delta { display: inline-flex; align-items: center; gap: 3px; font-weight: 600; }
  .delta .arrow { width: 13px; height: 13px; }
  .delta.up { color: var(--ok); }
  .delta.down { color: var(--risk); }
  .delta.flat { color: var(--ink-500); }
  .delta .delta-num { font-weight: 500; color: var(--ink-500); }
  table.leaderboard { margin-bottom: 8px; max-width: 520px; }
  table.leaderboard tr.lead td { background: var(--plum-soft); }
  table.leaderboard .rank-cell { color: var(--ink-500); font-weight: 600; width: 48px; }
  table.leaderboard tr.lead .rank-cell { color: var(--plum-600); }
  table.leaderboard .score-cell { font-weight: 600; }
  section.team {
    margin-top: 30px;
    padding-top: 26px;
    border-top: 1px solid var(--line);
    page-break-inside: avoid;
    break-inside: avoid;
  }
  section.team:first-of-type { border-top: none; padding-top: 4px; }
  section.team .team-header {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 16px;
    align-items: center;
    margin-bottom: 6px;
  }
  section.team .team-header .rank {
    font-size: 22px;
    font-weight: 600;
    color: var(--plum-600);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    min-width: 36px;
  }
  section.team .team-header .crest { line-height: 0; }
  section.team .team-id h2 { margin: 0; }
  .team-cell { display: inline-flex; align-items: center; gap: 8px; }
  .crest-small { line-height: 0; display: inline-flex; }
  section.team .sub { color: var(--ink-500); font-size: 12.5px; margin: 2px 0 0; }
  .team-spark { text-align: right; }
  .team-spark .spark { display: block; margin-left: auto; }
  .team-spark .spark-cap {
    display: block;
    font-size: 12px;
    color: var(--ink-500);
    margin-top: 2px;
  }
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 14px;
  }
  .col { border-radius: var(--r-tile); padding: 14px 16px; }
  .col h3 { margin-top: 0; }
  .coach-did { background: var(--ok-soft); }
  .coach-did h3 { color: var(--ok); }
  .coach-dev { background: var(--plum-soft); }
  .coach-dev h3 { color: var(--plum-600); }
  ul.bullets {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 9px;
  }
  ul.bullets li {
    display: grid;
    grid-template-columns: 17px 1fr;
    gap: 9px;
    align-items: start;
    font-size: 13px;
    line-height: 1.45;
    color: var(--ink-700);
  }
  ul.bullets .cico { width: 15px; height: 15px; margin-top: 2px; }
  .coach-did .cico { color: var(--ok); }
  .coach-dev .cico { color: var(--plum-600); }
  footer.bottom {
    margin-top: 44px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    font-size: 12px;
    color: var(--ink-500);
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  .print-hint {
    margin: 18px 0 0;
    padding: 12px 16px;
    background: var(--plum-soft);
    border: 1px solid var(--plum-line);
    border-radius: var(--r-tile);
    font-size: 12.5px;
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
        <div class="brand">
          <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg></span>
          <span>
            <span class="name">Plumfield Stores</span><br>
            <span class="sub">Leadership simulation</span>
          </span>
        </div>
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
      <div class="stat"><div class="label">Top team</div><div class="value">${escapeHtml(topTeam)}</div></div>
    </div>

    <h3 class="read-label">Final standings</h3>
    <table class="leaderboard read">
      <thead>
        <tr><th class="num">Rank</th><th>Team</th><th class="num">Score</th></tr>
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
