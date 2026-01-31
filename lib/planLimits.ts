/**
 * Plan limit config for tier enforcement and overage billing.
 * Used by lib/usage.ts and dashboard. -1 = unlimited.
 */

export type PlanTierKey = "starter" | "team" | "pro" | "security_bundle" | "security_agency";

export interface PlanLimitConfig {
  reports: number;
  searches: number;
  seats: number;
  /** If false, hard block at limit. If true, allow overage and bill via Stripe. */
  allowOverage: boolean;
}

export const PLAN_LIMITS: Record<PlanTierKey, PlanLimitConfig> = {
  starter: {
    reports: 10,
    searches: 15,
    seats: 1,
    allowOverage: false,
  },
  team: {
    reports: 40,
    searches: 50,
    seats: 5,
    allowOverage: true,
  },
  pro: {
    reports: 120,
    searches: 150,
    seats: 20,
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

/** Normalize tier from DB (e.g. free, basic) to key used in PLAN_LIMITS. */
export function normalizeTier(tier: string | null | undefined): PlanTierKey {
  if (!tier) return "starter";
  const t = tier.toLowerCase().replace(/-/g, "_");
  if (t === "security_agency" || t === "security_bundle" || t === "security") return "security_agency";
  if (t === "starter" || t === "team" || t === "pro") return t as PlanTierKey;
  if (t === "free" || t === "basic") return "starter";
  return "starter";
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
