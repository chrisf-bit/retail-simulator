import { nanoid } from "nanoid";
import type {
  Alert,
  Decision,
  DisruptionEvent,
  FacilitatorPrompt,
  HiddenDrivers,
  Issue,
  Kpis,
  RoundState,
  SessionPhase,
  SessionStatePublic,
  TeamFull,
  TeamPublic,
} from "@sim/shared";
import {
  CONNECTION_DROPPED_AFTER_MS,
  CONNECTION_STRUGGLING_AFTER_MS,
  CONNECTION_TICK_MS,
  DEFAULT_EXPECTED_TEAMS,
  MAX_TEAMS,
  MIN_TEAMS,
  ROUND_COUNT,
  ROUND_DURATION_MS,
} from "@sim/shared";
import type { ConnectionStatus } from "@sim/shared";
import type { TrendSeries } from "@sim/shared";
import { ALERT_BANK, DISRUPTION_BANK, ISSUE_BANK } from "./scenarios.js";
import { MOMENT_BANK } from "./moments.js";
import { applyDecision, summariseRisk, summariseStrength } from "./scoring.js";
import { generatePrompts } from "./prompts.js";
import { generateInsights } from "./insights.js";

function startingKpis(): Kpis {
  return { sales: 60, shrinkage: 35, customer: 62, engagement: 65, operations: 60 };
}

