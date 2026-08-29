import { createClient } from "@/lib/supabase/server";
import {
  normalizeEmployerMonetizationTier,
  type EmployerMonetizationTier,
} from "@/lib/employer/verifiedWorkersLimits";

export interface RequireActiveSubscriptionResult {
  allowed: boolean;
  error?: string;
  employerId?: string;
  planTier?: string;
  organizationId?: string;
  enterprisePlan?: string;
}

/** Production-safe until Stripe subscription columns are migrated. */
export const EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS = "id, plan_tier";

export const EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED =
  "id, plan_tier, subscription_status, organization_id";

/** Employee count limits per enterprise plan (org-level). */
const ENTERPRISE_PLAN_EMPLOYEE_LIMITS: Record<string, number> = {
  enterprise_basic: 500,
  enterprise_plus: 2000,
  enterprise_security: 10000,
};

function isMissingEmployerAccountColumnError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  const message = String(error?.message ?? "");
  return error?.code === "42703" || message.includes("does not exist");
}

/** Paid tiers from employer_accounts.plan_tier (authoritative in production). */
export function isPaidEmployerPlanTier(planTier: string | null | undefined): boolean {
  const tier: EmployerMonetizationTier = normalizeEmployerMonetizationTier(planTier);
  return tier === "pro" || tier === "custom" || tier === "starter";
}

type EmployerSubscriptionRow = {
  id: string;
  plan_tier?: string | null;
  subscription_status?: string | null;
  organization_id?: string | null;
};

async function loadEmployerSubscriptionAccount(
  supabaseAny: { from: (table: string) => unknown },
  userId: string
): Promise<{ data: EmployerSubscriptionRow | null; error: { message?: string; code?: string } | null }> {
  const extended = (await (supabaseAny as any)
    .from("employer_accounts")
    .select(EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS_EXTENDED)
    .eq("user_id", userId)
    .maybeSingle()) as { data: EmployerSubscriptionRow | null; error: { message?: string; code?: string } | null };

  if (!extended.error) return extended;
  if (!isMissingEmployerAccountColumnError(extended.error)) return extended;

  return (await (supabaseAny as any)
    .from("employer_accounts")
    .select(EMPLOYER_SUBSCRIPTION_ACCOUNT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle()) as { data: EmployerSubscriptionRow | null; error: { message?: string; code?: string } | null };
}

/**
 * Enforce paid employer access for candidate data routes.
 * Production: employer_accounts.plan_tier (pro/starter/custom) is authoritative.
 * When subscription_status exists (Stripe-synced envs), inactive statuses deny access.
 */
export async function requireActiveSubscription(
  userId: string
): Promise<RequireActiveSubscriptionResult> {
  const supabase = await createClient();
  const supabaseAny = supabase as any;
  const { data: account, error } = await loadEmployerSubscriptionAccount(supabaseAny, userId);

  if (error || !account) {
    return { allowed: false, error: "Employer account not found" };
  }

  const row = account;
  const planTier = row.plan_tier ?? undefined;

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
        planTier,
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
        planTier,
        organizationId: row.organization_id,
        enterprisePlan,
      };
    }
  }

  const subscriptionStatus = row.subscription_status;
  const hasSubscriptionStatusField = Object.prototype.hasOwnProperty.call(row, "subscription_status");

  if (
    hasSubscriptionStatusField &&
    subscriptionStatus != null &&
    subscriptionStatus !== "active"
  ) {
    return {
      allowed: false,
      error: "Active subscription required.",
      employerId: row.id,
      planTier,
    };
  }

  if (hasSubscriptionStatusField && subscriptionStatus === "active") {
    return {
      allowed: true,
      employerId: row.id,
      planTier,
    };
  }

  if (isPaidEmployerPlanTier(row.plan_tier)) {
    return {
      allowed: true,
      employerId: row.id,
      planTier,
    };
  }

  return {
    allowed: false,
    error: "Active subscription required.",
    employerId: row.id,
    planTier,
  };
}
