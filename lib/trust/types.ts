import type { Industry } from "@/lib/industries";

/** Single scenario format for the Trust Engine. */
export type TrustScenarioPayload = {
  scenarioId: string;
  title: string;
  summary: string;
  before: Record<string, number>;
  after: Record<string, number>;
  events: { type: string; message: string; impact?: number }[];
  warnings?: string[];
};

export type TrustEvent = {
  day: number;
  type: string;
  message: string;
  impact: number;
  scenarioId?: string;
};

export type ActorMode = "admin" | "employer" | "worker";

export type LedgerEntry = {
  day: number;
  action: string;
  actor: ActorMode;
  delta: number;
  snapshot: { trustScore: number; profileStrength: number };
  reason?: string;
};

export type PeerEdge = { peerId: string; strength: number };

export type TrustState = {
  trustScore: number;
  profileStrength: number;
  confidenceScore: number;
  events: TrustEvent[];
  ledger: LedgerEntry[];
  currentDay: number;
  employerMode: "smb" | "mid" | "enterprise";
  industry: keyof typeof INDUSTRY_PROFILES;
  threshold: number;
  view: "employer" | "candidate";
  peerGraph: Record<string, PeerEdge[]>;
  lastScenario: TrustScenarioPayload | null;
  lastRunResult: TrustScenarioPayload | null;
  /** Layer 2: time frozen when true; tick/fastForward no-op */
  timeFrozen: boolean;
  actorMode: ActorMode;
};

/** Layer 1 — Event-sourced persistence. Engine never saves state; only appends events; rebuilds by replay. */
export type TrustEventRecord = {
  id: string;
  engineVersion: string;
  userId: string | null;
  actionType: string;
  payload: unknown;
  payloadHash: string;
  resultingStateHash: string;
  createdAt: string; // ISO
};

export const ENGINE_VERSION = "1.0.0";

export const THRESHOLDS = { smb: 60, mid: 75, enterprise: 90 } as const;

export const INDUSTRY_PROFILES: Record<
  Industry,
  { verificationWeight: number; fraudPenalty: number; decayRate: number; minConfidence: number }
> = {
  retail: {
    verificationWeight: 1.0,
    fraudPenalty: 1.0,
    decayRate: 1.0,
    minConfidence: 60,
  },
  education: {
    verificationWeight: 1.3,
    fraudPenalty: 1.6,
    decayRate: 1.2,
    minConfidence: 75,
  },
  law_enforcement: {
    verificationWeight: 1.7,
    fraudPenalty: 2.5,
    decayRate: 1.4,
    minConfidence: 90,
  },
  security: {
    verificationWeight: 1.6,
    fraudPenalty: 2.2,
    decayRate: 1.4,
    minConfidence: 90,
  },
  warehouse_logistics: {
    verificationWeight: 1.1,
    fraudPenalty: 1.2,
    decayRate: 1.05,
    minConfidence: 65,
  },
  healthcare: {
    verificationWeight: 1.5,
    fraudPenalty: 2.0,
    decayRate: 1.3,
    minConfidence: 85,
  },
  hospitality: {
    verificationWeight: 1.05,
    fraudPenalty: 1.1,
    decayRate: 1.0,
    minConfidence: 60,
  },
  skilled_trades: {
    verificationWeight: 1.2,
    fraudPenalty: 1.4,
    decayRate: 1.1,
    minConfidence: 70,
  },
  construction: {
    verificationWeight: 1.2,
    fraudPenalty: 1.5,
    decayRate: 1.1,
    minConfidence: 75,
  },
};

export type EngineActionType =
  | { type: "runScenario"; payload: TrustScenarioPayload }
  | { type: "triggerFraud"; reason: string }
  | { type: "setIndustry"; industry: keyof typeof INDUSTRY_PROFILES }
  | { type: "setEmployerMode"; mode: "smb" | "mid" | "enterprise" }
  | { type: "setThreshold"; value: number }
  | { type: "setView"; view: "employer" | "candidate" }
  | { type: "setActorMode"; actor: ActorMode }
  | { type: "employerReview"; kind: "positive" | "negative"; reason: string }
  | { type: "flagInconsistency"; reason: string }
  | { type: "retractEmployerReview" }
  | { type: "employerAbusePattern"; severity: "low" | "medium" | "high" }
  | { type: "tick" }
  | { type: "tick"; days: number }
  | { type: "freeze" }
  | { type: "resume" };

export type EngineAction = (action: EngineActionType) => void;

/** Layer 5 — Explainability as law. Every engine result carries this. */
export type EngineDecision = "PASS" | "FAIL" | "REVIEW";

export type EngineExplanation = {
  primaryFactors: string[];
  counterfactuals: string[];
  requiredToImprove: string[];
  auditTraceIds: string[];
};

export type EngineResult = {
  decision: EngineDecision;
  explanation: EngineExplanation;
  /** Snapshot at decision time for audit */
  stateSnapshot: { trustScore: number; profileStrength: number; confidenceScore: number; currentDay: number };
  thresholdUsed: number;
  industry: string;
}

/** Layer 4 — Multiverse simulation options */
export type SimulateNoiseModel = "uniform" | "industry-weighted";

export type SimulateOptions = {
  runs: number;
  noiseModel?: SimulateNoiseModel;
  fraudProbabilityCurve?: (day: number) => number;
  verificationArrivalRate?: number; // events per day
};

