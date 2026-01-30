/**
 * Hybrid plan enforcement: Starter = hard block at limit; Team/Pro/Security = allow overage billing.
 * Call before the action; then increment usage after. Overage is reported to Stripe here (not in incrementUsage).
 */

import { getPlanLimits, normalizeTier } from "./planLimits";

export type EnforceLimitType = "reports" | "searches" | "seats";

export interface EnforceLimitResult {
  allowed: boolean;
  error?: string;
  overage?: boolean;
}

/** Employer row shape expected: plan_tier, reports_used, searches_used, seats_used, stripe_*_overage_item_id */
export interface EmployerForEnforce {
  plan_tier: string;
  reports_used?: number | null;
  searches_used?: number | null;
  seats_used?: number | null;
  stripe_report_overage_item_id?: string | null;
  stripe_search_overage_item_id?: string | null;
  stripe_seat_overage_item_id?: string | null;
}

function getUsed(employer: EmployerForEnforce, type: EnforceLimitType): number {
  if (type === "reports") return Number(employer.reports_used ?? 0);
  if (type === "searches") return Number(employer.searches_used ?? 0);
  return Number(employer.seats_used ?? 0);
}

function getOverageItemId(employer: EmployerForEnforce, type: EnforceLimitType): string | null {
  if (type === "reports") return employer.stripe_report_overage_item_id ?? null;
  if (type === "searches") return employer.stripe_search_overage_item_id ?? null;
  return employer.stripe_seat_overage_item_id ?? null;
}

/** Report one unit of usage to Stripe metered subscription item (idempotent by timestamp). */
async function reportOverageToStripe(subscriptionItemId: string, quantity: number = 1): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const res = await fetch(
    `https://api.stripe.com/v1/subscription_items/${encodeURIComponent(subscriptionItemId)}/usage_records`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        quantity: String(quantity),
        timestamp: String(timestamp),
        action: "increment",
      }).toString(),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    console.error("[enforceLimit] Stripe usage record:", res.status, err);
  }
}

/**
 * Enforce plan limit before performing an action.
 * - Under limit: returns { allowed: true }.
 * - At/over limit + allowOverage false (Starter): returns { allowed: false, error }.
 * - At/over limit + allowOverage true: reports overage to Stripe, then returns { allowed: true, overage: true }.
 */
export async function enforceLimit(
  employer: EmployerForEnforce,
  type: EnforceLimitType
): Promise<EnforceLimitResult> {
  const tier = normalizeTier(employer.plan_tier);
  const limits = getPlanLimits(employer.plan_tier);
  const max = type === "reports" ? limits.reports : type === "searches" ? limits.searches : limits.seats;
  const used = getUsed(employer, type);

  if (max === -1) return { allowed: true };
  if (used < max) return { allowed: true };

  // Limit exceeded
  if (!limits.allowOverage) {
    return {
      allowed: false,
      error: "Plan limit reached. Upgrade to continue.",
    };
  }

  // Overage billing: report to Stripe then allow
  const itemId = getOverageItemId(employer, type);
  if (itemId) {
    await reportOverageToStripe(itemId, 1);
  }
  return { allowed: true, overage: true };
}
