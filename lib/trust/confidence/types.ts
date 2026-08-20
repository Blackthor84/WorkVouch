/** Canonical factor identifiers for hiring confidence aggregation. */
export type ConfidenceFactorId =
  | "trust_score"
  | "employment_verification"
  | "manager_verification"
  | "coworker_verification"
  | "reference_consensus"
  | "timeline_consistency"
  | "identity_verification"
  | "workflow_completion"
  | "data_freshness"
  | "missing_information"
  | "risk_signals";

export type ConfidenceFactorStatus = "positive" | "neutral" | "negative" | "missing";

export type ConfidenceLevel =
  | "high"
  | "strong"
  | "moderate"
  | "needs_review"
  | "low";

export type ConfidenceRecommendation =
  | "ready_to_hire"
  | "ready_for_final_review"
  | "ready_to_interview"
  | "needs_additional_verification"
  | "needs_additional_references"
  | "requires_manual_review";

export interface ConfidenceFactor {
  id: ConfidenceFactorId;
  label: string;
  weight: number;
  contribution: number;
  confidence: number;
  status: ConfidenceFactorStatus;
  explanation?: string;
}

export interface ConfidenceTimelinePoint {
  id: string;
  label: string;
  confidenceScore: number;
  occurredAt?: string;
  delta?: number;
}

export interface ConfidenceBadge {
  id: string;
  label: string;
  earned: boolean;
}

export interface HiringConfidenceResult {
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  confidenceLevelLabel: string;
  starRating: number;
  confidenceFactors: ConfidenceFactor[];
  confidenceTimeline: ConfidenceTimelinePoint[];
  confidenceBadges: ConfidenceBadge[];
  confidenceExplanation: string[];
  recommendation: ConfidenceRecommendation;
  recommendationLabel: string;
  trustScore: number | null;
  calculatedAt: string;
}

export interface ConfidenceInput {
  profileId?: string;
  trustScore: number | null;
  verifiedEmploymentCount: number;
  employmentVerified: boolean;
  totalVerifiedYears: number;
  managerReferences: number;
  coworkerReferences: number;
  referenceCompletionPct: number;
  referenceConsensus: "strong" | "moderate" | "weak" | "unknown";
  averageReferenceRating: number;
  timelineConfidenceAvg: number;
  workflowCompletionPct: number;
  dataFreshnessHours: number | null;
  fraudFlagsCount: number;
  hasOpenDispute: boolean;
  missingInformation: string[];
  workflowMilestones?: Array<{ id: string; label: string; completionPct: number; occurredAt?: string }>;
}
