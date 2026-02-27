/**
 * Enterprise risk-adjusted pricing. Multipliers apply ONLY to Enterprise (custom) plans.
 * Used for recommended pricing and ROI justification — not shown as "industry pricing" in UI.
 * Framed as risk-adjusted value, not price discrimination.
 */

import type { Industry } from "@/lib/industries";

/** Neutral reference: Enterprise base price per month (USD). */
export const ENTERPRISE_BASE_PRICE_MONTHLY = 3_000;

/**
 * Risk-adjusted multipliers by industry. Based on:
 * regulatory exposure, liability, blast radius of trust failure, audit intensity.
 * Used only for Enterprise recommended pricing and ROI export consistency.
 */
export const ENTERPRISE_INDUSTRY_MULTIPLIERS: Record<Industry, number> = {
  retail: 0.8,
  education: 1.0,
  law_enforcement: 1.6,
  security: 1.3,
  warehouse_logistics: 1.2,
  healthcare: 1.7,
  hospitality: 0.9,
  skilled_trades: 1.2,
  construction: 1.4,
};

/**
 * Recommended Enterprise monthly price for an industry (risk-adjusted).
 * Use for sales framing and ROI export justification only.
 * Do not expose multipliers directly in UI.
 */
export function getEnterpriseRecommendedMonthlyPrice(industry: Industry): number {
  const mult = ENTERPRISE_INDUSTRY_MULTIPLIERS[industry];
  return Math.round(ENTERPRISE_BASE_PRICE_MONTHLY * mult);
}
