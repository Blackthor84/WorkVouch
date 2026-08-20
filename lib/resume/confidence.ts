import type { ConfidenceLevel } from "./types";

/** Map numeric model confidence (0–1) to user-facing level */
export function numericToConfidence(score: number | undefined | null): ConfidenceLevel {
  if (score == null || Number.isNaN(score)) return "medium";
  if (score >= 0.85) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

export function confidenceLabel(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
  }
}
