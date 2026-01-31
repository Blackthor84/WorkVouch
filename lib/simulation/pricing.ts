/**
 * Simulation-only monthly price per plan (for revenue dashboards).
 * No Stripe, no DB. Used by admin revenue-demo and investor views.
 */

import type { PlanTier } from "./types";

const MONTHLY_PRICE: Record<PlanTier, number> = {
  starter: 49,
  team: 149,
  pro: 299,
  enterprise: 499,
};

export function getMonthlyPrice(plan: PlanTier): number {
  return MONTHLY_PRICE[plan] ?? 49;
}
