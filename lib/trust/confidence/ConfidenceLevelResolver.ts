import type { ConfidenceLevel, ConfidenceRecommendation } from "./types";

export interface ResolvedConfidenceLevel {
  level: ConfidenceLevel;
  label: string;
  starRating: number;
}

/** Maps 0–100 score to level, label, and star rating. */
export class ConfidenceLevelResolver {
  resolve(score: number): ResolvedConfidenceLevel {
    if (score >= 90) {
      return { level: "high", label: "High Confidence", starRating: 5 };
    }
    if (score >= 75) {
      return { level: "strong", label: "Strong Confidence", starRating: 4 };
    }
    if (score >= 55) {
      return { level: "moderate", label: "Moderate Confidence", starRating: 3 };
    }
    if (score >= 30) {
      return { level: "needs_review", label: "Needs Review", starRating: 2 };
    }
    return { level: "low", label: "Low Confidence", starRating: 1 };
  }

  resolveRecommendation(
    score: number,
    input: {
      employmentVerified: boolean;
      managerReferences: number;
      coworkerReferences: number;
      referenceCompletionPct: number;
      hasOpenDispute: boolean;
    }
  ): { recommendation: ConfidenceRecommendation; label: string } {
    if (input.hasOpenDispute || score < 30) {
      return { recommendation: "requires_manual_review", label: "Requires Manual Review" };
    }
    if (score >= 90 && input.employmentVerified && input.referenceCompletionPct >= 80) {
      return { recommendation: "ready_to_hire", label: "Ready to Hire" };
    }
    if (score >= 80) {
      return { recommendation: "ready_for_final_review", label: "Ready for Final Review" };
    }
    if (score >= 65) {
      return { recommendation: "ready_to_interview", label: "Ready to Interview" };
    }
    if (!input.employmentVerified) {
      return { recommendation: "needs_additional_verification", label: "Needs Additional Verification" };
    }
    if (input.coworkerReferences < 2 || input.referenceCompletionPct < 60) {
      return { recommendation: "needs_additional_references", label: "Needs Additional References" };
    }
    return { recommendation: "requires_manual_review", label: "Requires Manual Review" };
  }
}

/** Render star string e.g. ★★★★☆ */
export function renderStarRating(stars: number): string {
  const filled = "★".repeat(Math.max(0, Math.min(5, stars)));
  const empty = "☆".repeat(Math.max(0, 5 - stars));
  return filled + empty;
}
