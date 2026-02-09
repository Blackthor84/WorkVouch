import type { VerticalConfig } from "./config";

export const securityVertical: VerticalConfig = {
  key: "Security",
  label: "Security Risk Intelligence",
  description:
    "Evaluates behavioral signals, sentiment stability, and risk indicators.",
  highlightMetrics: [
    "Sentiment Strength",
    "Rehire Eligibility",
    "Fraud Penalty Adjustments",
  ],
  riskSignals: [
    "Negative Behavioral Signals",
    "Multiple Short Tenures",
  ],
  displayBadges: [
    "High Trust Peer Network",
    "Low Risk Profile",
    "Behavioral Stability",
  ],
  emphasisNotes:
    "Security emphasizes behavioral integrity and sentiment consistency.",
};
