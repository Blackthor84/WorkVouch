import type { VerticalConfig } from "./config";

export const warehouseVertical: VerticalConfig = {
  key: "Warehouse and Logistics",
  label: "Logistics Reliability Intelligence",
  description:
    "Measures tenure stability and peer-backed reliability.",
  highlightMetrics: [
    "Tenure Strength",
    "Rehire Eligibility",
    "Review Volume Strength",
  ],
  riskSignals: [
    "Low Peer Validation",
    "High Employment Turnover",
  ],
  displayBadges: [
    "Shift Reliability",
    "Long-Term Retention",
    "Team Endorsement",
  ],
  emphasisNotes:
    "Logistics focuses on retention and repeat hire probability.",
};
