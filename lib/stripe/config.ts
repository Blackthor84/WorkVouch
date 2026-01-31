// Re-export from centralized stripe.ts for backward compatibility
export { stripe } from '@/lib/stripe'

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK)
)

// Standardized Stripe Price IDs - use canonical env names only (no test/live hardcoding)
export const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || ''
export const STRIPE_PRICE_TEAM = process.env.STRIPE_PRICE_TEAM || ''
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || ''
export const STRIPE_PRICE_SECURITY = process.env.STRIPE_PRICE_SECURITY || ''
export const STRIPE_PRICE_ONE_TIME = process.env.STRIPE_PRICE_ONE_TIME || ''
export const STRIPE_PRICE_REPORT_OVERAGE = process.env.STRIPE_PRICE_REPORT_OVERAGE || ''
export const STRIPE_PRICE_SEARCH_OVERAGE = process.env.STRIPE_PRICE_SEARCH_OVERAGE || ''
export const STRIPE_PRICE_SEAT_OVERAGE = process.env.STRIPE_PRICE_SEAT_OVERAGE || ''

/** Canonical price map for subscriptions (starter, team, pro) and one-time */
export const STRIPE_PRICE_MAP: Record<string, string> = {
  starter: STRIPE_PRICE_STARTER,
  team: STRIPE_PRICE_TEAM,
  pro: STRIPE_PRICE_PRO,
  security: STRIPE_PRICE_SECURITY,
  one_time: STRIPE_PRICE_ONE_TIME,
}

/** Security Bundle price ID (alias). Maps to plan_tier = "security_agency". */
export const STRIPE_PRICE_SECURITY_BUNDLE = process.env.STRIPE_PRICE_SECURITY_BUNDLE || process.env.STRIPE_PRICE_SECURITY || "";

/** Map Stripe price ID → plan_tier for webhooks. Used to set employer_accounts.plan_tier. */
export function getPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (STRIPE_PRICE_STARTER) map[STRIPE_PRICE_STARTER] = "starter";
  if (STRIPE_PRICE_TEAM) map[STRIPE_PRICE_TEAM] = "team";
  if (STRIPE_PRICE_PRO) map[STRIPE_PRICE_PRO] = "pro";
  if (STRIPE_PRICE_SECURITY) map[STRIPE_PRICE_SECURITY] = "security_agency";
  if (STRIPE_PRICE_SECURITY_BUNDLE && !map[STRIPE_PRICE_SECURITY_BUNDLE]) map[STRIPE_PRICE_SECURITY_BUNDLE] = "security_agency";
  return map;
}

/** Resolve plan_tier from a Stripe subscription (first price ID). Returns "starter" if no match. */
export function getTierFromSubscription(subscription: { items?: { data?: Array<{ price?: { id?: string } }> } }): string {
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
  const reportId = process.env.STRIPE_PRICE_REPORT_OVERAGE || '';
  const searchId = process.env.STRIPE_PRICE_SEARCH_OVERAGE || '';
  const seatId = process.env.STRIPE_PRICE_SEAT_OVERAGE || '';
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

/** Log missing price IDs (server-side). Call at startup or when creating checkout. */
export function logMissingStripePriceIds(): void {
  const missing: string[] = []
  if (!STRIPE_PRICE_STARTER) missing.push('STRIPE_PRICE_STARTER')
  if (!STRIPE_PRICE_TEAM) missing.push('STRIPE_PRICE_TEAM')
  if (!STRIPE_PRICE_PRO) missing.push('STRIPE_PRICE_PRO')
  if (!STRIPE_PRICE_SECURITY) missing.push('STRIPE_PRICE_SECURITY')
  if (!STRIPE_PRICE_ONE_TIME) missing.push('STRIPE_PRICE_ONE_TIME')
  if (missing.length > 0) {
    console.error('[Stripe] Missing price ID env vars:', missing.join(', '))
  }
}

/** Environment-safe base URL for success/cancel redirects. No trailing slash. */
export function getCheckoutBaseUrl(origin?: string | null): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    (typeof process.env.VERCEL_URL === 'string' ? `https://${process.env.VERCEL_URL}` : null) ||
    origin ||
    'http://localhost:3000'
  return base.replace(/\/$/, '')
}
