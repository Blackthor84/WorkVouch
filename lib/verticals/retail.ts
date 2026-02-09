import type { VerticalConfig } from "./config";

export const retailVertical: VerticalConfig = {
  key: "Retail",
  label: "Retail Performance Intelligence",
  description:
    "Evaluates team trust, customer-facing sentiment, and review volume.",
  highlightMetrics: [
    "Review Volume Strength",
    "Rating Strength",
    "Sentiment Strength",
  ],
  riskSignals: [
    "Low Review Participation",
    "Rating Instability",
  ],
  displayBadges: [
    "Customer-Facing Stability",
    "Team Endorsement",
    "Consistent Ratings",
  ],
  emphasisNotes:
    "Retail emphasizes peer validation and sentiment trends.",
};
