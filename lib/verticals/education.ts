import type { VerticalConfig } from "./config";

export const educationVertical: VerticalConfig = {
  key: "Education",
  label: "Education Intelligence",
  description:
    "Evaluates long-term stability, classroom consistency, and peer behavioral tone.",
  highlightMetrics: [
    "Tenure Strength",
    "Rehire Eligibility",
    "Sentiment Strength",
  ],
  riskSignals: [
    "Negative Sentiment Trend",
    "Short Employment Duration",
  ],
  displayBadges: [
    "Grade-Level Experience",
    "Subject Specialization",
    "Multi-Year Retention",
  ],
  emphasisNotes:
    "Education prioritizes long-term consistency and behavioral sentiment stability.",
};
