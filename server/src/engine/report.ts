import type { HiddenDrivers, MetricKey, ResourceAllocation, TeamFull, TrendSeries } from "@sim/shared";
import {
  ACTION_LABELS,
  CONFIDENCE_LABELS,
  HIDDEN_LABELS,
  METRIC_KEYS,
  METRIC_LABELS,
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

// All ten performance indicators are higher-is-better; only safety_risk (a hidden
// driver) inverts.
const LOWER_IS_BETTER: Record<string, boolean> = {
  safety_risk: true,
};

const ALLOCATION_LABELS: { key: keyof ResourceAllocation; label: string }[] = [
  { key: "shop_floor", label: "Shop floor" },
  { key: "backroom", label: "Backroom" },
  { key: "customer_service", label: "Customer service" },
  { key: "problem_resolution", label: "Problem resolution" },
];

// ---------------------------------------------------------------------------
// Crest art (unchanged)
// ---------------------------------------------------------------------------
function crestSvg(teamName: string, size = 44): string {
  const c = crestFor(teamName);
  const stroke = "#1a1420";
  const fill = "#ffffff";
  const accent = "#b31cc4";
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">${shape(c.shape, stroke, fill)}${accentShape(c.accent, c.shape, accent)}${iconShape(c.icon, stroke)}</svg>`;
}
function shape(s: CrestShape, stroke: string, fill: string): string {
  const attrs = `fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"`;
  switch (s) {
    case "shield": return `<path d="M32 6 L54 14 V32 C54 46 44 54 32 58 C20 54 10 46 10 32 V14 Z" ${attrs}/>`;
    case "hexagon": return `<path d="M32 4 L56 18 V46 L32 60 L8 46 V18 Z" ${attrs}/>`;
    case "circle": return `<circle cx="32" cy="32" r="26" ${attrs}/>`;
    case "square": return `<rect x="8" y="8" width="48" height="48" rx="12" ${attrs}/>`;
    case "diamond": return `<path d="M32 4 L60 32 L32 60 L4 32 Z" ${attrs}/>`;
  }
}
function accentShape(a: CrestAccent, s: CrestShape, color: string): string {
  switch (a) {
    case "dot": return `<circle cx="${s === "diamond" ? 50 : 48}" cy="${s === "diamond" ? 20 : 16}" r="3" fill="${color}"/>`;
    case "stripe": return `<path d="M10 20 L54 20" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case "ring": return `<circle cx="32" cy="32" r="23" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="2 4"/>`;
    case "corner": return `<path d="M44 8 L56 8 L56 20" stroke="${color}" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    case "underline": return `<path d="M18 48 L46 48" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    case "bar": return `<rect x="30.5" y="14" width="3" height="8" rx="1" fill="${color}"/>`;
  }
}
function iconShape(i: CrestIcon, stroke: string): string {
  const a = `stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  switch (i) {
    case "storefront": return `<g ${a} transform="translate(20 22)"><path d="M1 5 L4 1 H20 L23 5"/><path d="M3 5 V21 H21 V5"/><path d="M1 5 H23"/><path d="M10 21 V14 H14 V21"/></g>`;
    case "trolley": return `<g ${a} transform="translate(18 26)"><path d="M2 2 H6 L8 6"/><path d="M8 6 H26 L23 15 H10 Z"/><circle cx="12" cy="19" r="2"/><circle cx="22" cy="19" r="2"/></g>`;
    case "basket": return `<g ${a} transform="translate(18 22)"><path d="M8 6 C8 2 12 0 14 0 C16 0 20 2 20 6"/><path d="M2 6 H26 L23 20 H5 Z"/><path d="M10 6 L11 20"/><path d="M18 6 L17 20"/></g>`;
    case "tag": return `<g ${a} transform="translate(18 18)"><path d="M2 14 L14 2 L28 2 L28 16 L16 28 Z"/><circle cx="22" cy="8" r="2"/></g>`;
    case "scales": return `<g ${a} transform="translate(18 22)"><path d="M14 2 V22"/><path d="M8 22 H20"/><path d="M3 8 H25"/><path d="M7 8 L4 14"/><path d="M7 8 L10 14"/><path d="M21 8 L18 14"/><path d="M21 8 L24 14"/><path d="M3 14 H11"/><path d="M17 14 H25"/></g>`;
    case "key": return `<g ${a} transform="translate(18 22)"><circle cx="8" cy="12" r="6"/><circle cx="8" cy="12" r="2" fill="${stroke}"/><path d="M14 12 H28"/><path d="M22 12 V16"/><path d="M26 12 V15"/></g>`;
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function escapeHtml(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function dateShort(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}
// Performance measures: one decimal place, trailing zeros stripped (72, 72.5).
function fmt1(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 10) / 10);
}
function signed1(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r > 0 ? `+${r}` : `${r}`;
}
// Scores: whole numbers.
function scoreInt(n: number): string { return String(Math.round(n)); }
function signedScore(n: number): string { const r = Math.round(n); return r > 0 ? `+${r}` : `${r}`; }

function weekZero(baseline: TrendSeries, k: string): number {
  const arr = baseline[k as keyof TrendSeries] as number[] | undefined;
  if (!arr || arr.length === 0) return 0;
  return arr[arr.length - 1];
}
function baseline16(baseline: TrendSeries, k: string): number {
  const arr = baseline[k as keyof TrendSeries] as number[] | undefined;
  return arr && arr.length ? arr[0] : 0;
}

function deltaDirection(before: number, after: number, inverted: boolean): "up" | "down" | "flat" {
  const delta = after - before;
  if (Math.abs(delta) < 1) return "flat";
  return (inverted ? delta < 0 : delta > 0) ? "up" : "down";
}
function arrowSvg(dir: "up" | "down" | "flat"): string {
  const a = `class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  if (dir === "up") return `<svg ${a}><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
  if (dir === "down") return `<svg ${a}><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
  return `<svg ${a}><path d="M5 12h14"/></svg>`;
}
function movementCell(before: number, after: number, inverted: boolean): string {
  const dir = deltaDirection(before, after, inverted);
  const label = dir === "up" ? "Improved" : dir === "down" ? "Declined" : "Held";
  return `<span class="delta ${dir}">${arrowSvg(dir)}<span class="delta-word">${label}</span> <span class="num delta-num">(${signed1(after - before)})</span></span>`;
}
function valueBar(value: number, tone: "read" | "data" | "plum" | "risk"): string {
  const pct = Math.max(2, Math.min(100, Math.round(value)));
  return `<span class="vbar"><span class="vbar-fill tone-${tone}" style="width:${pct}%"></span></span>`;
}
function sparkSvg(values: number[]): string {
  if (values.length < 2) return "";
  const w = 128, h = 34, pad = 3;
  const min = Math.min(...values), max = Math.max(...values), rng = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (values.length - 1);
    const y = h - pad - ((v - min) / rng) * (h - 2 * pad);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><path d="${d}" stroke="var(--plum)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.6" fill="var(--plum)"/></svg>`;
}

const CHECK_ICON = `<svg class="cico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>`;
const AIM_ICON = `<svg class="cico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>`;
const SEED_ICON = `<svg class="cico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c0-6 2-10 8-12-6-2-8 1-8 4-0-3-2-6-8-4 6 2 8 6 8 12Z"/></svg>`;

// ---------------------------------------------------------------------------
// Per-team analysis: improvements / areas needing attention / sustainability
// ---------------------------------------------------------------------------
function sizeWord(delta: number): string {
  const d = Math.abs(delta);
  return d >= 15 ? "big" : d >= 8 ? "clear" : "modest";
}
function gainLine(label: string, before: number, after: number, seq: number): string {
  const size = sizeWord(after - before);
  const b = fmt1(before), a = fmt1(after);
  return [
    `${label} improved from ${b} to ${a}, a ${size} gain.`,
    `A ${size} lift on ${label} (${b} to ${a}).`,
    `${label} ended at ${a}, up from ${b}.`,
  ][seq % 3];
}
function dropLine(label: string, before: number, after: number, seq: number): string {
  const size = sizeWord(after - before);
  const b = fmt1(before), a = fmt1(after);
  return [
    `${label} declined from ${b} to ${a}. Worth unpacking what was traded for it.`,
    `A ${size} drop on ${label} (${b} to ${a}).`,
    `${label} ended at ${a}, down from ${b}.`,
  ][seq % 3];
}

function analyseTeam(team: TeamFull, baseline: TrendSeries): { improvements: string[]; attention: string[]; sustainability: string[] } {
  const improvements: string[] = [];
  const attention: string[] = [];
  const sustainability: string[] = [];
  const h = team.history;
  const rounds = h.length;
  if (rounds === 0) {
    return { improvements: ["No decisions recorded. Consider a replay to generate a full report."], attention: [], sustainability: [] };
  }

  // Metric movement across the session, measured Week 0 start -> Week 8 end.
  const lastMetrics = h[rounds - 1].metricsAfter;
  let gainSeq = 0, dropSeq = 0;
  const movers: Array<{ label: string; before: number; after: number; mag: number }> = [];
  for (const k of METRIC_KEYS) {
    const before = weekZero(baseline, k);
    const after = lastMetrics[k];
    movers.push({ label: METRIC_LABELS[k], before, after, mag: after - before });
    if (after > before + 3) improvements.push(gainLine(METRIC_LABELS[k], before, after, gainSeq++));
    else if (after < before - 3) attention.push(dropLine(METRIC_LABELS[k], before, after, dropSeq++));
  }

  // Decision strengths / concerns feed improvements + attention.
  const priorities = h.map((r) => r.decision.priority);
  const prioritySet = new Set(priorities);
  if (prioritySet.size >= 3 && rounds >= 3) improvements.push(`Varied priority across ${prioritySet.size} focus areas, responding to what each week threw up.`);
  else if (prioritySet.size === 1 && rounds >= 3) attention.push(`Chose ${PRIORITY_LABELS[priorities[0]]} every week. Worth asking whether that was conviction or default.`);

  const leaderships = h.map((r) => r.decision.leadership);
  if (leaderships.every((s) => s === "directive") && rounds >= 3) attention.push(`Led directive every week. Under pressure that can become the only tool available.`);
  else if (new Set(leaderships).size >= 3) improvements.push(`Drew on ${new Set(leaderships).size} different leadership styles across the session.`);

  const confidences = h.map((r) => r.decision.confidence);
  if (confidences.every((c) => c === "confident") && rounds >= 3) attention.push(`Played confident every week, which amplifies outcomes in both directions.`);
  else if (confidences.every((c) => c === "cautious") && rounds >= 3) attention.push(`Played cautious every week: protects the downside, but caps the upside too.`);

  const momentSkips = rounds - h.filter((r) => r.decision.momentResponseId).length;
  if (momentSkips >= 2) attention.push(`Did not respond to ${momentSkips} people moments. Silence is itself a signal to a direct report.`);

  const allocs = h.map((r) => r.decision.allocation);
  const avgResolution = allocs.reduce((a, b) => a + b.problem_resolution, 0) / allocs.length;
  if (avgResolution < 15) attention.push(`Problem resolution was consistently under-resourced (${fmt1(avgResolution)}% average across the eight weeks).`);

  // Fallbacks that stay honest and figure-backed (never the old filler).
  if (improvements.length === 0) {
    const best = [...movers].sort((a, b) => b.mag - a.mag)[0];
    improvements.push(best && best.mag > 0 ? `Best movement was ${best.label}, up ${fmt1(best.mag)} to ${fmt1(best.after)}.` : `Most indicators held broadly steady - see the week-by-week record for the detail.`);
  }
  if (attention.length === 0) {
    const weakest = [...movers].sort((a, b) => a.after - b.after)[0];
    attention.push(weakest ? `No pronounced declines, but ${weakest.label} finished lowest at ${fmt1(weakest.after)} and is the one to keep an eye on.` : `No pronounced declines this session.`);
  }

  // Longer-term sustainability: the four hidden drivers, end-state vs Week 0, with figures.
  const hb = (k: HiddenKey) => weekZero(baseline, k);
  const t = team.hidden;
  sustainability.push(`Team trust ${t.trust >= 70 ? "is high" : t.trust < 40 ? "closed low" : "sits mid-range"} at ${fmt1(t.trust)} (from ${fmt1(hb("trust"))} at Week 0)${t.trust < 40 ? " - low trust tends to catch up with a leader over time." : t.trust >= 70 ? " - a strong base for sustained performance." : "."}`);
  sustainability.push(`Capability ${t.capability >= 70 ? "grew strongly" : t.capability < 40 ? "did not build" : "moved modestly"} to ${fmt1(t.capability)} (from ${fmt1(hb("capability"))})${t.capability < 40 ? " - leading under pressure often defaults to doing rather than developing." : "."}`);
  sustainability.push(`Safety risk ${t.safety_risk <= 30 ? "was held low" : t.safety_risk >= 65 ? "closed high" : "sits mid-range"} at ${fmt1(t.safety_risk)} (lower is better; ${fmt1(hb("safety_risk"))} at Week 0)${t.safety_risk >= 65 ? " - a sustainability concern worth naming explicitly." : "."}`);
  sustainability.push(`Leadership consistency ended at ${fmt1(t.leadership_consistency)} (from ${fmt1(hb("leadership_consistency"))})${t.leadership_consistency < 40 ? " - mixed signals are usually invisible to the leader sending them." : t.leadership_consistency >= 70 ? " - predictability compounds." : "."}`);

  return { improvements: improvements.slice(0, 5), attention: attention.slice(0, 5), sustainability };
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
function kpiRow(label: string, b16: number, w0: number, end: number, inverted: boolean, tone: "data" | "plum" | "risk", hint?: string): string {
  return `
    <tr>
      <td class="label">${escapeHtml(label)}${hint ? `<span class="hint">${escapeHtml(hint)}</span>` : ""}</td>
      <td class="num">${fmt1(b16)}</td>
      <td class="num">${fmt1(w0)}</td>
      <td class="num end">${fmt1(end)}${valueBar(end, tone)}</td>
      <td class="movement">${movementCell(w0, end, inverted)}</td>
    </tr>`.trim();
}
function teamKpiTable(team: TeamFull, baseline: TrendSeries): string {
  if (team.history.length === 0) return "<p>No weeks played.</p>";
  const rows = METRIC_KEYS.map((k: MetricKey) =>
    kpiRow(METRIC_LABELS[k], baseline16(baseline, k), weekZero(baseline, k), team.metrics[k], !!LOWER_IS_BETTER[k], "data"),
  ).join("\n");
  return `
    <table class="kpi read">
      <thead>
        <tr><th>Indicator</th><th class="num">Baseline (16w ago)</th><th class="num">Week 0 start</th><th class="num">Week 8 end</th><th>Movement (0 to 8)</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`.trim();
}
function teamHiddenTable(team: TeamFull, baseline: TrendSeries): string {
  if (team.history.length === 0) return "";
  const rows = HIDDEN_KEYS.map((k) => {
    const inverted = !!LOWER_IS_BETTER[k];
    return kpiRow(HIDDEN_LABELS[k], baseline16(baseline, k), weekZero(baseline, k), team.hidden[k], inverted, inverted ? "risk" : "plum", inverted ? "Lower is better" : undefined);
  }).join("\n");
  return `
    <table class="kpi hidden">
      <thead>
        <tr><th>Hidden driver</th><th class="num">Baseline</th><th class="num">Week 0 start</th><th class="num">Week 8 end</th><th>Movement (0 to 8)</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`.trim();
}
function weekChallenge(h: TeamFull["history"][number]): string {
  const parts: string[] = [];
  if (h.weekContext?.disruption) parts.push(`Disruption - ${h.weekContext.disruption}`);
  const issues = h.weekContext?.issues ?? [];
  if (issues.length) parts.push(issues.slice(0, 2).join("; "));
  if (h.momentPersonaName) parts.push(`People moment: ${h.momentPersonaName}`);
  return parts.length ? escapeHtml(parts.join(" · ")) : "<span class=\"muted\">-</span>";
}
function weeklyRecordTable(team: TeamFull): string {
  if (team.history.length === 0) return "";
  const rows = team.history.map((h) => {
    const d = h.decision;
    return `
      <tr>
        <td class="num wk">${h.round}</td>
        <td class="challenge">${weekChallenge(h)}</td>
        <td>${escapeHtml(PRIORITY_LABELS[d.priority])}</td>
        <td>${escapeHtml(LEADERSHIP_LABELS[d.leadership])}</td>
        <td>${escapeHtml(ACTION_LABELS[d.action])}</td>
        <td>${escapeHtml(CONFIDENCE_LABELS[d.confidence])}</td>
        <td class="num">${signedScore(h.roundScore)}</td>
      </tr>`.trim();
  }).join("\n");
  return `
    <table class="log read">
      <thead>
        <tr><th class="num">Week</th><th>What the week threw at them</th><th>Priority</th><th>Leadership</th><th>Action</th><th>Confidence</th><th class="num">Score</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`.trim();
}
function allocationTable(team: TeamFull): string {
  if (team.history.length === 0) return "";
  const rows = team.history.map((h) => {
    const a = h.decision.allocation;
    return `
      <tr>
        <td class="num wk">${h.round}</td>
        ${ALLOCATION_LABELS.map((al) => `<td class="num">${fmt1(a[al.key])}%</td>`).join("")}
      </tr>`.trim();
  }).join("\n");
  const avg = ALLOCATION_LABELS.map((al) => team.history.reduce((s, h) => s + h.decision.allocation[al.key], 0) / team.history.length);
  const avgRow = `
    <tr class="avg">
      <td class="wk">Avg</td>
      ${avg.map((v) => `<td class="num">${fmt1(v)}%</td>`).join("")}
    </tr>`.trim();
  return `
    <table class="alloc read">
      <thead>
        <tr><th class="num">Week</th>${ALLOCATION_LABELS.map((al) => `<th class="num">${al.label}</th>`).join("")}</tr>
      </thead>
      <tbody>${rows}${avgRow}</tbody>
    </table>
    <p class="caption">Share of the team's resource directed to each area, per week (%). The final row is the eight-week average.</p>`.trim();
}

function coachList(items: string[], icon: string): string {
  return items.map((s) => `<li>${icon}<span>${escapeHtml(s)}</span></li>`).join("");
}

function teamSection(team: TeamFull, rank: number, tNum: number, totalTeams: number, baseline: TrendSeries): string {
  const { improvements, attention, sustainability } = analyseTeam(team, baseline);
  let running = 0;
  const trail = team.history.map((h) => (running += h.roundScore));
  const spark = sparkSvg(trail);
  const weeks = team.history.length;
  return `
    <section class="team">
      <header class="team-header">
        <div class="rank">#${rank}</div>
        <div class="crest">${crestSvg(team.name, 48)}</div>
        <div class="team-id">
          <h2><span class="tbadge">T${tNum}</span>${escapeHtml(team.name)}</h2>
          <p class="sub">Final score <strong class="num">${scoreInt(team.score)}</strong> &middot; ranked ${rank} of ${totalTeams} &middot; ${weeks} week${weeks === 1 ? "" : "s"}.</p>
        </div>
        ${spark ? `<div class="team-spark">${spark}<span class="spark-cap">Score trajectory</span></div>` : ""}
      </header>

      <div class="cols3">
        <div class="col coach-did"><h3>Key improvements</h3><ul class="bullets">${coachList(improvements, CHECK_ICON)}</ul></div>
        <div class="col coach-dev"><h3>Areas needing attention</h3><ul class="bullets">${coachList(attention, AIM_ICON)}</ul></div>
        <div class="col coach-sus"><h3>Longer-term sustainability</h3><ul class="bullets">${coachList(sustainability, SEED_ICON)}</ul></div>
      </div>

      <h3 class="read-label">Performance indicators</h3>
      ${teamKpiTable(team, baseline)}

      <h3 class="read-label">Hidden drivers</h3>
      ${teamHiddenTable(team, baseline)}

      <h3 class="read-label">Week by week</h3>
      ${weeklyRecordTable(team)}

      <h3 class="read-label">Resource allocation</h3>
      ${allocationTable(team)}
    </section>`.trim();
}

function readGuide(): string {
  return `
    <section class="guide">
      <h3 class="read-label">How to read this report</h3>
      <div class="guide-grid">
        <div><h4>The 0-100 scale</h4><p>Every performance indicator and hidden driver is shown on a 0-100 index, where 100 is the best achievable position for this store. <strong>Higher is better for every measure except Safety risk, where lower is better.</strong></p></div>
        <div><h4>What the columns mean</h4><p><strong>Baseline</strong> is where the store sat 16 weeks before the session (historical context). <strong>Week 0 start</strong> is where every team began, identical for all teams. <strong>Week 8 end</strong> is where they finished. Movement compares Week 0 to Week 8.</p></div>
        <div><h4>Control scores</h4><p>Shrink control, Waste control and Cost control (SCC) are <em>control</em> scores: a higher number means tighter control and less loss. A rise is an improvement, not more shrink or waste.</p></div>
        <div><h4>Abbreviations</h4><p>ESAT - colleague engagement. CSAT - customer satisfaction. LFL - like-for-like (volume growth). SCC - Store Controllable Costs. Audits - satisfactory audit outcomes.</p></div>
      </div>
      <h4 class="scoring-h">How scoring works</h4>
      <p class="scoring-p">A team's <strong>weekly score</strong> reflects the store's overall goal performance that week - sales, colleagues, service, costs and risk - nudged up or down by the four hidden drivers (trust, capability, leadership consistency and safety risk). The <strong>final score</strong> is the sum of the eight weekly scores. Every team starts the session from the same Week 0 position, so scores are directly comparable and no team is advantaged at the start. The baseline figure is history only and does not count towards the score.</p>
    </section>`.trim();
}

const STYLES = `
  :root {
    --plum:#b31cc4;--plum-600:#9a17aa;--plum-soft:#faeffc;--plum-line:#ecd2f1;
    --cyan:#0e7490;--cyan-soft:#eef6f9;--cyan-line:#cfe5eb;--lime:#7e9c14;
    --ok:#0f9d58;--ok-soft:#e9f6ef;--risk:#e11d48;--risk-soft:#fdeaef;
    --seed:#7a5cc4;--seed-soft:#f0ecfa;
    --ink-900:#1a1420;--ink-700:#40384a;--ink-500:#6d6578;--ink-300:#c9c4d1;--ink-100:#ece9f1;--ink-50:#f8f6fb;
    --line:#e7e3ee;--r-tile:12px;
  }
  * { box-sizing:border-box; }
  html,body { margin:0;padding:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink-900);background:#fff;font-size:13.5px;line-height:1.5;letter-spacing:-0.005em;-webkit-font-smoothing:antialiased;-webkit-print-color-adjust:exact;print-color-adjust:exact; }
  .page { max-width:920px;margin:0 auto;padding:34px 42px 80px; }
  header.top { border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px; }
  header.top .brand { display:flex;align-items:center;gap:11px; }
  header.top .brand .mark { width:34px;height:34px;border-radius:10px;background:var(--plum);color:#fff;display:grid;place-items:center;flex:none; }
  header.top .brand .mark svg { width:18px;height:18px; }
  header.top .brand .name { font-size:14px;font-weight:600;letter-spacing:-0.01em; }
  header.top .brand .sub { font-size:12px;color:var(--ink-500); }
  header.top h1 { margin:12px 0 0;font-size:26px;font-weight:600;letter-spacing:-0.025em; }
  header.top h1 .for { color:var(--plum-600); }
  header.top .meta { text-align:right;color:var(--ink-500);font-size:12px;font-weight:500;line-height:1.5; }
  header.top .meta .code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:17px;font-weight:600;color:var(--ink-900);letter-spacing:0.08em; }
  .summary { display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px; }
  .summary .stat { background:var(--cyan-soft);border:1px solid var(--cyan-line);border-radius:var(--r-tile);padding:14px 16px; }
  .summary .stat .label { text-transform:uppercase;font-size:12px;letter-spacing:0.06em;color:var(--cyan);font-weight:600;margin-bottom:5px; }
  .summary .stat .value { font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.02em; }
  h2 { font-size:18px;font-weight:600;letter-spacing:-0.02em;margin:0 0 3px; }
  h3 { font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-500);margin:20px 0 8px; }
  h3.read-label { color:var(--cyan); }
  h4 { font-size:12.5px;font-weight:600;margin:0 0 4px;color:var(--ink-900); }
  p { margin:0 0 8px; }
  .num { font-variant-numeric:tabular-nums;letter-spacing:-0.01em; }
  .muted { color:var(--ink-300); }
  table { width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:4px; }
  table.kpi th,table.kpi td,table.log th,table.log td,table.alloc th,table.alloc td,table.leaderboard th,table.leaderboard td { padding:8px 10px;border-bottom:1px solid var(--ink-100);text-align:left;vertical-align:middle; }
  table th { font-size:11.5px;text-transform:uppercase;letter-spacing:0.04em;color:var(--ink-500);font-weight:600;border-bottom:1px solid var(--ink-300); }
  table.read th { color:var(--cyan);border-bottom-color:var(--cyan-line); }
  thead { display:table-header-group; }
  tr { break-inside:avoid;page-break-inside:avoid; }
  table .num { text-align:right; }
  table th.num { text-align:right; }
  td.label { font-weight:500; }
  td.label .hint { display:block;font-size:12px;font-weight:400;color:var(--ink-500);text-transform:none;letter-spacing:0;margin-top:1px; }
  td.end { text-align:right;white-space:nowrap; }
  td.wk, th.num.wk { color:var(--ink-500);font-weight:600; }
  td.challenge { font-size:12px;color:var(--ink-700);max-width:270px; }
  tr.avg td { border-top:1px solid var(--ink-300);font-weight:600;background:var(--ink-50); }
  .caption { font-size:11.5px;color:var(--ink-500);margin:4px 0 0; }
  .vbar { display:block;height:5px;width:78px;max-width:100%;margin-left:auto;margin-top:5px;border-radius:999px;background:var(--ink-100);overflow:hidden; }
  .vbar-fill { display:block;height:100%;border-radius:999px; }
  .tone-data{background:var(--lime);}.tone-plum{background:var(--plum);}.tone-risk{background:var(--risk);}.tone-read{background:var(--cyan);}
  td.movement { white-space:nowrap; }
  .delta { display:inline-flex;align-items:center;gap:3px;font-weight:600; }
  .delta .arrow { width:13px;height:13px; }
  .delta.up{color:var(--ok);}.delta.down{color:var(--risk);}.delta.flat{color:var(--ink-500);}
  .delta .delta-num { font-weight:500;color:var(--ink-500); }
  table.leaderboard { margin-bottom:8px;max-width:520px; }
  table.leaderboard tr.lead td { background:var(--plum-soft); }
  table.leaderboard .rank-cell { color:var(--ink-500);font-weight:600;width:48px; }
  table.leaderboard tr.lead .rank-cell { color:var(--plum-600); }
  table.leaderboard .score-cell { font-weight:600; }
  .team-cell { display:inline-flex;align-items:center;gap:8px; }
  .crest-small { line-height:0;display:inline-flex; }
  .tbadge { display:inline-block;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.72em;font-weight:700;color:var(--plum-600);background:var(--plum-soft);border:1px solid var(--plum-line);border-radius:6px;padding:1px 5px;margin-right:7px;vertical-align:middle;letter-spacing:0.02em; }
  .guide { background:var(--ink-50);border:1px solid var(--line);border-radius:var(--r-tile);padding:16px 18px;margin:8px 0 6px;break-inside:avoid;page-break-inside:avoid; }
  .guide h3.read-label { margin-top:0; }
  .guide-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px 22px; }
  .guide-grid p { font-size:12.5px;color:var(--ink-700);margin:0; }
  .scoring-h { margin:14px 0 4px; }
  .scoring-p { font-size:12.5px;color:var(--ink-700);margin:0; }
  section.team { margin-top:28px;padding-top:24px;border-top:1px solid var(--line);break-inside:avoid-page;page-break-before:auto; }
  section.team:first-of-type { border-top:none;padding-top:4px; }
  section.team .team-header { display:grid;grid-template-columns:auto auto 1fr auto;gap:16px;align-items:center;margin-bottom:6px;break-inside:avoid;page-break-inside:avoid;page-break-after:avoid; }
  section.team .team-header .rank { font-size:22px;font-weight:600;color:var(--plum-600);font-variant-numeric:tabular-nums;letter-spacing:-0.02em;min-width:36px; }
  section.team .team-header .crest { line-height:0; }
  section.team .team-id h2 { margin:0; }
  section.team .sub { color:var(--ink-500);font-size:12.5px;margin:2px 0 0; }
  .team-spark { text-align:right; }
  .team-spark .spark { display:block;margin-left:auto; }
  .team-spark .spark-cap { display:block;font-size:12px;color:var(--ink-500);margin-top:2px; }
  .cols3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:14px;break-inside:avoid;page-break-inside:avoid; }
  .col { border-radius:var(--r-tile);padding:13px 15px; }
  .col h3 { margin-top:0; }
  .coach-did { background:var(--ok-soft); } .coach-did h3 { color:var(--ok); }
  .coach-dev { background:var(--plum-soft); } .coach-dev h3 { color:var(--plum-600); }
  .coach-sus { background:var(--seed-soft); } .coach-sus h3 { color:var(--seed); }
  ul.bullets { list-style:none;padding:0;margin:0;display:grid;gap:8px; }
  ul.bullets li { display:grid;grid-template-columns:16px 1fr;gap:8px;align-items:start;font-size:12.5px;line-height:1.4;color:var(--ink-700); }
  ul.bullets .cico { width:14px;height:14px;margin-top:2px; }
  .coach-did .cico { color:var(--ok); } .coach-dev .cico { color:var(--plum-600); } .coach-sus .cico { color:var(--seed); }
  footer.bottom { margin-top:40px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--ink-500);display:flex;justify-content:space-between;gap:16px; }
  .print-hint { margin:16px 0 0;padding:12px 16px;background:var(--plum-soft);border:1px solid var(--plum-line);border-radius:var(--r-tile);font-size:12.5px;color:var(--ink-700); }
  @media print {
    .page { max-width:none;padding:14mm 12mm 16mm; }
    .print-hint { display:none; }
    section.team { page-break-before:always; }
    section.team:first-of-type { page-break-before:avoid; }
    .guide, .cols3, table, tr, .team-header { page-break-inside:avoid; }
    thead { display:table-header-group; }
    header.top { page-break-after:avoid; }
  }
`;

function docShell(title: string, headInner: string, bodyInner: string, session: Session, generatedAt: number): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
  <div class="page">
    <header class="top">
      <div>
        <div class="brand">
          <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/></svg></span>
          <span><span class="name">Plumfield Stores</span><br><span class="sub">Leadership simulation</span></span>
        </div>
        ${headInner}
      </div>
      <div class="meta">
        <div class="code">${escapeHtml(session.code)}</div>
        <div>${escapeHtml(formatDate(generatedAt))}</div>
      </div>
    </header>
    ${bodyInner}
    <footer class="bottom">
      <div>Session ${escapeHtml(session.code)}</div>
      <div>Generated ${escapeHtml(formatDate(generatedAt))}</div>
    </footer>
  </div>
</body>
</html>`;
}

// Combined facilitator report (default) or a single-team report (opts.teamId).
export function generateReport(session: Session, opts?: { teamId?: string }): string {
  const teams = Array.from(session.teams.values());
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const generatedAt = Date.now();
  // Stable team number (T1, T2...) by join order, independent of final rank, so a
  // team maps to its table whatever it called itself and wherever it finished.
  const teamNo = new Map(teams.map((t, i) => [t.id, i + 1]));

  if (opts?.teamId) {
    const idx = ranked.findIndex((t) => t.id === opts.teamId);
    const team = ranked[idx];
    if (!team) return docShell(`Plumfield Stores - Team report - ${session.code}`, `<h1>Team report</h1>`, `<p>Team not found.</p>`, session, generatedAt);
    const n = teamNo.get(team.id) ?? idx + 1;
    const headInner = `<h1><span class="for">T${n} &middot; ${escapeHtml(team.name)}</span> - week 1 to 8 report</h1>`;
    const body = `
      <div class="summary">
        <div class="stat"><div class="label">Team</div><div class="value">T${n} &middot; ${escapeHtml(team.name)}</div></div>
        <div class="stat"><div class="label">Final rank</div><div class="value num">${idx + 1} of ${teams.length}</div></div>
        <div class="stat"><div class="label">Final score</div><div class="value num">${scoreInt(team.score)}</div></div>
      </div>
      ${readGuide()}
      <div class="print-hint">To save as PDF, use your browser's print dialog and choose "Save as PDF". This report covers T${n} (${escapeHtml(team.name)}) only.</div>
      ${teamSection(team, idx + 1, n, teams.length, session.baselineTrend)}`;
    return docShell(`Plumfield Stores - T${n} ${team.name} - Session report - ${session.code}`, headInner, body, session, generatedAt);
  }

  const shiftsPlayed = teams[0]?.history.length ?? 0;
  const topTeam = ranked[0]?.name ?? "-";
  const leaderboardRows = ranked.map((t, i) => `
    <tr class="${i === 0 ? "lead" : ""}">
      <td class="num rank-cell">${i + 1}</td>
      <td><div class="team-cell"><span class="crest-small">${crestSvg(t.name, 22)}</span><span class="tbadge">T${teamNo.get(t.id)}</span>${escapeHtml(t.name)}</div></td>
      <td class="num score-cell">${scoreInt(t.score)}</td>
    </tr>`.trim()).join("\n");
  const teamSections = ranked.map((t, i) => teamSection(t, i + 1, teamNo.get(t.id) ?? i + 1, teams.length, session.baselineTrend)).join("\n");
  const body = `
    <div class="summary">
      <div class="stat"><div class="label">Teams</div><div class="value num">${teams.length}</div></div>
      <div class="stat"><div class="label">Weeks played</div><div class="value num">${shiftsPlayed}</div></div>
      <div class="stat"><div class="label">Top team</div><div class="value">${escapeHtml(topTeam)}</div></div>
    </div>
    <h3 class="read-label">Final standings</h3>
    <table class="leaderboard read">
      <thead><tr><th class="num">Rank</th><th>Team</th><th class="num">Score</th></tr></thead>
      <tbody>${leaderboardRows}</tbody>
    </table>
    ${readGuide()}
    <div class="print-hint">To save as PDF, use your browser's print dialog and choose "Save as PDF" as the destination.</div>
    ${teamSections}`;
  return docShell(`Plumfield Stores - Session report - ${session.code}`, `<h1>Session report</h1>`, body, session, generatedAt);
}

// A short, filesystem-safe filename for a single team's report, prefixed with the
// team number so files sort T1, T2, ... in the ZIP.
export function teamReportFilename(session: Session, team: TeamFull, tNum: number, generatedAt = Date.now()): string {
  const safe = team.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "team";
  return `T${tNum}-${safe}-${session.code}-${dateShort(generatedAt).replace(/[^a-z0-9]+/gi, "-")}.html`;
}
