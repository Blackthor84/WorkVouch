/**
 * Build canonical ProfileInput from sandbox tables for the v1 intelligence engine.
 * No scoring logic here — only data shaping. See lib/core/intelligence.
 */

import type { ProfileInput } from "@/lib/core/intelligence";

/** Sandbox peer review row shape */
interface SandboxReview {
  rating?: number | null;
  review_text?: string | null;
  sentiment_score?: number | null;
  reliability_score?: number | null;
  teamwork_score?: number | null;
  leadership_score?: number | null;
  stress_performance_score?: number | null;
}

/** Sandbox employment record row shape */
interface SandboxRecord {
  tenure_months?: number | null;
  rehire_eligible?: boolean | null;
}

/**
 * Convert sentiment from 0–1 (sandbox) to -1 to +1 (canonical).
 */
function sentiment01ToCanonical(sentiment01: number): number {
  return Math.max(-1, Math.min(1, (sentiment01 - 0.5) * 2));
}

/**
 * Derive average sentiment 0–1 from reviews, with optional text fallback.
 */
function averageSentiment01(
  reviews: SandboxReview[],
  sentimentFromText: (text: string | null) => number
): number {
  if (reviews.length === 0) return 0.5;
  const scores = reviews.map((r) => {
    const fromCols = [
      r.reliability_score,
      r.teamwork_score,
      r.leadership_score,
      r.stress_performance_score,
    ].filter((x) => x != null) as number[];
    if (fromCols.length > 0) return fromCols.reduce((a, b) => a + b, 0) / fromCols.length / 100;
    return r.sentiment_score ?? sentimentFromText(r.review_text ?? null);
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Build ProfileInput for one employee from sandbox reviews and records.
 */
export function buildSandboxProfileInput(
  empReviews: SandboxReview[],
  empRecords: SandboxRecord[],
  sentimentFromText: (text: string | null) => number
): ProfileInput {
  const totalMonths = empRecords.reduce((s, r) => s + (r.tenure_months ?? 0), 0);
  const reviewCount = empReviews.length;
  const sentiment01 = averageSentiment01(empReviews, sentimentFromText);
  const sentimentAverage = sentiment01ToCanonical(sentiment01);
  const averageRating =
    empReviews.length > 0
      ? empReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / empReviews.length
      : 3;
  const rehireEligible =
    empRecords.length > 0 &&
    empRecords.some((r) => r.rehire_eligible === true);

  return {
    totalMonths,
    reviewCount,
    sentimentAverage,
    averageRating: Math.max(1, Math.min(5, averageRating)),
    rehireEligible,
  };
}
