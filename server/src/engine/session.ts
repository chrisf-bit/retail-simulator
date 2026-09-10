import { nanoid } from "nanoid";
import type {
  ActionApproach,
  Alert,
  ConfidenceLevel,
  Decision,
  DisruptionEvent,
  FacilitatorPrompt,
  HiddenDrivers,
  Issue,
  LeadershipStyle,
  Metrics,
  Priority,
  ResourceAllocation,
  RoundState,
  SessionPhase,
  SessionStatePublic,
  TeamFull,
  TeamPublic,
  TrendKey,
} from "@sim/shared";
import {
  BASELINE_WEEKS,
  BRIEFING_STEP_COUNT,
  CONNECTION_DROPPED_AFTER_MS,
  CONNECTION_STRUGGLING_AFTER_MS,
  CONNECTION_TICK_MS,
  DEFAULT_EXPECTED_TEAMS,
  DISRUPTION_CHANCE,
  DISRUPTION_WINDOW,
  MAX_TEAMS,
  METRIC_KEYS,
  HIDDEN_KEYS,
  MIN_TEAMS,
  ROUND_COUNT,
  ROUND_DURATION_MS,
  METRIC_DEFS,
  metricBaselineNorm,
  metricNormFromReal,
} from "@sim/shared";
import type { ConnectionStatus } from "@sim/shared";
import type { TrendSeries } from "@sim/shared";
import { ALERT_BANK, DISRUPTION_BANK, ISSUE_BANK } from "./scenarios.js";
import { MOMENT_BANK } from "./moments.js";
import { applyDecision, summariseRisk, summariseStrength } from "./scoring.js";
import { generatePrompts } from "./prompts.js";
import { generateInsights } from "./insights.js";
import { deleteSessionFile, readAllSessionFiles, SESSION_TTL_MS, writeSessionFile } from "./persistence.js";

// Starting (week-0) values per metric and hidden driver. All 0-100.
// Every team starts at the validated real-world baseline for each metric,
// normalised onto the engine's 0-100 scale (see METRIC_DEFS in @sim/shared).
// Kept unrounded so the opening HUD reads exactly as the pack's baseline.
const START_METRICS: Metrics = METRIC_KEYS.reduce((acc, k) => {
  acc[k] = metricNormFromReal(k, METRIC_DEFS[k].baseline);
  return acc;
}, {} as Metrics);

const START_HIDDEN: HiddenDrivers = {
  safety_risk: 30,
  trust: 60,
  capability: 55,
  leadership_consistency: 50,
};

// Where each series sat 16 weeks before the session, drifting to its START value.
// Metrics start a touch above baseline so the pre-session history shows a gentle
// decline into the dip the incoming manager inherits (the "unreliable narrator"
// handover insists the dip is nothing - the trend says otherwise).
const BASELINE_FROM: Record<TrendKey, number> = (() => {
  const from = {} as Record<TrendKey, number>;
  for (const k of METRIC_KEYS) from[k] = Math.min(100, metricBaselineNorm(k) + 8);
  from.safety_risk = 18;
  from.trust = 52;
  from.capability = 44;
  from.leadership_consistency = 60;
  return from;
})();

function startingMetrics(): Metrics {
  return { ...START_METRICS };
}

function startingHidden(): HiddenDrivers {
  return { ...START_HIDDEN };
}

