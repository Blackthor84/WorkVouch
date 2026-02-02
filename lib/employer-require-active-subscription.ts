import { createServerSupabase } from "@/lib/supabase/server";

export interface RequireActiveSubscriptionResult {
  allowed: boolean;
  error?: string;
  employerId?: string;
  planTier?: string;
}

/**
 * Enforce active subscription for employer-facing candidate data routes.
 * Returns 403 "Active subscription required." if subscription_status !== 'active'.
 * Do NOT rely on frontend gating.
 */
export async function requireActiveSubscription(
  userId: string
): Promise<RequireActiveSubscriptionResult> {
  const supabase = await createServerSupabase();
  const supabaseAny = supabase as any;
  const { data: account, error } = await supabaseAny
    .from("employer_accounts")
    .select("id, plan_tier, subscription_status")
    .eq("user_id", userId)
    .single();

  if (error || !account) {
    return { allowed: false, error: "Employer account not found" };
  }

  const row = account as { id: string; plan_tier?: string; subscription_status?: string | null };
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
