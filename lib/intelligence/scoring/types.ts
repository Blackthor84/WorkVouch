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
}
