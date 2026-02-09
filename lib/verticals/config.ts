import { educationVertical } from "./education";
import { constructionVertical } from "./construction";
import { securityVertical } from "./security";
import { healthcareVertical } from "./healthcare";
import { lawEnforcementVertical } from "./law-enforcement";
import { retailVertical } from "./retail";
import { hospitalityVertical } from "./hospitality";
import { warehouseVertical } from "./warehouse";

export type VerticalKey =
  | "Healthcare"
  | "Law Enforcement"
  | "Security"
  | "Retail"
  | "Hospitality"
  | "Warehouse and Logistics"
  | "Education"
  | "Construction";

export interface VerticalConfig {
  key: VerticalKey;
  label: string;
  description: string;
  highlightMetrics: string[];
  riskSignals: string[];
  displayBadges: string[];
  emphasisNotes: string;
}

const verticalMap: Record<VerticalKey, VerticalConfig> = {
  Education: educationVertical,
  Construction: constructionVertical,
  Security: securityVertical,
  Healthcare: healthcareVertical,
  "Law Enforcement": lawEnforcementVertical,
  Retail: retailVertical,
  Hospitality: hospitalityVertical,
  "Warehouse and Logistics": warehouseVertical,
};

export function getVerticalConfig(industry?: string | null): VerticalConfig | null {
  if (!industry) return null;
  return verticalMap[industry as VerticalKey] ?? null;
}
