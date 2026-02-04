/**
 * Plan limit config for tier enforcement and overage billing.
 * Canonical employer plans: lite, pro, enterprise only. -1 = unlimited.
 */

export type PlanTierKey = "lite" | "pro" | "enterprise";

export interface PlanLimitConfig {
  reports: number;
  searches: number;
  seats: number;
  /** If false, hard block at limit. If true, allow overage and bill via Stripe. */
  allowOverage: boolean;
}

export const PLAN_LIMITS: Record<PlanTierKey, PlanLimitConfig> = {
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

/** Normalize tier from DB to canonical key. Legacy: starter→lite, team/security-bundle→pro, pay-per-use→lite. */
export function normalizeTier(tier: string | null | undefined): PlanTierKey {
  if (!tier) return "lite";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "lite") return "lite";
  if (t === "pro") return "pro";
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "starter" || t === "free" || t === "basic" || t === "pay_per_use") return "lite";
  if (t === "team" || t === "growth" || t === "security_bundle" || t === "security_agency" || t === "security") return "pro";
  return "lite";
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
