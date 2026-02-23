/**
 * Hiring outcome simulator: "If you hired this person, what's the risk?"
 * Deterministic, explainable. Not a prediction — risk signal based on verified peer data.
 * No DB writes for demo/simulation.
 */

export type RetentionRisk = "very_low" | "low" | "medium" | "high";

export type HiringOutcomeResult = {
  retentionRisk: RetentionRisk;
  explanation: string;
};

export function simulateHiringOutcome(
  trustScore: number,
  flags: string[] = []
): HiringOutcomeResult {
  let risk: RetentionRisk = "low";

  if (trustScore < 60) risk = "high";
  if (
    flags.includes("abuse_pattern") ||
    flags.includes("date_conflict")
  ) {
    risk = "high";
  }
  if (trustScore >= 80 && flags.length === 0) {
    risk = "very_low";
  }

  const explanation =
    risk === "high"
      ? "Low trust or unresolved conflicts"
      : "Strong peer verification";

  return {
    retentionRisk: risk,
    explanation,
  };
}
