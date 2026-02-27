/**
 * Canonical industry set for WorkVouch. Used everywhere: UI selectors,
 * ROI calculator, simulation, and exports. No other industry values are supported.
 */
export type Industry =
  | "retail"
  | "education"
  | "law_enforcement"
  | "security"
  | "warehouse_logistics"
  | "healthcare"
  | "hospitality"
  | "skilled_trades"
  | "construction";

export const ALL_INDUSTRIES: Industry[] = [
  "retail",
  "education",
  "law_enforcement",
  "security",
  "warehouse_logistics",
  "healthcare",
  "hospitality",
  "skilled_trades",
  "construction",
];

/** Compliance / trust thresholds per industry (conservative). */
export const INDUSTRY_THRESHOLDS: Record<Industry, number> = {
  retail: 55,
  education: 75,
  law_enforcement: 90,
  security: 80,
  warehouse_logistics: 50,
  healthcare: 85,
  hospitality: 60,
  skilled_trades: 65,
  construction: 65,
};

/** Human-readable label for display. */
export function industryLabel(industry: Industry): string {
  return industry.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
