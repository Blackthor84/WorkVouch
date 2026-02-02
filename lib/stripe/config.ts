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

// Monthly/Yearly subscription price IDs (whitelist for checkout)
export const PRICE_ID_STARTER_MONTHLY = process.env.STRIPE_PRICE_STARTER_MONTHLY || process.env.PRICE_ID_STARTER_MONTHLY || process.env.STRIPE_PRICE_STARTER || ''
export const PRICE_ID_STARTER_YEARLY = process.env.STRIPE_PRICE_STARTER_YEARLY || process.env.PRICE_ID_STARTER_YEARLY || ''
export const PRICE_ID_GROWTH_MONTHLY = process.env.STRIPE_PRICE_GROWTH_MONTHLY || process.env.PRICE_ID_GROWTH_MONTHLY || process.env.STRIPE_PRICE_TEAM || ''
export const PRICE_ID_GROWTH_YEARLY = process.env.STRIPE_PRICE_GROWTH_YEARLY || process.env.PRICE_ID_GROWTH_YEARLY || ''
export const PRICE_ID_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.PRICE_ID_PRO_MONTHLY || process.env.STRIPE_PRICE_PRO || ''
export const PRICE_ID_PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY || process.env.PRICE_ID_PRO_YEARLY || ''

/** Whitelist of allowed price IDs for checkout (must start with price_) */
export const STRIPE_WHITELISTED_PRICE_IDS: string[] = [
  PRICE_ID_STARTER_MONTHLY,
  PRICE_ID_STARTER_YEARLY,
  PRICE_ID_GROWTH_MONTHLY,
  PRICE_ID_GROWTH_YEARLY,
  PRICE_ID_PRO_MONTHLY,
  PRICE_ID_PRO_YEARLY,
].filter((id): id is string => typeof id === 'string' && id.length > 0 && id.startsWith('price_'))

export function isPriceIdWhitelisted(priceId: string | undefined): boolean {
  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) return false
  return STRIPE_WHITELISTED_PRICE_IDS.includes(priceId)
}

/** Lookup quota by tier: lite 5, pro unlimited (-1), custom unlimited. */
export function getLookupQuotaForTier(tier: string): number {
  const t = (tier || '').toLowerCase()
  if (t === 'pro' || t === 'custom') return -1
  return 5 // lite, free, or unknown
}

/** Canonical price map for subscriptions (starter, team, pro) and one-time */
export const STRIPE_PRICE_MAP: Record<string, string> = {
  starter: STRIPE_PRICE_STARTER || PRICE_ID_STARTER_MONTHLY,
  team: STRIPE_PRICE_TEAM || PRICE_ID_GROWTH_MONTHLY,
  growth: PRICE_ID_GROWTH_MONTHLY,
  pro: STRIPE_PRICE_PRO || PRICE_ID_PRO_MONTHLY,
  security: STRIPE_PRICE_SECURITY,
  one_time: STRIPE_PRICE_ONE_TIME,
}

/** Security Bundle price ID (alias). Maps to plan_tier = "security_agency". */
export const STRIPE_PRICE_SECURITY_BUNDLE = process.env.STRIPE_PRICE_SECURITY_BUNDLE || process.env.STRIPE_PRICE_SECURITY || "";

/** Map Stripe price ID → plan_tier for webhooks. Standardized: lite, pro, custom (custom has no Stripe price). */
export function getPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (STRIPE_PRICE_STARTER) map[STRIPE_PRICE_STARTER] = "lite";
  if (STRIPE_PRICE_TEAM) map[STRIPE_PRICE_TEAM] = "pro";
  if (STRIPE_PRICE_PRO) map[STRIPE_PRICE_PRO] = "pro";
  if (PRICE_ID_GROWTH_MONTHLY) map[PRICE_ID_GROWTH_MONTHLY] = "pro";
  if (PRICE_ID_GROWTH_YEARLY) map[PRICE_ID_GROWTH_YEARLY] = "pro";
  if (STRIPE_PRICE_SECURITY) map[STRIPE_PRICE_SECURITY] = "security_agency";
  if (STRIPE_PRICE_SECURITY_BUNDLE && !map[STRIPE_PRICE_SECURITY_BUNDLE]) map[STRIPE_PRICE_SECURITY_BUNDLE] = "security_agency";
  return map;
}

/** Resolve plan_tier from a Stripe subscription (first price ID). Returns "lite" if no match. */
export function getTierFromSubscription(subscription: { items?: { data?: Array<{ price?: { id?: string } }> } }): string {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) return "lite";
  const tier = getPriceToTierMap()[priceId];
  return tier ?? "lite";
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
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXTAUTH_URL ||
    (typeof process.env.VERCEL_URL === 'string' ? `https://${process.env.VERCEL_URL}` : null) ||
    origin ||
    'http://localhost:3000'
  return base.replace(/\/$/, '')
}
