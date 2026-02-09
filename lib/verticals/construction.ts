import type { VerticalConfig } from "./config";

export const constructionVertical: VerticalConfig = {
  key: "Construction",
  label: "Construction Workforce Intelligence",
  description:
    "Focuses on rehire eligibility, team trust, and consistency across projects.",
  highlightMetrics: [
    "Rehire Eligibility",
    "Review Volume Strength",
    "Rating Strength",
  ],
  riskSignals: ["High Rating Variance", "Low Peer Volume"],
  displayBadges: [
    "Trade Verified",
    "Project Consistency",
    "Team Reliability",
  ],
  emphasisNotes:
    "Construction emphasizes reliability, repeat hire likelihood, and peer validation.",
};
