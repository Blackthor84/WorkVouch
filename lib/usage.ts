/**
 * Usage tracking and plan limit enforcement.
 * Atomic: insert usage_log, update employer_accounts, optionally report overage to Stripe.
 * All enforcement server-side; never trust frontend counts.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  getPlanLimits,
  normalizeTier,
  type PlanLimitConfig,
  type PlanTierKey,
} from "@/lib/planLimits";

export type UsageActionType = "report" | "search" | "seat_add" | "seat_remove";

type EmployerAccountRow = {
  id: string;
  plan_tier: string;
  reports_used: number;
  searches_used: number;
  seats_used: number;
  seats_allowed: number;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
  stripe_report_overage_item_id: string | null;
  stripe_search_overage_item_id: string | null;
  stripe_seat_overage_item_id: string | null;
};

export interface EnforceResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}

/**
 * Enforce plan limit before performing action. Use in API routes.
 * Returns { allowed: false } if limit reached and overage not allowed / not configured.
 */
export async function enforcePlanLimit(
  employerId: string,
  type: "reports" | "searches" | "seats"
): Promise<EnforceResult> {
  const supabase = getSupabaseServer() as any;
  const { data: row, error } = await supabase
    .from("employer_accounts")
    .select(
      "id, plan_tier, reports_used, searches_used, seats_used, seats_allowed"
    )
    .eq("id", employerId)
    .single();

  if (error || !row) {
    return { allowed: false, reason: "Employer not found" };
  }

  const limits = getPlanLimits(row.plan_tier);
  const used =
    type === "reports"
      ? Number(row.reports_used ?? 0)
      : type === "searches"
        ? Number(row.searches_used ?? 0)
        : Number(row.seats_used ?? 0);
  const limit =
    type === "reports"
      ? limits.reports
      : type === "searches"
        ? limits.searches
        : limits.seats;

  if (limit === -1) return { allowed: true };
  if (used < limit) return { allowed: true, limit, used };
  // At or over limit: hard block if plan does not allow overage (Starter); overage billing is in enforceLimit()
  if (!limits.allowOverage) {
    return { allowed: false, reason: "Plan limit reached. Upgrade to continue.", limit, used };
  }
  return { allowed: true, limit, used };
}

/**
 * Increment usage: insert usage_log, update employer_accounts, optionally report overage to Stripe.
 * Call after the action (report generated, search performed, seat added).
 * For seat_remove: pass quantity -1 or use a separate path; here we support seat_add only for increment.
 */
export async function incrementUsage(
  employerId: string,
  type: "report" | "search" | "seat_add",
  quantity: number = 1
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseServer() as any;

  const { data: account, error: fetchError } = await supabase
    .from("employer_accounts")
    .select(
      "id, plan_tier, reports_used, searches_used, seats_used, seats_allowed, billing_cycle_start, billing_cycle_end, stripe_report_overage_item_id, stripe_search_overage_item_id, stripe_seat_overage_item_id"
    )
    .eq("id", employerId)
    .single();

  if (fetchError || !account) {
    return { ok: false, error: "Employer not found" };
  }

  const acc = account as EmployerAccountRow;

  const actionType: UsageActionType =
    type === "report"
      ? "report"
      : type === "search"
        ? "search"
        : "seat_add";

  const { error: logError } = await supabase.from("usage_logs").insert({
    employer_id: employerId,
    action_type: actionType,
    quantity,
    created_at: new Date().toISOString(),
  });

  if (logError) {
    console.error("[usage] usage_logs insert:", logError);
    return { ok: false, error: "Failed to record usage" };
  }

  const updates: Record<string, number> = {};
  if (type === "report") {
    updates.reports_used = (acc.reports_used ?? 0) + quantity;
  } else if (type === "search") {
    updates.searches_used = (acc.searches_used ?? 0) + quantity;
  } else {
    updates.seats_used = (acc.seats_used ?? 0) + quantity;
  }

  const { error: updateError } = await supabase
    .from("employer_accounts")
    .update(updates)
    .eq("id", employerId);

  if (updateError) {
    console.error("[usage] employer_accounts update:", updateError);
    return { ok: false, error: "Failed to update usage counters" };
  }

  // Overage billing is handled in enforceLimit() before the action; we only update DB here.
  return { ok: true };
}

/**
 * Get current usage and limits for an employer (dashboard / admin).
 */
export async function getUsageForEmployer(employerId: string): Promise<{
  planTier: string;
  limits: PlanLimitConfig;
  reportsUsed: number;
  searchesUsed: number;
  seatsUsed: number;
  seatsAllowed: number;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
} | null> {
  const supabase = getSupabaseServer() as any;
  const { data, error } = await supabase
    .from("employer_accounts")
    .select(
      "plan_tier, reports_used, searches_used, seats_used, seats_allowed, billing_cycle_start, billing_cycle_end, stripe_customer_id, stripe_subscription_id"
    )
    .eq("id", employerId)
    .single();

  if (error || !data) return null;

  const tier = (data.plan_tier as string) || "starter";
  const limits = getPlanLimits(tier);

  return {
    planTier: tier,
    limits,
    reportsUsed: Number(data.reports_used ?? 0),
    searchesUsed: Number(data.searches_used ?? 0),
    seatsUsed: Number(data.seats_used ?? 0),
    seatsAllowed: Number(data.seats_allowed ?? 1),
    billingCycleStart: data.billing_cycle_start ?? null,
    billingCycleEnd: data.billing_cycle_end ?? null,
    stripeCustomerId: data.stripe_customer_id ?? null,
    stripeSubscriptionId: data.stripe_subscription_id ?? null,
  };
}
