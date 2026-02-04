/**
 * Plan limit config for tier enforcement. Canonical: starter, pro, custom only.
 * free = default new employer. -1 = unlimited.
 */

export type PlanTierKey = "free" | "starter" | "pro" | "custom";

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
  starter: {
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
  custom: {
    reports: -1,
    searches: -1,
    seats: 50,
    allowOverage: true,
  },
};

/** Normalize tier from DB to canonical key. free = default new employer. Starter, pro, custom only. */
export function normalizeTier(tier: string | null | undefined): PlanTierKey {
  if (!tier) return "free";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "free") return "free";
  if (t === "starter" || t === "lite" || t === "basic" || t === "pay_per_use") return "starter";
  if (t === "pro" || t === "team" || t === "growth" || t === "security_bundle" || t === "security_agency" || t === "security") return "pro";
  if (t === "custom" || t === "enterprise") return "custom";
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
