export type {
  ActorMode,
  TrustEngineSnapshot,
  TrustTimelineEvent,
  TrustScenarioPayload,
  TrustEvent,
  LedgerEntry,
  ExplainTrustResult,
  TrustReport,
  TrustEventRecord,
  EngineResult,
  SimulateOptions,
  SimulateResult,
} from "./types";

export { calculateTrustScore } from "./calculateTrustScore";
export { calculateGamifiedTrustScore, type GamifiedTrustBreakdown } from "./gamifiedProfileTrustScore";
export { buildTrustTimeline } from "./buildTrustTimeline";
export { explainTrustScore } from "./explainTrustScore";
export { generateTrustReport } from "./generateTrustReport";
export { recomputeWithoutReference } from "./recomputeWithoutReference";
export { calculateReferenceCredibility } from "./referenceCredibility";
export type { ReferenceCredibilityInput } from "./referenceCredibility";

/** Canonical production trust engine + service */
export {
  calculateTrust,
  loadTrustTimeline,
  type TrustCalculationResult,
  type TrustTimelineEntry,
  type TrustBand,
} from "./trustEngine";
export {
  buildTrustExplanation,
  buildTrustBadges,
  type TrustExplanationLine,
  type TrustBadge,
} from "./trustExplanation";
export { getTrustProfile, type TrustProfileResponse } from "./trustService";
