import type { ConfidenceFactor } from "./types";

/** Computes 0–100 hiring confidence from weighted factors. */
export class ConfidenceCalculator {
  calculate(factors: ConfidenceFactor[]): number {
    let total = 0;

    for (const factor of factors) {
      if (factor.id === "risk_signals" || factor.id === "missing_information") {
        // Penalty factors: lower normalized → lower contribution already reflected
        total += factor.contribution;
      } else {
        total += factor.contribution;
      }
    }

    // Scale to 0-100 (weights sum ~1.0, contributions are weight*normalized*100)
    return Math.max(0, Math.min(100, Math.round(total)));
  }
}
