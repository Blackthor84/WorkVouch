/**
 * Plan limit config for tier enforcement and overage billing.
 * Standardized tiers: lite, pro, custom. Used by lib/usage.ts and dashboard. -1 = unlimited.
 */

export type PlanTierKey = "lite" | "pro" | "custom" | "security_bundle" | "security_agency";

export interface PlanLimitConfig {
  reports: number;
  searches: number;
  seats: number;
  /** If false, hard block at limit. If true, allow overage and bill via Stripe. */
  allowOverage: boolean;
}

export const PLAN_LIMITS: Record<PlanTierKey, PlanLimitConfig> = {
  lite: {
    reports: 10,
    searches: 15,
    seats: 1,
    allowOverage: false,
  },
  pro: {
    reports: 120,
    searches: 150,
    seats: 20,
    allowOverage: true,
  },
  custom: {
    reports: -1,
    searches: -1,
    seats: 50,
    allowOverage: true,
  },
  security_bundle: {
    reports: 80,
    searches: -1,
    seats: 20,
    allowOverage: true,
  },
  security_agency: {
    reports: 80,
    searches: -1,
    seats: 20,
    allowOverage: true,
  },
};

/** Normalize tier from DB (starter, team, free, basic, etc.) to key used in PLAN_LIMITS. */
export function normalizeTier(tier: string | null | undefined): PlanTierKey {
  if (!tier) return "lite";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "security_agency" || t === "security_bundle" || t === "security") return "security_agency";
  if (t === "lite" || t === "custom") return t as PlanTierKey;
  if (t === "pro") return "pro";
  if (t === "team" || t === "growth") return "pro";
  if (t === "starter" || t === "free" || t === "basic") return "lite";
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