function pickN<T>(source: T[], n: number): T[] {
  const pool = [...source];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function buildIssues(usedIds: Set<string>): Issue[] {
  const remaining = ISSUE_BANK.filter((i) => !usedIds.has(i.id));
  const pool = remaining.length >= 3 ? remaining : ISSUE_BANK;
  return pickN(pool, 3);
}

// Alerts and disruptions in the banks have no stable ids, so we use title as
// the dedup key within a session.
function buildAlerts(usedTitles: Set<string>): Alert[] {
  const remaining = ALERT_BANK.filter((a) => !usedTitles.has(a.title));
  const pool = remaining.length >= 2 ? remaining : ALERT_BANK;
  return pickN(pool, 2).map((a) => ({
    ...a,
    id: nanoid(6),
    timestamp: Date.now(),
  }));
}

function buildDisruption(usedTitles: Set<string>): DisruptionEvent {
  const remaining = DISRUPTION_BANK.filter((d) => !usedTitles.has(d.title));
  const pool = remaining.length > 0 ? remaining : DISRUPTION_BANK;
  const base = pickN(pool, 1)[0];
  return {
    ...base,
    id: nanoid(6),
    triggeredAt: Date.now(),
  };
}

function buildMoment(usedIds: Set<string>) {
  const remaining = MOMENT_BANK.filter((m) => !usedIds.has(m.id));
  const pool = remaining.length > 0 ? remaining : MOMENT_BANK;
  return pickN(pool, 1)[0];
}

function plausibleSeries(from: number, to: number, weeks: number, noise: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < weeks; i++) {
    const t = i / Math.max(1, weeks - 1);
    const base = from + (to - from) * t;
    const jitter = (Math.random() - 0.5) * 2 * noise;
    out.push(Math.max(0, Math.min(100, Math.round(base + jitter))));
  }
  out[out.length - 1] = to;
  return out;
}

function buildBaselineTrend(): TrendSeries {
  const to: Record<TrendKey, number> = { ...START_METRICS, ...START_HIDDEN };
  const trend = {} as TrendSeries;
  for (const key of [...METRIC_KEYS, ...HIDDEN_KEYS] as TrendKey[]) {
    trend[key] = plausibleSeries(BASELINE_FROM[key], to[key], BASELINE_WEEKS, 3);
  }
  return trend;
}

