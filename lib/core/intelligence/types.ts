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
}
