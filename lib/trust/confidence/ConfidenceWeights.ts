import type { ConfidenceFactorId } from "./types";

/** Factor weights — presentation layer only; does not alter Trust Engine scoring. */
export const CONFIDENCE_WEIGHTS: Record<ConfidenceFactorId, number> = {
  trust_score: 0.18,
  employment_verification: 0.15,
  manager_verification: 0.12,
  coworker_verification: 0.1,
  reference_consensus: 0.12,
  timeline_consistency: 0.1,
  identity_verification: 0.05,
  workflow_completion: 0.08,
  data_freshness: 0.05,
  missing_information: 0.03,
  risk_signals: 0.02,
};

export const CONFIDENCE_FACTOR_LABELS: Record<ConfidenceFactorId, string> = {
  trust_score: "Trust Score",
  employment_verification: "Employment Verified",
  manager_verification: "Manager Verification",
  coworker_verification: "Coworker Verification",
  reference_consensus: "Reference Consensus",
  timeline_consistency: "Timeline Consistency",
  identity_verification: "Identity Verification",
  workflow_completion: "Workflow Completion",
  data_freshness: "Data Freshness",
  missing_information: "Missing Information",
  risk_signals: "Risk Signals",
};