function deriveStatus(lastSeenAt: number): ConnectionStatus {
  const elapsed = Date.now() - lastSeenAt;
  if (elapsed > CONNECTION_DROPPED_AFTER_MS) return "dropped";
  if (elapsed > CONNECTION_STRUGGLING_AFTER_MS) return "struggling";
  return "connected";
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Server-authoritative decision validation. Client input is untrusted, so every
// field is checked against the known option sets and the live round before it is
// allowed to touch scoring: bad enums, non-finite / out-of-range allocations, an
// allocation that does not total 100, or ids that do not reference a real issue /
// moment option are all rejected (returns null). Guards against a crafted payload
// poisoning a team's metrics (or a NaN propagating through the maths).
const VALID_PRIORITIES: readonly Priority[] = ["safety_loss", "people_team", "customer", "commercial"];
const VALID_ACTIONS: readonly ActionApproach[] = ["standard", "adapt_local", "escalate", "reallocate"];
const VALID_LEADERSHIP: readonly LeadershipStyle[] = ["directive", "collaborative", "coaching", "delegated"];
const VALID_CONFIDENCE: readonly ConfidenceLevel[] = ["cautious", "measured", "confident"];
const ALLOC_KEYS = ["shop_floor", "backroom", "customer_service", "problem_resolution"] as const;

function sanitizeDecision(input: unknown, round: RoundState): Omit<Decision, "submittedAt"> | null {
  if (!input || typeof input !== "object") return null;
  const d = input as Record<string, unknown>;

  if (!VALID_PRIORITIES.includes(d.priority as Priority)) return null;
  if (!VALID_ACTIONS.includes(d.action as ActionApproach)) return null;
  if (!VALID_LEADERSHIP.includes(d.leadership as LeadershipStyle)) return null;
  if (!VALID_CONFIDENCE.includes(d.confidence as ConfidenceLevel)) return null;

  const alloc = d.allocation;
  if (!alloc || typeof alloc !== "object") return null;
  const allocRec = alloc as Record<string, unknown>;
  const cleanAlloc = {} as ResourceAllocation;
  let sum = 0;
  for (const k of ALLOC_KEYS) {
    const v = allocRec[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) return null;
    const iv = Math.round(v);
    cleanAlloc[k] = iv;
    sum += iv;
  }
  if (sum !== 100) return null;

  let primaryIssueId: string | undefined;
  if (d.primaryIssueId !== undefined && d.primaryIssueId !== null) {
    if (typeof d.primaryIssueId !== "string") return null;
    if (!round.issues.some((i) => i.id === d.primaryIssueId)) return null;
    primaryIssueId = d.primaryIssueId;
  }

  let momentResponseId: string | undefined;
  if (d.momentResponseId !== undefined && d.momentResponseId !== null) {
    if (typeof d.momentResponseId !== "string") return null;
    if (!round.moment || !round.moment.options.some((o) => o.id === d.momentResponseId)) return null;
    momentResponseId = d.momentResponseId;
  }

  return {
    priority: d.priority as Priority,
    action: d.action as ActionApproach,
    leadership: d.leadership as LeadershipStyle,
    allocation: cleanAlloc,
    confidence: d.confidence as ConfidenceLevel,
    primaryIssueId,
    momentResponseId,
  };
}

export interface PersistedSession {
  id: string;
  code: string;
  facilitatorToken: string;
  expectedTeams: number;
  phase: SessionPhase;
  teams: TeamFull[];
  prompts: FacilitatorPrompt[];
  usedMomentIds: string[];
  usedIssueIds?: string[];
  usedAlertTitles?: string[];
  usedDisruptionTitles?: string[];
  baselineTrend: TrendSeries;
  round?: RoundState;
  disruptionScheduledAt?: number;
  createdAt: number;
  updatedAt: number;
}

export class Session {
  id = nanoid(10);
  code = generateCode();
  facilitatorToken = nanoid(24);
  expectedTeams: number;
  phase: SessionPhase = "lobby";
  teams = new Map<string, TeamFull>();
  prompts: FacilitatorPrompt[] = [];
  usedMomentIds = new Set<string>();
  usedIssueIds = new Set<string>();
  usedAlertTitles = new Set<string>();
  usedDisruptionTitles = new Set<string>();
  baselineTrend: TrendSeries = buildBaselineTrend();
  round?: RoundState;
  // Facilitator-driven walkthrough step during the briefing phase. Ephemeral
  // (not persisted): a mid-briefing restart simply resets the demo to step 0.
  briefingStep = 0;
  createdAt = Date.now();
  updatedAt = Date.now();
  private lastBroadcastStatuses?: Map<string, ConnectionStatus>;
  roundTimer?: NodeJS.Timeout;
  disruptionTimer?: NodeJS.Timeout;
  // Absolute wall-clock time a disruption is due to strike this shift, or
  // undefined if the coin-flip came up empty for this shift. Kept server-side
  // (not on the public round) so teams cannot read the payload and learn
  // whether or when a disruption is coming. Persisted for timer rehydration.
  private disruptionScheduledAt?: number;
  writeTimer?: NodeJS.Timeout;
  private onUpdate: () => void;

  constructor(onUpdate: () => void, expectedTeams: number = DEFAULT_EXPECTED_TEAMS) {
    this.onUpdate = onUpdate;
    this.expectedTeams = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Math.floor(expectedTeams)));
  }

  /**
   * Rehydrate a Session from a persisted snapshot. Repopulates every field
   * and re-schedules timers if the round was mid-flight when we wrote the
   * snapshot.
   */
  static restore(data: PersistedSession, onUpdate: () => void): Session {
    const session = new Session(onUpdate, data.expectedTeams);
    session.id = data.id;
    session.code = data.code;
    session.facilitatorToken = data.facilitatorToken;
    session.phase = data.phase;
    session.teams = new Map(data.teams.map((t) => [t.id, t]));
    // Backfill sessions persisted before the goals/metrics migration: old team
    // snapshots carry `kpis` and history with `kpisAfter`, not the new metrics
    // shape. Seed fresh metrics/hidden and drop incompatible history so we never
    // serialise undefined metrics to clients.
    for (const team of session.teams.values()) {
      if (!team.metrics) team.metrics = startingMetrics();
      if (!team.hidden) team.hidden = startingHidden();
      team.history = (team.history ?? []).filter((h) => h && h.metricsAfter && h.hiddenAfter);
    }
    session.prompts = data.prompts ?? [];
    session.usedMomentIds = new Set(data.usedMomentIds ?? []);
    session.usedIssueIds = new Set(data.usedIssueIds ?? []);
    session.usedAlertTitles = new Set(data.usedAlertTitles ?? []);
    session.usedDisruptionTitles = new Set(data.usedDisruptionTitles ?? []);
    session.baselineTrend = data.baselineTrend;
    session.round = data.round;
    session.disruptionScheduledAt = data.disruptionScheduledAt;
    session.createdAt = data.createdAt;
    session.updatedAt = data.updatedAt;
    session.rescheduleTimers();
    return session;
  }

  toJSON(): PersistedSession {
    return {
      id: this.id,
      code: this.code,
      facilitatorToken: this.facilitatorToken,
      expectedTeams: this.expectedTeams,
      phase: this.phase,
      teams: Array.from(this.teams.values()),
      prompts: this.prompts,
      usedMomentIds: Array.from(this.usedMomentIds),
      usedIssueIds: Array.from(this.usedIssueIds),
      usedAlertTitles: Array.from(this.usedAlertTitles),
      usedDisruptionTitles: Array.from(this.usedDisruptionTitles),
      baselineTrend: this.baselineTrend,
      round: this.round,
      disruptionScheduledAt: this.disruptionScheduledAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Debounced write. Called on every state change via onUpdate. Batches rapid
   * updates so we write at most once every 500ms per session.
   */
  scheduleWrite(): void {
    this.updatedAt = Date.now();
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      this.writeTimer = undefined;
      writeSessionFile(this.id, this.toJSON()).catch((err) => {
        console.warn(`[persistence] write failed for ${this.id}:`, err);
      });
    }, 500);
  }

  /**
   * Used by the SIGTERM handler to flush any pending write synchronously
   * before the process exits.
   */
  hasPendingWrite(): boolean {
    return this.writeTimer !== undefined;
  }
  cancelPendingWrite(): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = undefined;
    }
  }

  /**
   * On rehydrate, re-schedule round and disruption timers based on endsAt and
   * startedAt relative to wall-clock now.
   */
  private rescheduleTimers(): void {
    if (!this.round) return;
    const phase = this.round.phase;
    if (phase === "locked" || phase === "reveal") return;
    const now = Date.now();

    const remaining = this.round.endsAt - now;
    if (remaining <= 0) {
      // We were down past the end of the round. Resolve it now.
      setImmediate(() => this.endRound());
      return;
    }
    this.roundTimer = setTimeout(() => this.endRound(), remaining);

    if (
      !this.round.disruption &&
      this.round.phase === "active" &&
      this.disruptionScheduledAt !== undefined
    ) {
      const untilDisruption = this.disruptionScheduledAt - now;
      if (untilDisruption > 0) {
        this.disruptionTimer = setTimeout(() => this.triggerDisruption(), untilDisruption);
      } else {
        // Missed the scheduled trigger while the server was down. Fire it now.
        setImmediate(() => this.triggerDisruption());
      }
    }
  }

  isFull(): boolean {
    return this.teams.size >= this.expectedTeams;
  }

  addTeam(name: string, sessionTokenHash?: string): TeamFull {
    const team: TeamFull = {
      id: nanoid(8),
      name,
      score: 0,
      lastMovement: 0,
      metrics: startingMetrics(),
      hidden: startingHidden(),
      submitted: false,
      history: [],
      lastSeenAt: Date.now(),
      sessionTokenHash,
    };
    this.teams.set(team.id, team);
    this.onUpdate();
    return team;
  }

  /**
   * Gate a rejoin / submit against the team's stored token hash. The caller
   * hashes the raw token the client presented and passes the hash in. Sessions
   * persisted before tokens existed carry no hash - allow those through so an
   * in-flight game is not broken by the upgrade (legacy fallback).
   */
  verifyTeamToken(teamId: string, providedHash: string | undefined): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;
    if (!team.sessionTokenHash) return true; // legacy pre-token session
    return typeof providedHash === "string" && providedHash === team.sessionTokenHash;
  }

  touchTeam(teamId: string): void {
    const team = this.teams.get(teamId);
    if (!team) return;
    team.lastSeenAt = Date.now();
  }

  /** Re-broadcast if any team's derived connectionStatus has changed since last tick. */
  refreshConnectionStatuses(): void {
    if (this.lastBroadcastStatuses === undefined) {
      this.lastBroadcastStatuses = new Map();
    }
    let changed = false;
    for (const team of this.teams.values()) {
      const next = deriveStatus(team.lastSeenAt);
      const prev = this.lastBroadcastStatuses.get(team.id);
      if (prev !== next) {
        this.lastBroadcastStatuses.set(team.id, next);
        changed = true;
      }
    }
    if (changed) this.onUpdate();
  }

  startBriefing() {
    if (this.phase !== "lobby") return;
    this.phase = "briefing";
    this.briefingStep = 0;
    this.onUpdate();
  }

  setBriefingStep(step: number) {
    if (this.phase !== "briefing") return;
    const clamped = Math.max(0, Math.min(BRIEFING_STEP_COUNT - 1, Math.floor(step)));
    if (clamped === this.briefingStep) return;
    this.briefingStep = clamped;
    this.onUpdate();
  }

  startRound() {
    if (this.phase !== "briefing" && this.phase !== "round_results") return;
    const nextNumber = (this.round?.number ?? 0) + 1;
    if (nextNumber > ROUND_COUNT) {
      this.phase = "debrief";
      this.onUpdate();
      return;
    }

    const now = Date.now();
    const moment = buildMoment(this.usedMomentIds);
    this.usedMomentIds.add(moment.id);

    const issues = buildIssues(this.usedIssueIds);
    for (const i of issues) this.usedIssueIds.add(i.id);

    const alerts = buildAlerts(this.usedAlertTitles);
    for (const a of alerts) this.usedAlertTitles.add(a.title);

    this.round = {
      number: nextNumber,
      phase: "active",
      startedAt: now,
      endsAt: now + ROUND_DURATION_MS,
      durationMs: ROUND_DURATION_MS,
      issues,
      alerts,
      moment,
    };

    for (const team of this.teams.values()) {
      team.submitted = false;
      team.lastDecision = undefined;
    }

    this.phase = "round";

    if (this.roundTimer) clearTimeout(this.roundTimer);
    this.roundTimer = setTimeout(() => this.endRound(), ROUND_DURATION_MS);

    if (this.disruptionTimer) clearTimeout(this.disruptionTimer);
    this.disruptionScheduledAt = undefined;
    // A disruption has a fixed chance of striking this shift. When it does, it
    // lands at a random point within the opening window of the shift - the same
    // moment for every team, since it is scheduled once here on the shared round.
    if (Math.random() < DISRUPTION_CHANCE) {
      const disruptionDelay = Math.random() * ROUND_DURATION_MS * DISRUPTION_WINDOW;
      this.disruptionScheduledAt = now + disruptionDelay;
      this.disruptionTimer = setTimeout(() => this.triggerDisruption(), disruptionDelay);
    }

    this.onUpdate();
  }

  triggerDisruption() {
    if (!this.round || this.round.phase !== "active") return;
    const disruption = buildDisruption(this.usedDisruptionTitles);
    this.usedDisruptionTitles.add(disruption.title);
    this.round.disruption = disruption;
    this.round.phase = "disrupted";
    this.onUpdate();
  }

  submitDecision(teamId: string, input: unknown) {
    const team = this.teams.get(teamId);
    if (!team || !this.round) return;
    if (this.round.phase === "locked" || this.round.phase === "reveal") return;

    const clean = sanitizeDecision(input, this.round);
    if (!clean) return; // reject malformed / out-of-range payloads outright

    team.lastDecision = { ...clean, submittedAt: Date.now() };
    team.submitted = true;
    this.onUpdate();

    const allSubmitted = Array.from(this.teams.values()).every((t) => t.submitted);
    if (allSubmitted) {
      if (this.roundTimer) clearTimeout(this.roundTimer);
      setTimeout(() => this.endRound(), 750);
    }
  }

  endRound() {
    if (!this.round) return;
    if (this.roundTimer) clearTimeout(this.roundTimer);
    if (this.disruptionTimer) clearTimeout(this.disruptionTimer);

    this.round.phase = "locked";

    for (const team of this.teams.values()) {
      const decision: Decision = team.lastDecision ?? {
        priority: "commercial",
        action: "standard",
        leadership: "directive",
        allocation: { shop_floor: 25, backroom: 25, customer_service: 25, problem_resolution: 25 },
        confidence: "measured",
        submittedAt: Date.now(),
      };

      const result = applyDecision({
        metrics: team.metrics,
        hidden: team.hidden,
        decision,
        issues: this.round.issues,
        moment: this.round.moment,
        disruption: this.round.disruption,
      });

      const previousScore = team.score;
      team.metrics = result.nextMetrics;
      team.hidden = result.nextHidden;
      team.score += result.roundScore;
      team.lastMovement = team.score - previousScore;
      team.strength = summariseStrength(team.metrics);
      team.risk = summariseRisk(team.metrics, team.hidden);
      const responseArchetype = this.round.moment && decision.momentResponseId
        ? this.round.moment.options.find((o) => o.id === decision.momentResponseId)?.archetype
        : undefined;

      team.history.push({
        round: this.round.number,
        decision,
        momentArchetype: responseArchetype,
        momentPersonaName: this.round.moment?.persona.name,
        metricDelta: result.metricDelta,
        hiddenDelta: result.hiddenDelta,
        metricsAfter: result.nextMetrics,
        hiddenAfter: result.nextHidden,
        roundScore: result.roundScore,
      });
    }

    this.round.phase = "reveal";
    this.phase = "round_results";
    this.prompts = generatePrompts(Array.from(this.teams.values()));

    if (this.round.number >= ROUND_COUNT) {
      this.phase = "debrief";
    }

    this.onUpdate();
  }

  nextPhase() {
    if (this.phase === "lobby") this.startBriefing();
    else if (this.phase === "briefing") this.startRound();
    else if (this.phase === "round") this.endRound();
    else if (this.phase === "round_results") {
      if ((this.round?.number ?? 0) >= ROUND_COUNT) {
        this.phase = "debrief";
      } else {
        this.startRound();
      }
    } else if (this.phase === "debrief") {
      this.phase = "finished";
    }
    this.onUpdate();
  }

  publicState(): SessionStatePublic {
    const revealPhase =
      this.phase === "round_results" || this.phase === "debrief" || this.phase === "finished";

    const teams: TeamPublic[] = Array.from(this.teams.values()).map((t) => {
      const lastHistory = t.history[t.history.length - 1];
      const base = this.baselineTrend;
      const trend = {} as TrendSeries;
      for (const key of METRIC_KEYS) {
        trend[key] = [...base[key], ...t.history.map((h) => h.metricsAfter[key])];
      }
      for (const key of HIDDEN_KEYS) {
        trend[key] = [...base[key], ...t.history.map((h) => h.hiddenAfter[key])];
      }
      return {
        id: t.id,
        name: t.name,
        score: t.score,
        lastMovement: t.lastMovement,
        metrics: t.metrics,
        lastDecision: t.lastDecision,
        lastMetricDelta: revealPhase ? lastHistory?.metricDelta : undefined,
        lastHiddenDelta: revealPhase ? lastHistory?.hiddenDelta : undefined,
        revealedHidden: revealPhase ? t.hidden : undefined,
        trend,
        submitted: t.submitted,
        strength: t.strength,
        risk: t.risk,
        connectionStatus: deriveStatus(t.lastSeenAt),
      };
    });

    const ranked = [...teams].sort((a, b) => b.score - a.score);
    const leaderboard = ranked.map((t, idx) => ({
      teamId: t.id,
      name: t.name,
      rank: idx + 1,
      score: t.score,
      movement: t.lastMovement,
    }));

    const insights = generateInsights(
      Array.from(this.teams.values()),
      this.phase,
      this.round?.number ?? 0,
    );

    return {
      id: this.id,
      code: this.code,
      expectedTeams: this.expectedTeams,
      phase: this.phase,
      round: this.round,
      teams,
      leaderboard,
      prompts: this.prompts,
      insights,
      briefingStep: this.briefingStep,
      serverNow: Date.now(),
    };
  }

  /**
   * Redacted view for a team socket. Same shape as publicState but:
   * - Other teams keep only scoreboard fields (name, score, movement, submitted,
   *   connectionStatus). Their decisions, KPIs, trends, deltas, hidden drivers,
   *   strength and risk are stripped.
   * - `insights` and `prompts` are blanked. Those are facilitator coaching content.
   */
  teamState(viewerTeamId: string): SessionStatePublic {
    const full = this.publicState();
    const redactedTeams: TeamPublic[] = full.teams.map((t) => {
      if (t.id === viewerTeamId) return t;
      const zeroMetrics = {} as Metrics;
      for (const key of METRIC_KEYS) zeroMetrics[key] = 0;
      const emptyTrend = {} as TrendSeries;
      for (const key of [...METRIC_KEYS, ...HIDDEN_KEYS] as TrendKey[]) emptyTrend[key] = [];
      return {
        id: t.id,
        name: t.name,
        score: t.score,
        lastMovement: t.lastMovement,
        submitted: t.submitted,
        connectionStatus: t.connectionStatus,
        metrics: zeroMetrics,
        trend: emptyTrend,
      };
    });
    return {
      ...full,
      teams: redactedTeams,
      insights: {
        teams: [],
        patterns: [],
        script: { headline: "", talkTrack: [], watchFor: [] },
      },
      prompts: [],
    };
  }

  dispose() {
    if (this.roundTimer) clearTimeout(this.roundTimer);
    if (this.disruptionTimer) clearTimeout(this.disruptionTimer);
    if (this.writeTimer) clearTimeout(this.writeTimer);
  }
}