function startingHidden(): HiddenDrivers {
  return { safety_risk: 30, trust: 60, capability: 55, leadership_consistency: 50 };
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

function buildIssues(): Issue[] {
  return pickN(ISSUE_BANK, 3);
}

function buildAlerts(): Alert[] {
  return pickN(ALERT_BANK, 2).map((a) => ({
    ...a,
    id: nanoid(6),
    timestamp: Date.now(),
  }));
}

function buildDisruption(): DisruptionEvent {
  const base = pickN(DISRUPTION_BANK, 1)[0];
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

const BASELINE_WEEKS = 16;

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
  return {
    sales: plausibleSeries(74, 60, BASELINE_WEEKS, 3),
    shrinkage: plausibleSeries(24, 35, BASELINE_WEEKS, 2),
    customer: plausibleSeries(66, 62, BASELINE_WEEKS, 4),
    engagement: plausibleSeries(56, 65, BASELINE_WEEKS, 3),
    operations: plausibleSeries(63, 60, BASELINE_WEEKS, 2),
    safety_risk: plausibleSeries(18, 30, BASELINE_WEEKS, 2),
    trust: plausibleSeries(52, 60, BASELINE_WEEKS, 3),
    capability: plausibleSeries(44, 55, BASELINE_WEEKS, 3),
    leadership_consistency: plausibleSeries(60, 50, BASELINE_WEEKS, 2),
  };
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

export class Session {
  id = nanoid(10);
  code = generateCode();
  expectedTeams: number;
  phase: SessionPhase = "lobby";
  teams = new Map<string, TeamFull>();
  prompts: FacilitatorPrompt[] = [];
  usedMomentIds = new Set<string>();
  baselineTrend: TrendSeries = buildBaselineTrend();
  round?: RoundState;
  private lastBroadcastStatuses?: Map<string, ConnectionStatus>;
  roundTimer?: NodeJS.Timeout;
  disruptionTimer?: NodeJS.Timeout;
  private onUpdate: () => void;

  constructor(onUpdate: () => void, expectedTeams: number = DEFAULT_EXPECTED_TEAMS) {
    this.onUpdate = onUpdate;
    this.expectedTeams = Math.max(MIN_TEAMS, Math.min(MAX_TEAMS, Math.floor(expectedTeams)));
  }

  isFull(): boolean {
    return this.teams.size >= this.expectedTeams;
  }

  addTeam(name: string): TeamFull {
    const team: TeamFull = {
      id: nanoid(8),
      name,
      score: 0,
      lastMovement: 0,
      kpis: startingKpis(),
      hidden: startingHidden(),
      submitted: false,
      history: [],
      lastSeenAt: Date.now(),
    };
    this.teams.set(team.id, team);
    this.onUpdate();
    return team;
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

    this.round = {
      number: nextNumber,
      phase: "active",
      startedAt: now,
      endsAt: now + ROUND_DURATION_MS,
      durationMs: ROUND_DURATION_MS,
      issues: buildIssues(),
      alerts: buildAlerts(),
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
    const disruptionDelay = 60_000;
    this.disruptionTimer = setTimeout(() => this.triggerDisruption(), disruptionDelay);

    this.onUpdate();
  }

  triggerDisruption() {
    if (!this.round || this.round.phase !== "active") return;
    this.round.disruption = buildDisruption();
    this.round.phase = "disrupted";
    this.onUpdate();
  }

  submitDecision(teamId: string, input: Omit<Decision, "submittedAt">) {
    const team = this.teams.get(teamId);
    if (!team || !this.round) return;
    if (this.round.phase === "locked" || this.round.phase === "reveal") return;

    team.lastDecision = { ...input, submittedAt: Date.now() };
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
        kpis: team.kpis,
        hidden: team.hidden,
        decision,
        issues: this.round.issues,
        moment: this.round.moment,
        disruption: this.round.disruption,
      });

      const previousScore = team.score;
      team.kpis = result.nextKpis;
      team.hidden = result.nextHidden;
      team.score += result.roundScore;
      team.lastMovement = team.score - previousScore;
      team.strength = summariseStrength(team.kpis);
      team.risk = summariseRisk(team.kpis, team.hidden);
      const responseArchetype = this.round.moment && decision.momentResponseId
        ? this.round.moment.options.find((o) => o.id === decision.momentResponseId)?.archetype
        : undefined;

      team.history.push({
        round: this.round.number,
        decision,
        momentArchetype: responseArchetype,
        momentPersonaName: this.round.moment?.persona.name,
        kpiDelta: result.kpiDelta,
        hiddenDelta: result.hiddenDelta,
        kpisAfter: result.nextKpis,
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
      const trend: TrendSeries = {
        sales: [...base.sales, ...t.history.map((h) => h.kpisAfter.sales)],
        shrinkage: [...base.shrinkage, ...t.history.map((h) => h.kpisAfter.shrinkage)],
        customer: [...base.customer, ...t.history.map((h) => h.kpisAfter.customer)],
        engagement: [...base.engagement, ...t.history.map((h) => h.kpisAfter.engagement)],
        operations: [...base.operations, ...t.history.map((h) => h.kpisAfter.operations)],
        safety_risk: [...base.safety_risk, ...t.history.map((h) => h.hiddenAfter.safety_risk)],
        trust: [...base.trust, ...t.history.map((h) => h.hiddenAfter.trust)],
        capability: [...base.capability, ...t.history.map((h) => h.hiddenAfter.capability)],
        leadership_consistency: [
          ...base.leadership_consistency,
          ...t.history.map((h) => h.hiddenAfter.leadership_consistency),
        ],
      };
      return {
        id: t.id,
        name: t.name,
        score: t.score,
        lastMovement: t.lastMovement,
        kpis: t.kpis,
        lastDecision: t.lastDecision,
        lastKpiDelta: revealPhase ? lastHistory?.kpiDelta : undefined,
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
      serverNow: Date.now(),
    };
  }

  dispose() {
    if (this.roundTimer) clearTimeout(this.roundTimer);
    if (this.disruptionTimer) clearTimeout(this.disruptionTimer);
  }
}

export class SessionStore {
  private byId = new Map<string, Session>();
  private byCode = new Map<string, Session>();

  create(onUpdate: (sessionId: string) => void, expectedTeams?: number): Session {
    const session = new Session(() => onUpdate(session.id), expectedTeams);
    this.byId.set(session.id, session);
    this.byCode.set(session.code, session);
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
