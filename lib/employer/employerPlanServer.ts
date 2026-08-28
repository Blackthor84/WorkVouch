import { admin } from "@/lib/supabase-admin";
import { getUserPlan, isFreePlan, type ProfilePlan } from "@/lib/auth/plan";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import {
  normalizeEmployerMonetizationTier,
  type EmployerMonetizationTier,
} from "@/lib/employer/verifiedWorkersLimits";

export type EmployerAccessMode = "free_preview" | "full";

export type EmployerAccessResult =
  | { mode: "free_preview"; plan: ProfilePlan }
  | { mode: "full"; plan: ProfilePlan; subscription: Awaited<ReturnType<typeof requireActiveSubscription>> };

export type ResolveEmployerDataAccessResult =
  | { ok: false; status: number; error: string }
  | ({ ok: true } & EmployerAccessResult);

/** Role-only fallback when profiles.plan (20260316140000) is not migrated yet. */
export const EMPLOYER_ACCESS_PROFILE_COLUMNS_FALLBACK = "role";

/** Production canonical plan source until profiles.plan migration is applied. */
export const EMPLOYER_ACCOUNT_PLAN_COLUMNS = "plan_tier";

type EmployerAccessProfileRow = { role?: string | null; plan?: string | null };

function isMissingPlanColumnError(error: { message?: string; code?: string } | null): boolean {
  const message = String(error?.message ?? "");
  return message.includes("plan") || error?.code === "42703";
}

/**
 * Map employer_accounts.plan_tier (production) to profiles.plan values used by access gates.
 */
export function employerAccountTierToProfilePlan(
  planTier: string | null | undefined
): ProfilePlan {
  const tier = normalizeEmployerMonetizationTier(planTier);
  if (tier === "custom") return "enterprise";
  if (tier === "pro") return "pro";
  return "free";
}

/** Human-readable plan label for employer portal chrome (header, badges). */
export function employerPlanDisplayLabel(planTier: string | null | undefined): string {
  const tier: EmployerMonetizationTier = normalizeEmployerMonetizationTier(planTier);
  if (tier === "pro") return "Pro Plan";
  if (tier === "custom") return "Custom Plan";
  if (tier === "starter") return "Starter Plan";
  return "Free Plan";
}

/** Authoritative production plan tier from employer_accounts. */
export async function loadEmployerAccountPlanTier(userId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("employer_accounts")
    .select(EMPLOYER_ACCOUNT_PLAN_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { plan_tier?: string | null }).plan_tier ?? null;
}

async function loadEmployerAccessProfile(userId: string): Promise<{
  data: EmployerAccessProfileRow | null;
  error: { message?: string; code?: string } | null;
}> {
  const withPlan = await admin
    .from("profiles")
    .select("role, plan")
    .eq("id", userId)
    .maybeSingle();
  if (!withPlan.error) {
    return withPlan as { data: EmployerAccessProfileRow | null; error: null };
  }
  if (!isMissingPlanColumnError(withPlan.error)) {
    return withPlan as { data: EmployerAccessProfileRow | null; error: { message?: string; code?: string } };
  }

  const roleOnly = await admin
    .from("profiles")
    .select(EMPLOYER_ACCESS_PROFILE_COLUMNS_FALLBACK)
    .eq("id", userId)
    .maybeSingle();
  if (roleOnly.error) {
    return roleOnly as { data: EmployerAccessProfileRow | null; error: { message?: string; code?: string } };
  }

  const accountPlanTier = await loadEmployerAccountPlanTier(userId);
  const role = (roleOnly.data as { role?: string | null } | null)?.role ?? null;
  return {
    data: {
      role,
      plan: employerAccountTierToProfilePlan(accountPlanTier),
    },
    error: null,
  };
}

/**
 * Employers on profiles.plan = free may use preview APIs without Stripe subscription.
 * Pro/enterprise require existing subscription rules.
 */
export async function resolveEmployerDataAccess(userId: string): Promise<ResolveEmployerDataAccessResult> {
  const { data: row, error } = await loadEmployerAccessProfile(userId);
  if (error) {
    return { ok: false, status: 500, error: error.message ?? "Failed to load employer profile" };
  }
  const role = String((row as { role?: string } | null)?.role ?? "").toLowerCase();
  if (role !== "employer") {
    return { ok: false, status: 403, error: "Employer access required" };
  }

  const plan = getUserPlan(row as { plan?: string | null });

  if (isFreePlan({ plan })) {
    return { ok: true, mode: "free_preview", plan };
  }

  const subscription = await requireActiveSubscription(userId);
  if (!subscription.allowed) {
    return {
      ok: false,
      status: 403,
      error: subscription.error ?? "Active subscription required.",
    };
  }

  return { ok: true, mode: "full", plan, subscription };
}