export type SimulateResult = {
  confidenceInterval: { low: number; high: number }; // % pass rate
  worstCaseOutcome: number; // min trust over runs
  bestCaseOutcome: number; // max trust over runs
  probabilityFalsePositive: number; // P(pass when should fail)
  probabilityFalseNegative: number; // P(fail when should pass)
  runs: number;
  auditTraceIds: string[];
};

/** Snapshot used only for change-diff (before/after each action). */
export type TrustEngineDiffSnapshot = {
  trustScore: number;
  confidenceScore: number;
  hiringLikelihood: number;
  riskFlagCount: number;
  networkImpactCount: number;
};

/** Before/after + delta for one metric. */
export type TrustEngineChangeMetric = {
  before: number;
  after: number;
  delta: number;
};

/** Change diff computed from previous snapshot vs current state (derived only). */
export type TrustEngineChangeDiff = {
  trustScore: TrustEngineChangeMetric;
  confidenceScore: TrustEngineChangeMetric;
  hiringLikelihood: TrustEngineChangeMetric;
  riskFlagCount: TrustEngineChangeMetric;
  networkImpactCount: TrustEngineChangeMetric;
};

/** Engine snapshot as single source of truth for explain and report APIs. */
export type TrustEngineSnapshot = {
  trustScore: number;
  profileStrength: number;
  confidenceScore: number;
  industry: keyof typeof INDUSTRY_PROFILES;
  employerMode: keyof typeof THRESHOLDS;
  actorMode: ActorMode;
  events: TrustEvent[];
  ledger: LedgerEntry[];
};

/** Result of explainTrustScore(snapshot). */
export type ExplainTrustResult = {
  trustScore: number;
  topFactors: string[];
  riskFactors: string[];
  confidence: number;
};

/** Timeline/history event for slider and report (not full engine snapshot). */
export type TrustTimelineEvent = {
  id: string;
  trustScore: number;
  reason: string;
  timestamp?: number;
  type?: string;
  message?: string;
  impact?: number;
};

/** Exportable trust report (enterprise). */
export type TrustReport = {
  trustScore: number;
  strengths: string[];
  risks: string[];
  timeline: TrustTimelineEvent[];
  disclaimer: string;
};

// ——— Playground / simulation (review-based, immutable) ———
export type ReviewSource = "peer" | "supervisor" | "manager" | "synthetic" | "self" | "external";

export interface Review {
  id: string;
  source: ReviewSource;
  weight: number;
  timestamp: number;
  [key: string]: unknown;
}

export interface TrustSnapshot {
  trustScore: number;
  confidenceScore: number;
  networkStrength: number;
  reviews: Review[];
}

/** Metadata attached to a snapshot for audit and replay. */
export interface SnapshotMetadata {
  actionType?: string;
  actor?: string;
  universeId?: string | null;
  notes?: string;
}

/** Per-factor breakdown for Lab UI and audit. No personality labels. */
export interface HumanFactorFactor {
  name: string;
  explanation: string;
  signalsContributed: string[];
  effectsApplied: string[];
  proxy: number;
}

/** Modifiers from human factors; applied in engines. Auditable. */
export interface HumanFactorModifiers {
  confidenceStabilityMultiplier: number;
  decayReductionMultiplier: number;
  fragilityAdjustment: number;
  riskVolatilityReduction: number;
  complianceRiskMultiplier: number;
  trustDebtMultiplier: number;
  blastRadiusMultiplier: number;
  productivityMultiplier: number;
}

/** Human factor insights: interpretive only, from observable signals. No personality labels. */
export interface HumanFactorInsights {
  factors: HumanFactorFactor[];
  modifiers: HumanFactorModifiers;
  audit: {
    relationalTrustProxy: number;
    collaborationStabilityProxy: number;
    ethicalFrictionProxy: number;
    socialGravityProxy: number;
    workplaceFrictionIndex: number;
    contributingReviewIds: string[];
  };
  insights: string[];
}

/** Keys of T whose values are number. Use for iterating numeric fields only. */
export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

/** Engine outputs from reducer pipeline; every snapshot has these after applyDelta. */
export interface EngineOutputs {
  trustScore: number;
  confidenceScore: number;
  riskScore: number;
  fragilityScore: number;
  trustDebt: number;
  complianceScore: number;
  cultureImpactScore: number;
  humanFactorInsights?: HumanFactorInsights;
}

/** Point-in-time simulation state. UI consumes Snapshots; history is Snapshot[]. */
export interface Snapshot {
  timestamp: number;
  reviews: Review[];
  trustScore: number;
  confidenceScore: number;
  networkStrength: number;
  /** Optional audit metadata (action type, actor, universe). */
  metadata?: SnapshotMetadata;
  /** Set by reducer; all engines run, no skip. */
  engineOutputs?: EngineOutputs;
}

/** Intent/modifier flags — engine-level: modify weights, timing, decay. */
export interface IntentModifiers {
  humanErrorRate?: number;
  intentBias?: number;
  decayMultiplier?: number;
  supervisorWeightOverride?: number;
  [key: string]: number | boolean | string | undefined;
}

/** Changes applied to a Snapshot to produce the next Snapshot. Never push deltas into history. */
export type SimulationDelta = {
  timestamp?: number;
  addedReviews?: Review[];
  removedReviewIds?: string[];
  thresholdOverride?: number;
  /** Override computed score for display/decision (lab only). */
  scoreOverride?: number;
  /** Intent/fragility modifiers. */
  intentModifiers?: IntentModifiers;
  /** Audit notes for this delta. */
  notes?: string;
  /** Pass-through metadata for resulting snapshot. */
  metadata?: SnapshotMetadata;
};
