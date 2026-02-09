import type { VerticalConfig } from "./config";

export const hospitalityVertical: VerticalConfig = {
  key: "Hospitality",
  label: "Hospitality Behavioral Intelligence",
  description:
    "Focuses on sentiment, rating consistency, and peer trust.",
  highlightMetrics: [
    "Sentiment Strength",
    "Rating Strength",
    "Review Volume Strength",
  ],
  riskSignals: [
    "Negative Sentiment Clusters",
    "Low Rehire Likelihood",
  ],
  displayBadges: [
    "Guest-Facing Reliability",
    "Positive Peer Tone",
    "Team Stability",
  ],
  emphasisNotes:
    "Hospitality prioritizes positive peer sentiment and rating stability.",
};