export class SessionStore {
  private byId = new Map<string, Session>();
  private byCode = new Map<string, Session>();
  private broadcast: (sessionId: string) => void;

  constructor(broadcast: (sessionId: string) => void) {
    this.broadcast = broadcast;
  }

  private handleUpdate = (sessionId: string): void => {
    this.broadcast(sessionId);
    const session = this.byId.get(sessionId);
    if (session) session.scheduleWrite();
  };

  /**
   * Load every persisted session from disk. Drops any that are older than
   * SESSION_TTL_MS. Called once on boot before we start accepting connections.
   */
  async hydrate(): Promise<void> {
    const files = await readAllSessionFiles<PersistedSession>();
    const now = Date.now();
    for (const { sessionId, data, updatedAt } of files) {
      if (now - updatedAt > SESSION_TTL_MS) {
        await deleteSessionFile(sessionId);
        continue;
      }
      try {
        const session = Session.restore(data, () => this.handleUpdate(sessionId));
        this.byId.set(session.id, session);
        this.byCode.set(session.code, session);
      } catch (err) {
        console.warn(`[persistence] failed to restore ${sessionId}:`, err);
      }
    }
    console.log(`[persistence] hydrated ${this.byId.size} session(s) from ${files.length} file(s)`);
  }

  /**
   * Evict sessions older than SESSION_TTL_MS from memory and disk. Called
   * periodically.
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [id, session] of this.byId) {
      if (now - session.updatedAt > SESSION_TTL_MS) {
        session.dispose();
        this.byId.delete(id);
        this.byCode.delete(session.code);
        await deleteSessionFile(id);
      }
    }

    // Sweep the disk too: a file whose session is not in memory (an orphan from a
    // long uptime, or written by a prior instance) is never touched by the loop
    // above, only by hydrate() at boot. Prune stale orphans here so they cannot
    // accumulate on a server that runs for days without a restart.
    try {
      const files = await readAllSessionFiles<PersistedSession>();
      for (const { sessionId, updatedAt } of files) {
        if (this.byId.has(sessionId)) continue;
        if (now - updatedAt > SESSION_TTL_MS) {
          await deleteSessionFile(sessionId);
        }
      }
    } catch (err) {
      console.warn("[persistence] disk sweep failed:", err);
    }
  }

  create(expectedTeams?: number): Session {
    const session = new Session(() => this.handleUpdate(session.id), expectedTeams);
    this.byId.set(session.id, session);
    this.byCode.set(session.code, session);
    session.scheduleWrite();
    return session;
  }

  get(id: string): Session | undefined {
    return this.byId.get(id);
  }

  getByCode(code: string): Session | undefined {
    return this.byCode.get(code.toUpperCase());
  }

  all(): IterableIterator<Session> {
    return this.byId.values();
  }
}
