import type { VerticalConfig } from "./config";

export const healthcareVertical: VerticalConfig = {
  key: "Healthcare",
  label: "Healthcare Stability Intelligence",
  description:
    "Prioritizes tenure stability and peer validation consistency.",
  highlightMetrics: [
    "Tenure Strength",
    "Review Volume Strength",
    "Rehire Eligibility",
  ],
  riskSignals: [
    "Short Tenure Pattern",
    "Low Peer Review Density",
  ],
  displayBadges: [
    "Clinical Stability",
    "Peer Endorsement",
    "Multi-Employer Consistency",
  ],
  emphasisNotes:
    "Healthcare focuses on reliability and long-term professional stability.",
};
