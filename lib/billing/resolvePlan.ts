import type { PlanKey } from "./plan";

/** Map Stripe Price IDs to internal plan. Replace with your real Stripe price IDs. */
const PRICE_ID_TO_PLAN: Record<string, PlanKey> = {
  price_free: "free",
  price_starter: "starter",
  price_pro: "pro",
  price_enterprise: "enterprise",
};

export function resolvePlanFromStripe(priceId?: string | null): PlanKey {
  if (!priceId) return "free";
  return PRICE_ID_TO_PLAN[priceId] ?? "free";
}
