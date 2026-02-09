import type { VerticalConfig } from "./config";

export const lawEnforcementVertical: VerticalConfig = {
  key: "Law Enforcement",
  label: "Law Enforcement Integrity Intelligence",
  description:
    "Evaluates tenure, rehire status, and sentiment direction for risk analysis.",
  highlightMetrics: [
    "Rehire Eligibility",
    "Sentiment Strength",
    "Tenure Strength",
  ],
  riskSignals: [
    "Negative Sentiment Outliers",
    "Frequent Employment Changes",
  ],
  displayBadges: [
    "Verified Service Record",
    "Stable Employment Pattern",
    "Peer Confidence",
  ],
  emphasisNotes:
    "Law enforcement prioritizes stability, risk minimization, and peer trust.",
};
