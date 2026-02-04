// Re-export from centralized stripe.ts for backward compatibility
export { stripe } from "@/lib/stripe";

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK)
);

// Canonical employer plans: starter, pro, custom only.
export const STRIPE_PRICE_STARTER_MONTHLY =
  process.env.STRIPE_PRICE_STARTER_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY || "";
export const STRIPE_PRICE_STARTER_YEARLY =
  process.env.STRIPE_PRICE_STARTER_YEARLY || process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY || "";
export const STRIPE_PRICE_PRO_MONTHLY =
  process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || "";
export const STRIPE_PRICE_PRO_YEARLY =
  process.env.STRIPE_PRICE_PRO_YEARLY || process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY || "";
export const STRIPE_PRICE_ONE_TIME = process.env.STRIPE_PRICE_ONE_TIME || "";
export const STRIPE_PRICE_REPORT_OVERAGE = process.env.STRIPE_PRICE_REPORT_OVERAGE || "";
export const STRIPE_PRICE_SEARCH_OVERAGE = process.env.STRIPE_PRICE_SEARCH_OVERAGE || "";
export const STRIPE_PRICE_SEAT_OVERAGE = process.env.STRIPE_PRICE_SEAT_OVERAGE || "";

/** Whitelist of allowed price IDs for checkout (must start with price_). Only starter + pro monthly/yearly. */
export const STRIPE_WHITELISTED_PRICE_IDS: string[] = [
  STRIPE_PRICE_STARTER_MONTHLY,
  STRIPE_PRICE_STARTER_YEARLY,
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_PRO_YEARLY,
].filter((id): id is string => typeof id === "string" && id.length > 0 && id.startsWith("price_"));

export function isPriceIdWhitelisted(priceId: string | undefined): boolean {
  if (!priceId || typeof priceId !== "string" || !priceId.startsWith("price_")) return false;
  return STRIPE_WHITELISTED_PRICE_IDS.includes(priceId);
}

/** Lookup quota by tier: starter 25/15, pro 100/75, custom unlimited (-1). */
export function getLookupQuotaForTier(tier: string): number {
  const t = (tier || "").toLowerCase();
  if (t === "pro" || t === "custom") return -1;
  return 5; // starter, free, or unknown
}

/** Canonical price map: starter, pro only (custom = contact sales). */
export const STRIPE_PRICE_MAP: Record<string, string> = {
  starter: STRIPE_PRICE_STARTER_MONTHLY,
  pro: STRIPE_PRICE_PRO_MONTHLY,
};

/** Map Stripe price ID → canonical plan_tier for webhooks. Starter, pro, custom only. */
export function getPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (STRIPE_PRICE_STARTER_MONTHLY) map[STRIPE_PRICE_STARTER_MONTHLY] = "starter";
  if (STRIPE_PRICE_STARTER_YEARLY) map[STRIPE_PRICE_STARTER_YEARLY] = "starter";
  if (STRIPE_PRICE_PRO_MONTHLY) map[STRIPE_PRICE_PRO_MONTHLY] = "pro";
  if (STRIPE_PRICE_PRO_YEARLY) map[STRIPE_PRICE_PRO_YEARLY] = "pro";
  return map;
}

/** Resolve plan_tier from a Stripe subscription (first price ID). Returns "starter" if no match. */
export function getTierFromSubscription(subscription: {
  items?: { data?: Array<{ price?: { id?: string } }> };
}): string {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) return "starter";
  const tier = getPriceToTierMap()[priceId];
  return tier ?? "starter";
}

/** Get metered subscription item IDs from a subscription for overage billing. */
export function getMeteredSubscriptionItemIds(subscription: {
  items?: { data?: Array<{ id: string; price?: { id?: string } }> };
}): {
  reportOverageItemId: string | null;
  searchOverageItemId: string | null;
  seatOverageItemId: string | null;
} {
  const reportId = process.env.STRIPE_PRICE_REPORT_OVERAGE || "";
  const searchId = process.env.STRIPE_PRICE_SEARCH_OVERAGE || "";
  const seatId = process.env.STRIPE_PRICE_SEAT_OVERAGE || "";
  let reportOverageItemId: string | null = null;
  let searchOverageItemId: string | null = null;
  let seatOverageItemId: string | null = null;
  for (const item of subscription.items?.data ?? []) {
    const pid = item.price?.id;
    if (pid === reportId) reportOverageItemId = item.id;
    if (pid === searchId) searchOverageItemId = item.id;
    if (pid === seatId) seatOverageItemId = item.id;
  }
  return { reportOverageItemId, searchOverageItemId, seatOverageItemId };
}

/** Log missing price IDs (server-side). Canonical: starter, pro monthly/yearly. */
export function logMissingStripePriceIds(): void {
  const missing: string[] = [];
  if (!STRIPE_PRICE_STARTER_MONTHLY) missing.push("STRIPE_PRICE_STARTER_MONTHLY or NEXT_PUBLIC_STRIPE_STARTER_MONTHLY");
  if (!STRIPE_PRICE_STARTER_YEARLY) missing.push("STRIPE_PRICE_STARTER_YEARLY or NEXT_PUBLIC_STRIPE_STARTER_YEARLY");
  if (!STRIPE_PRICE_PRO_MONTHLY) missing.push("STRIPE_PRICE_PRO_MONTHLY or NEXT_PUBLIC_STRIPE_PRO_MONTHLY");
  if (!STRIPE_PRICE_PRO_YEARLY) missing.push("STRIPE_PRICE_PRO_YEARLY or NEXT_PUBLIC_STRIPE_PRO_YEARLY");
  if (missing.length > 0) {
    console.error("[Stripe] Missing price ID env vars:", missing.join(", "));
  }
}

/** Environment-safe base URL for success/cancel redirects. No trailing slash. */
export function getCheckoutBaseUrl(origin?: string | null): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    (typeof process.env.VERCEL_URL === "string" ? `https://${process.env.VERCEL_URL}` : null) ||
    origin ||
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}
