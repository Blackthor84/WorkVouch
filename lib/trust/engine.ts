import {
  type TrustState,
  TrustScenarioPayload,
  TrustEvent,
  LedgerEntry,
  INDUSTRY_PROFILES,
  THRESHOLDS,
  EngineActionType,
  TrustEventRecord,
  ENGINE_VERSION,
  EngineResult,
  EngineDecision,
  EngineExplanation,
  SimulateOptions,
  SimulateResult,
  type TrustEngineDiffSnapshot,
  type TrustEngineChangeDiff,
} from "./types";
import { hashForAudit } from "./hash";

const INITIAL_STATE: TrustState = {
  trustScore: 50,
  profileStrength: 50,
  confidenceScore: 0,
  events: [],
  ledger: [],
  currentDay: 0,
  employerMode: "enterprise",
  industry: "healthcare",
  threshold: 60,
  view: "employer",
  peerGraph: {
    userA: [{ peerId: "userB", strength: 0.8 }],
    userB: [{ peerId: "userA", strength: 0.8 }],
  },
  lastScenario: null,
  lastRunResult: null,
  timeFrozen: false,
  actorMode: "admin",
};

let state: TrustState = { ...INITIAL_STATE };
let eventLog: TrustEventRecord[] = [];
let previousSnapshot: TrustEngineDiffSnapshot | null = null;
const listeners: Array<() => void> = [];

