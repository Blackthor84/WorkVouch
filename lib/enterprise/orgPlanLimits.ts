/**
 * Organization-level plan limits (starter | growth | enterprise).
 * Used for seat/location/unlock enforcement when org context exists.
 * Does not replace employer-level plan_tier; supplements for org-scoped checks.
 */

export type OrgPlanType = "starter" | "growth" | "enterprise";

export interface OrgPlanLimitConfig {
  max_admins: number;
  max_locations: number;
  max_monthly_unlocks: number;
  /** Monthly checks (e.g. resume/hiring); -1 = unlimited */
  max_monthly_checks: number;
  /** -1 = unlimited */
  unlimited: boolean;
}

export const ORG_PLAN_LIMITS: Record<OrgPlanType, OrgPlanLimitConfig> = {
  starter: {
    max_admins: 1,
    max_locations: 1,
    max_monthly_unlocks: 25,
    max_monthly_checks: 50,
    unlimited: false,
  },
  growth: {
    max_admins: 3,
    max_locations: 2,
    max_monthly_unlocks: 100,
    max_monthly_checks: 200,
    unlimited: false,
  },
  enterprise: {
    max_admins: -1,
    max_locations: -1,
    max_monthly_unlocks: -1,
    max_monthly_checks: -1,
    unlimited: true,
  },
};

export function getOrgPlanLimits(planType: string | null | undefined): OrgPlanLimitConfig {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return ORG_PLAN_LIMITS.enterprise;
  if (t === "growth" || t === "professional" || t === "pro") return ORG_PLAN_LIMITS.growth;
  return ORG_PLAN_LIMITS.starter;
}

export function normalizeOrgPlanType(planType: string | null | undefined): OrgPlanType {
  const t = (planType ?? "").toLowerCase().trim();
  if (t === "enterprise" || t === "custom") return "enterprise";
  if (t === "growth" || t === "professional" || t === "pro") return "growth";
  return "starter";
}
