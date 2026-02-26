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

export type ActorMode = "employee" | "employer" | "system";

export type LedgerEntry = {
  day: number;
  action: string;
  actor: ActorMode;
  delta: number;
  snapshot: { trustScore: number; profileStrength: number };
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

export const INDUSTRY_PROFILES = {
  healthcare: {
    verificationWeight: 1.5,
    fraudPenalty: 2.0,
    decayRate: 1.3,
    minConfidence: 85,
  },
  construction: {
    verificationWeight: 1.2,
    fraudPenalty: 1.5,
    decayRate: 1.1,
    minConfidence: 75,
  },
  retail: {
    verificationWeight: 1.0,
    fraudPenalty: 1.0,
    decayRate: 1.0,
    minConfidence: 60,
  },
  security: {
    verificationWeight: 1.6,
    fraudPenalty: 2.2,
    decayRate: 1.4,
    minConfidence: 90,
  },
} as const;

export type EngineActionType =
  | { type: "runScenario"; payload: TrustScenarioPayload }
  | { type: "triggerFraud"; reason: string }
  | { type: "setIndustry"; industry: keyof typeof INDUSTRY_PROFILES }
  | { type: "setEmployerMode"; mode: "smb" | "mid" | "enterprise" }
  | { type: "setThreshold"; value: number }
  | { type: "setView"; view: "employer" | "candidate" }
  | { type: "setActorMode"; actor: ActorMode }
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