function snapshotForDiff(s: TrustState): TrustEngineDiffSnapshot {
  const threshold = THRESHOLDS[s.employerMode];
  const passes = s.trustScore >= threshold;
  const hiringLikelihood = passes ? 100 : Math.round((s.trustScore / threshold) * 100);
  const hasFraud = s.ledger.some((e) => e.action.startsWith("FRAUD"));
  const riskFlagCount = s.ledger.filter((e) => e.delta < 0).length + (hasFraud ? 1 : 0);
  const networkImpactCount = s.events.length;
  return {
    trustScore: s.trustScore,
    confidenceScore: s.confidenceScore,
    hiringLikelihood,
    riskFlagCount,
    networkImpactCount,
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/** Layer 3 — Network stability factor. Trust cannot rise faster than network credibility; isolated users capped. */
function networkStabilityFactor(
  peerGraph: Record<string, { peerId: string; strength: number }[]>,
  userId: string
): number {
  const peers = peerGraph[userId] ?? [];
  if (peers.length === 0) return 0.3; // isolated cap
  const weighted =
    peers.reduce((sum, p) => sum + p.strength, 0) / Math.max(peers.length, 1);
  return Math.min(1.5, 0.3 + weighted * 0.8);
}

function graphTrustBoost(
  peerGraph: Record<string, { peerId: string; strength: number }[]>,
  userId: string
): number {
  const peers = peerGraph[userId] ?? [];
  const weighted =
    peers.reduce((sum, p) => sum + p.strength, 0) / Math.max(peers.length, 1);
  return Math.round(weighted * 10);
}

/** Layer 3 — effectiveTrust = baseTrust × networkStabilityFactor; isolated users have capped confidence. */
const ISOLATED_CONFIDENCE_CAP = 50;

function computeConfidence(s: TrustState): number {
  const evidenceWeight = Math.min(s.events.length / 6, 1);
  const stabilityWeight = Math.min(s.currentDay / 90, 1);
  const graphBoost = graphTrustBoost(s.peerGraph, "userA");
  const stability = networkStabilityFactor(s.peerGraph, "userA");
  const raw = (s.trustScore + graphBoost) * evidenceWeight * stabilityWeight * stability;
  const peers = s.peerGraph["userA"] ?? [];
  const capped =
    peers.length === 0
      ? Math.min(ISOLATED_CONFIDENCE_CAP, Math.round(raw))
      : Math.round(raw);
  return Math.min(100, Math.max(0, capped));
}

function applyDecay(s: TrustState, days: number): TrustState {
  let next = { ...s };
  for (let d = 0; d < days; d++) {
    next.currentDay = next.currentDay + 1;
    const recentSignal = next.events.some(
      (e) => e.type === "verification" && next.currentDay - e.day < 30
    );
    if (!recentSignal) {
      let decay = 0;
      if (next.currentDay > 30) decay = 0.15;
      if (next.currentDay > 90) decay = 0.4;
      next.trustScore = Math.max(0, next.trustScore - decay);
    }
    next.confidenceScore = computeConfidence(next);
  }
  return next;
}

function reduce(state: TrustState, action: EngineActionType): TrustState {
  const s = { ...state };

  switch (action.type) {
    case "tick": {
      if (s.timeFrozen) return s;
      const days = "days" in action && typeof action.days === "number" ? Math.max(1, action.days) : 1;
      const next = applyDecay(s, days);
      return next;
    }
    case "freeze":
      s.timeFrozen = true;
      return s;
    case "resume":
      s.timeFrozen = false;
      return s;

    case "runScenario": {
      const payload = action.payload;
      if (!payload?.after) return s;

      const profile = INDUSTRY_PROFILES[s.industry];
      const stability = networkStabilityFactor(s.peerGraph, "userA");
      const afterTrust = payload.after.trustScore ?? 50;
      const afterProfile = payload.after.profileStrength ?? 50;
      const rawDelta = (afterTrust - s.trustScore) * profile.verificationWeight;
      const cappedDelta = rawDelta * stability; // trust cannot rise faster than network credibility
      const newTrust = Math.min(100, Math.max(0, s.trustScore + cappedDelta));

      s.trustScore = newTrust;
      s.profileStrength = afterProfile;

      const newEvents: TrustEvent[] = (payload.events ?? []).map((e) => ({
        day: s.currentDay,
        type: e.type ?? "event",
        message: e.message ?? "",
        impact: typeof e.impact === "number" ? e.impact : 0,
        scenarioId: payload.scenarioId,
      }));
      s.events = [...s.events, ...newEvents];

      const entry: LedgerEntry = {
        day: s.currentDay,
        action: payload.title ?? "scenario",
        actor: s.actorMode,
        delta: Math.round(cappedDelta),
        snapshot: { trustScore: newTrust, profileStrength: afterProfile },
      };
      s.ledger = [...s.ledger, entry];
      s.lastScenario = payload;
      s.lastRunResult = payload;
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    case "triggerFraud": {
      const newTrust = Math.max(0, s.trustScore - 45);
      const newProfile = Math.max(0, s.profileStrength - 35);
      s.trustScore = newTrust;
      s.profileStrength = newProfile;
      s.events = s.events.filter((e) => e.type !== "verification");

      const entry: LedgerEntry = {
        day: s.currentDay,
        action: "FRAUD: " + action.reason,
        actor: s.actorMode,
        delta: -45,
        snapshot: { trustScore: newTrust, profileStrength: newProfile },
      };
      s.ledger = [...s.ledger, entry];

      const edges = s.peerGraph["userA"] ?? [];
      edges.forEach((edge) => {
        const penalty = Math.round(edge.strength * 20);
        s.trustScore = Math.max(0, s.trustScore - penalty);
        s.ledger = [
          ...s.ledger,
          {
            day: s.currentDay,
            action: "Contagion from userA",
            actor: s.actorMode,
            delta: -penalty,
            snapshot: {
              trustScore: s.trustScore,
              profileStrength: s.profileStrength,
            },
          },
        ];
      });
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    case "setIndustry":
      s.industry = action.industry;
      return s;
    case "setEmployerMode":
      s.employerMode = action.mode;
      return s;
    case "setThreshold":
      s.threshold = action.value;
      return s;
    case "setView":
      s.view = action.view;
      return s;
    case "setActorMode":
      s.actorMode = action.actor;
      return s;

    case "employerReview": {
      if (s.actorMode !== "employer") return s;
      const profile = INDUSTRY_PROFILES[s.industry];
      const delta = action.kind === "positive"
        ? Math.round(10 * profile.verificationWeight)
        : -Math.round(15 * profile.fraudPenalty);
      const newTrust = Math.min(100, Math.max(0, s.trustScore + delta));
      s.trustScore = newTrust;
      s.events = [...s.events, {
        day: s.currentDay,
        type: "employer_review",
        message: action.kind === "positive" ? "Positive employer review" : "Negative employer review",
        impact: delta,
      }];
      s.ledger = [...s.ledger, {
        day: s.currentDay,
        action: `employerReview:${action.kind}`,
        actor: "employer",
        delta,
        snapshot: { trustScore: newTrust, profileStrength: s.profileStrength },
        reason: action.reason,
      }];
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    case "flagInconsistency": {
      if (s.actorMode !== "employer") return s;
      const profile = INDUSTRY_PROFILES[s.industry];
      const delta = -Math.round(12 * profile.fraudPenalty);
      const newTrust = Math.min(100, Math.max(0, s.trustScore + delta));
      s.trustScore = newTrust;
      s.events = [...s.events, {
        day: s.currentDay,
        type: "flag_inconsistency",
        message: "Inconsistency flagged by employer",
        impact: delta,
      }];
      s.ledger = [...s.ledger, {
        day: s.currentDay,
        action: "flagInconsistency",
        actor: "employer",
        delta,
        snapshot: { trustScore: newTrust, profileStrength: s.profileStrength },
        reason: action.reason,
      }];
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    case "retractEmployerReview": {
      if (s.actorMode !== "employer") return s;
      const delta = 5;
      const newTrust = Math.min(100, Math.max(0, s.trustScore + delta));
      s.trustScore = newTrust;
      s.events = [...s.events, {
        day: s.currentDay,
        type: "retract_review",
        message: "Employer review retracted",
        impact: delta,
      }];
      s.ledger = [...s.ledger, {
        day: s.currentDay,
        action: "retractEmployerReview",
        actor: "employer",
        delta,
        snapshot: { trustScore: newTrust, profileStrength: s.profileStrength },
      }];
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    case "employerAbusePattern": {
      if (s.actorMode !== "employer") return s;
      const profile = INDUSTRY_PROFILES[s.industry];
      const severityMultiplier = action.severity === "high" ? 1.5 : action.severity === "medium" ? 1.2 : 1;
      const delta = -Math.round(20 * profile.fraudPenalty * severityMultiplier);
      const newTrust = Math.min(100, Math.max(0, s.trustScore + delta));
      s.trustScore = newTrust;
      s.events = [...s.events, {
        day: s.currentDay,
        type: "employer_abuse_pattern",
        message: `Abuse pattern (${action.severity})`,
        impact: delta,
      }];
      s.ledger = [...s.ledger, {
        day: s.currentDay,
        action: `employerAbusePattern:${action.severity}`,
        actor: "employer",
        delta,
        snapshot: { trustScore: newTrust, profileStrength: s.profileStrength },
      }];
      s.confidenceScore = computeConfidence(s);
      return s;
    }

    default:
      return s;
  }
}

function recordEvent(
  action: EngineActionType,
  resultingState: TrustState,
  userId: string | null
): TrustEventRecord {
  const payload = deepClone(action);
  const payloadHash = hashForAudit(payload);
  const resultingStateHash = hashForAudit({
    trustScore: resultingState.trustScore,
    profileStrength: resultingState.profileStrength,
    currentDay: resultingState.currentDay,
    ledgerLength: resultingState.ledger.length,
  });
  return {
    id: crypto.randomUUID(),
    engineVersion: ENGINE_VERSION,
    userId,
    actionType: action.type,
    payload,
    payloadHash,
    resultingStateHash,
    createdAt: new Date().toISOString(),
  };
}

/** Layer 1 — Rebuild state by replaying events from index `from` to end. */
export function replay(from = 0): TrustState {
  let s = deepClone(INITIAL_STATE);
  for (let i = from; i < eventLog.length; i++) {
    const rec = eventLog[i];
    const action = rec.payload as EngineActionType;
    s = reduce(s, action);
  }
  return s;
}

/** Layer 1 — Hydrate engine from persisted event log. Rebuilds state by replay. */
export function hydrate(events: TrustEventRecord[], userId: string | null = null): void {
  eventLog = events;
  state = replay(0);
  previousSnapshot = null;
  emit();
}

/** Layer 1 — Return full event log for persistence / audit. */
export function getEventLog(): TrustEventRecord[] {
  return [...eventLog];
}

export function getState(): TrustState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

const defaultUserId: string | null = null;

export function engineAction(action: EngineActionType, userId: string | null = defaultUserId): void {
  previousSnapshot = snapshotForDiff(state);
  state = reduce(state, action);
  const record = recordEvent(action, state, userId);
  eventLog.push(record);
  emit();
}

/** Layer 2 — Advance time by N days (no-op if frozen). */
export function tick(days: number): void {
  engineAction({ type: "tick", days });
}

/** Layer 2 — Advance time by N days in one step (same as tick(days)). */
export function fastForward(days: number): void {
  engineAction({ type: "tick", days });
}

/** Layer 2 — Pause time (tick/fastForward no-op until resume). */
export function freeze(): void {
  engineAction({ type: "freeze" });
}

/** Layer 2 — Resume time. */
export function resume(): void {
  engineAction({ type: "resume" });
}

/** Layer 5 — Build EngineResult with decision and explanation; every result is auditable. */
export function getEngineResult(): EngineResult {
  const s = state;
  const threshold = THRESHOLDS[s.employerMode];
  const profile = INDUSTRY_PROFILES[s.industry];
  const passes = s.trustScore >= threshold;
  const confidenceOk = s.confidenceScore >= profile.minConfidence;
  const hasFraud = s.ledger.some((e) => e.action.startsWith("FRAUD"));

  let decision: EngineDecision = "REVIEW";
  if (passes && confidenceOk && !hasFraud) decision = "PASS";
  else if (!passes || hasFraud) decision = "FAIL";

  const auditTraceIds = eventLog.slice(-20).map((e) => e.id);

  const primaryFactors: string[] = [
    `Trust score: ${s.trustScore} (threshold: ${threshold})`,
    `Confidence: ${s.confidenceScore} (industry min: ${profile.minConfidence})`,
    `Verified signals: ${s.events.length}`,
  ];
  if (hasFraud) primaryFactors.push("Fraud or dispute on record");

  const counterfactuals: string[] = [];
  if (!passes)
    counterfactuals.push(
      `Adding ${threshold - s.trustScore} trust points would meet employer threshold.`
    );
  if (s.confidenceScore < profile.minConfidence)
    counterfactuals.push(
      `Raising confidence by ${profile.minConfidence - s.confidenceScore} would meet industry bar.`
    );

  const requiredToImprove = [
    "Add coworker verification",
    "Maintain activity over 30 days",
    "Avoid disputes",
  ];

  const explanation: EngineExplanation = {
    primaryFactors,
    counterfactuals,
    requiredToImprove,
    auditTraceIds,
  };

  return {
    decision,
    explanation,
    stateSnapshot: {
      trustScore: s.trustScore,
      profileStrength: s.profileStrength,
      confidenceScore: s.confidenceScore,
      currentDay: s.currentDay,
    },
    thresholdUsed: threshold,
    industry: s.industry,
  };
}

export function getDerived() {
  const s = state;
  const passesEmployer = s.trustScore >= THRESHOLDS[s.employerMode];
  const profile = INDUSTRY_PROFILES[s.industry];
  const hasFraud = s.ledger.some((e) => e.action.startsWith("FRAUD"));

  const explainScore = () => ({
    reason:
      s.confidenceScore < 50
        ? "Insufficient recent verification"
        : "Sustained trust with multiple independent signals",
    improveBy: [
      "Add coworker verification",
      "Maintain activity over 30 days",
      "Avoid disputes",
    ],
  });

  const simulateOutcomes = (iterations = 100) => {
    let passes = 0;
    for (let i = 0; i < iterations; i++) {
      const noise = Math.random() * 10 - 5;
      if (s.trustScore + noise >= THRESHOLDS[s.employerMode]) passes++;
    }
    return Math.round((passes / iterations) * 100);
  };

  const generateEmployerExplanation = () =>
    `Candidate Evaluation Summary (${s.industry.toUpperCase()}):

• Trust Score: ${s.trustScore}
• Confidence Score: ${s.confidenceScore}
• Network Credibility: ${s.events.length} verified signals
• Industry Threshold: ${profile.minConfidence}

Assessment:
${
  s.confidenceScore >= profile.minConfidence
    ? "Candidate demonstrates sustained, verifiable trust with low risk indicators."
    : "Candidate lacks sufficient recent or network-backed verification."
}

Risk Factors:
${hasFraud ? "Previous disputes detected." : "No fraud signals detected."}

Recommendation:
${
  s.confidenceScore >= profile.minConfidence
    ? "Proceed with hiring."
    : "Request additional verification."
}
`;

  const peerCount = Object.keys(s.peerGraph).reduce((n, k) => n + (s.peerGraph[k]?.length ?? 0), 0);
  const totalEdges = peerCount;
  const verificationEvents = s.events.filter((e) => e.type === "verification").length;
  const negativeLedger = s.ledger.filter((e) => e.delta < 0).length;
  const employerReviewLedger = s.ledger.filter((e) => e.action.includes("employerReview") || e.action.includes("flag") || e.action.includes("Abuse")).length;

  const cultureFitScore = Math.min(100, Math.max(0, Math.round(
    s.profileStrength * 0.5 + (verificationEvents / Math.max(s.events.length, 1)) * 30 + (s.trustScore * 0.2)
  )));
  const signalFreshness = s.events.length === 0 ? 0 : Math.min(100, Math.max(0, Math.round(100 - (s.currentDay - (s.events[s.events.length - 1]?.day ?? 0)) * 0.5)));
  const reviewerCredibility = employerReviewLedger === 0 ? 50 : Math.min(100, Math.max(0, 50 + (s.ledger.filter((e) => e.delta > 0 && e.actor === "employer").length * 5) - (negativeLedger * 3)));
  const consistencyScore = s.ledger.length < 2 ? 50 : Math.min(100, Math.max(0, 50 + 10 * (s.ledger.length - negativeLedger) - 5 * negativeLedger));
  const networkCentrality = totalEdges === 0 ? 0 : Math.min(100, Math.round((totalEdges / 10) * 50 + (peerCount > 0 ? 25 : 0)));
  const fraudProbability = hasFraud ? 85 : negativeLedger >= 2 ? 40 : negativeLedger >= 1 ? 20 : s.trustScore < 40 ? 15 : 5;

  const after = snapshotForDiff(s);
  const changeDiff: TrustEngineChangeDiff | null =
    previousSnapshot === null
      ? null
      : {
          trustScore: { before: previousSnapshot.trustScore, after: after.trustScore, delta: after.trustScore - previousSnapshot.trustScore },
          confidenceScore: { before: previousSnapshot.confidenceScore, after: after.confidenceScore, delta: after.confidenceScore - previousSnapshot.confidenceScore },
          hiringLikelihood: { before: previousSnapshot.hiringLikelihood, after: after.hiringLikelihood, delta: after.hiringLikelihood - previousSnapshot.hiringLikelihood },
          riskFlagCount: { before: previousSnapshot.riskFlagCount, after: after.riskFlagCount, delta: after.riskFlagCount - previousSnapshot.riskFlagCount },
          networkImpactCount: { before: previousSnapshot.networkImpactCount, after: after.networkImpactCount, delta: after.networkImpactCount - previousSnapshot.networkImpactCount },
        };

  return {
    passesEmployer,
    explainScore,
    simulateOutcomes,
    generateEmployerExplanation,
    cultureFitScore,
    signalFreshness,
    reviewerCredibility,
    consistencyScore,
    networkCentrality,
    fraudProbability,
    changeDiff,
  };
}

/** Layer 4 — Multiverse simulation. Returns confidence interval, worst/best case, P(false positive). */
export function simulate(options: SimulateOptions): SimulateResult {
  const runs = options.runs ?? 1000;
  const noiseModel = options.noiseModel ?? "uniform";
  const profile = INDUSTRY_PROFILES[state.industry];
  const threshold = THRESHOLDS[state.employerMode];
  const industryWeight = noiseModel === "industry-weighted" ? profile.fraudPenalty : 1;

  const passRates: number[] = [];
  const trustOutcomes: number[] = [];
  const auditTraceIds: string[] = [];

  for (let i = 0; i < runs; i++) {
    const noise = (Math.random() * 10 - 5) * industryWeight;
    const trust = state.trustScore + noise;
    trustOutcomes.push(trust);
    passRates.push(trust >= threshold ? 1 : 0);
  }

  const sorted = [...trustOutcomes].sort((a, b) => a - b);
  const lowIdx = Math.floor(runs * 0.05);
  const highIdx = Math.floor(runs * 0.95);
  const worstCaseOutcome = sorted[0] ?? 0;
  const bestCaseOutcome = sorted[sorted.length - 1] ?? 0;
  const sortedPass = [...passRates].sort((a, b) => a - b);
  const intervalLow = sortedPass[lowIdx] ?? 0;
  const intervalHigh = sortedPass[highIdx] ?? 1;
  const passRate = passRates.reduce((a, b) => a + b, 0) / runs;

  const probabilityFalsePositive = state.trustScore < threshold ? passRate : 0;
  const probabilityFalseNegative = state.trustScore >= threshold ? 1 - passRate : 0;

  const simId = crypto.randomUUID();
  auditTraceIds.push(simId);

  return {
    confidenceInterval: { low: Math.round(intervalLow * 100), high: Math.round(intervalHigh * 100) },
    worstCaseOutcome,
    bestCaseOutcome,
    probabilityFalsePositive,
    probabilityFalseNegative,
    runs,
    auditTraceIds,
  };
}

export function resetEngine(): void {
  state = deepClone(INITIAL_STATE);
  eventLog = [];
  previousSnapshot = null;
  emit();
}
