import { createServerSupabase } from "@/lib/supabase/server";

export interface RequireActiveSubscriptionResult {
  allowed: boolean;
  error?: string;
  employerId?: string;
  planTier?: string;
  organizationId?: string;
  enterprisePlan?: string;
}

/** Employee count limits per enterprise plan (org-level). */
const ENTERPRISE_PLAN_EMPLOYEE_LIMITS: Record<string, number> = {
  enterprise_basic: 500,
  enterprise_plus: 2000,
  enterprise_security: 10000,
};

/**
 * Enforce active subscription for employer-facing candidate data routes.
 * If employer is linked to an organization with enterprise_plan, bypass per-location subscription check
 * but enforce employee count limit for that plan.
 * Otherwise returns 403 "Active subscription required." if subscription_status !== 'active'.
 * Do NOT rely on frontend gating.
 */
export async function requireActiveSubscription(
  userId: string
): Promise<RequireActiveSubscriptionResult> {
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: account, error } = await supabaseAny
    .from("employer_accounts")
    .select("id, plan_tier, subscription_status, organization_id")
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    return { allowed: false, error: "Employer account not found" };
  }

  const row = account as {
    id: string;
    plan_tier?: string;
    subscription_status?: string | null;
    organization_id?: string | null;
  };

  if (row.organization_id) {
    const { data: org } = await supabaseAny
      .from("organizations")
      .select("id, enterprise_plan, is_simulation")
      .eq("id", row.organization_id)
      .single();
    const orgRow = org as { enterprise_plan?: string | null; is_simulation?: boolean } | null;
    if (orgRow?.is_simulation === true) {
      return {
        allowed: true,
        employerId: row.id,
        planTier: row.plan_tier ?? undefined,
        organizationId: row.organization_id,
      };
    }
    const enterprisePlan = orgRow?.enterprise_plan;
    if (enterprisePlan && ENTERPRISE_PLAN_EMPLOYEE_LIMITS[enterprisePlan] !== undefined) {
      const limit = ENTERPRISE_PLAN_EMPLOYEE_LIMITS[enterprisePlan];
      const { count } = await supabaseAny
        .from("workforce_employees")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", row.organization_id);
      const employeeCount = count ?? 0;
      if (employeeCount > limit) {
        return {
          allowed: false,
          error: `Enterprise plan ${enterprisePlan} employee limit (${limit}) exceeded.`,
          employerId: row.id,
          organizationId: row.organization_id,
          enterprisePlan,
        };
      }
      return {
        allowed: true,
        employerId: row.id,
        planTier: row.plan_tier ?? undefined,
        organizationId: row.organization_id,
        enterprisePlan,
      };
    }
  }

  if (row.subscription_status !== "active") {
    return {
      allowed: false,
      error: "Active subscription required.",
      employerId: row.id,
      planTier: row.plan_tier ?? undefined,
    };
  }

  return {
    allowed: true,
    employerId: row.id,
    planTier: row.plan_tier ?? undefined,
  };
}
