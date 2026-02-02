/**
 * Industry emphasis — UI only. Does NOT change the numeric trust score.
 * Returns which components to highlight / display first for employer views.
 * No percentage weights exposed; used only for visual ordering.
 */

export type EmphasisComponent =
  | "employment"
  | "tenure"
  | "rating"
  | "distribution"
  | "referenceVolume";

export type IndustryKey =
  | "security"
  | "healthcare"
  | "logistics"
  | "warehouse"
  | "retail"
  | "hospitality"
  | "law_enforcement";

/** Default order when employer has no industry_type set. */
const DEFAULT_ORDER: EmphasisComponent[] = [
  "employment",
  "tenure",
  "rating",
  "distribution",
  "referenceVolume",
];

/** Per-industry highlight order for UI display only. */
const EMPHASIS_ORDER: Record<IndustryKey, EmphasisComponent[]> = {
  security: ["tenure", "rating", "employment", "distribution", "referenceVolume"],
  healthcare: ["tenure", "rating", "employment", "distribution", "referenceVolume"],
  logistics: ["distribution", "employment", "tenure", "rating", "referenceVolume"],
  warehouse: ["distribution", "employment", "tenure", "rating", "referenceVolume"],
  retail: ["rating", "distribution", "employment", "tenure", "referenceVolume"],
  hospitality: ["rating", "distribution", "employment", "tenure", "referenceVolume"],
  law_enforcement: ["tenure", "rating", "employment", "distribution", "referenceVolume"],
};

/**
 * Return prioritized component order for employer UI display.
 * Does not affect the stored or computed trust score.
 */
export function getIndustryEmphasis(
  industryType: string | null | undefined
): EmphasisComponent[] {
  if (!industryType || !(industryType in EMPHASIS_ORDER)) {
    return DEFAULT_ORDER;
  }
  return EMPHASIS_ORDER[industryType as IndustryKey];
}
