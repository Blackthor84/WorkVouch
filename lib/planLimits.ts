/**
 * Plan limit config for tier enforcement and overage billing.
 * free = default for new employers; lite, pro, enterprise = paid.
 * -1 = unlimited.
 */

export type PlanTierKey = "free" | "lite" | "pro" | "enterprise";

export interface PlanLimitConfig {
  reports: number;
  searches: number;
  seats: number;
  /** If false, hard block at limit. If true, allow overage and bill via Stripe. */
  allowOverage: boolean;
}

export const PLAN_LIMITS: Record<PlanTierKey, PlanLimitConfig> = {
  free: {
    reports: 0,
    searches: 5,
    seats: 1,
    allowOverage: false,
  },
  lite: {
    reports: 15,
    searches: 25,
    seats: 1,
    allowOverage: false,
  },
  pro: {
    reports: 75,
    searches: 100,
    seats: 20,
    allowOverage: true,
  },
  enterprise: {
    reports: -1,
    searches: -1,
    seats: 50,
    allowOverage: true,
  },
};

/** Normalize tier from DB to canonical key. free = default new employer. */
export function normalizeTier(tier: string | null | undefined): PlanTierKey {
  if (!tier) return "free";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "free") return "free";
  if (t === "lite") return "lite";
  if (t === "pro") return "pro";
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "starter" || t === "basic" || t === "pay_per_use") return "lite";
  if (t === "team" || t === "growth" || t === "security_bundle" || t === "security_agency" || t === "security") return "pro";
  return "free";
}

export function getPlanLimits(tier: string | null | undefined): PlanLimitConfig {
  return PLAN_LIMITS[normalizeTier(tier)];
}

export function isUnlimitedReports(tier: string | null | undefined): boolean {
  const limits = getPlanLimits(tier);
  return limits.reports === -1;
}

export function isUnlimitedSearches(tier: string | null | undefined): boolean {
  const limits = getPlanLimits(tier);
  return limits.searches === -1;
}

export function allowsOverage(tier: string | null | undefined): boolean {
  const limits = getPlanLimits(tier);
  return limits.allowOverage;
}
