/**
 * Enterprise intelligence (silent). All behind feature flags.
 * No UI exposure; compute only when flags enabled.
 */

export {
  calculateRiskSnapshot,
  type RiskSnapshot,
  type RiskSnapshotInput,
  type VerifiedJob,
  type DisputeRecord,
  type ReferenceResponse,
  type TenureEntry,
} from "./riskEngine";

export { persistRiskSnapshot, type PersistRiskSnapshotParams } from "./persistRiskSnapshot";

export {
  calculateNetworkDensity,
  detectSuspiciousClusters,
  calculateReferenceVelocity,
  type NetworkInput,
  type ReferenceEdge,
} from "./networkMetrics";

export {
  calculateTrustScore,
  calculateCareerStability,
  calculateNetworkDensityScore,
  calculateRehireProbability,
  calculateRiskSnapshotForProfile,
  calculateEmployerWorkforceRisk,
  triggerProfileIntelligence,
  triggerEmployerIntelligence,
} from "./engines";

export { getIndustryBaseline, safeRatio, type IndustryBaseline } from "./baselines";
