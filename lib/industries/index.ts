export type Industry =
  | "healthcare"
  | "security"
  | "law_enforcement"
  | "education"
  | "construction"
  | "retail"
  | "warehouse"
  | "hospitality";

export const ALL_INDUSTRIES: Industry[] = [
  "healthcare",
  "security",
  "law_enforcement",
  "education",
  "construction",
  "retail",
  "warehouse",
  "hospitality",
];

export const INDUSTRY_THRESHOLDS: Record<Industry, number> = {
  healthcare: 85,
  security: 80,
  law_enforcement: 90,
  education: 75,
  construction: 65,
  retail: 55,
  warehouse: 50,
  hospitality: 60,
};
