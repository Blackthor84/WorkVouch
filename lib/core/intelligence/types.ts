/**
 * Canonical input for the WorkVouch Intelligence Engine (v1).
 * See docs/workvouch-intelligence-v1.md.
 */

export interface ProfileInput {
  /** Total verified employment tenure in months. */
  totalMonths: number;
  /** Number of peer reviews (verified overlap). */
  reviewCount: number;
  /** Average sentiment across reviews, normalized -1 (negative) to +1 (positive). */
  sentimentAverage: number;
  /** Average peer rating 1–5. */
  averageRating: number;
  /** Whether the subject is rehire-eligible (employer would rehire). */
  rehireEligible: boolean;
  /**
   * Fraud signal in [0, 1]. Undefined treated as 0.
   * Used to compute FraudPenalty: min(fraud_score * 10, 15) subtracted from raw score.
   */
  fraudScore?: number;
  /**
   * When set, FR = min(fraud_count * 5, 15) is used instead of fraudScore-based penalty.
   * Cross-location / org fraud flags count.
   */
  fraud_count?: number;
  /** Optional org context for persistence to organization_intelligence and intelligence_history. */
  organization_id?: string | null;
  /** Optional location context. */
  location_id?: string | null;
  /** Prior rehire flags across org (for display/analytics; rehireEligible still drives multiplier). */
  prior_rehire_flags?: number | boolean[] | null;
}
