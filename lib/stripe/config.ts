// Re-export from centralized stripe.ts for backward compatibility
export { stripe } from '@/lib/stripe'

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK)
)

// Canonical employer plans: lite, pro, enterprise only. Use lib/pricing/employer-plans for config.
export const STRIPE_PRICE_LITE_MONTHLY = process.env.STRIPE_PRICE_LITE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_LITE_MONTHLY || ''
export const STRIPE_PRICE_PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY || ''
export const STRIPE_PRICE_ENTERPRISE_MONTHLY = process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY || ''
export const STRIPE_PRICE_ONE_TIME = process.env.STRIPE_PRICE_ONE_TIME || ''
export const STRIPE_PRICE_REPORT_OVERAGE = process.env.STRIPE_PRICE_REPORT_OVERAGE || ''
export const STRIPE_PRICE_SEARCH_OVERAGE = process.env.STRIPE_PRICE_SEARCH_OVERAGE || ''
export const STRIPE_PRICE_SEAT_OVERAGE = process.env.STRIPE_PRICE_SEAT_OVERAGE || ''

// Legacy env (migration): map to canonical plans
const LEGACY_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || process.env.STRIPE_PRICE_STARTER_MONTHLY || process.env.PRICE_ID_STARTER_MONTHLY || ''
const LEGACY_PRICE_TEAM = process.env.STRIPE_PRICE_TEAM || process.env.STRIPE_PRICE_GROWTH_MONTHLY || process.env.PRICE_ID_GROWTH_MONTHLY || ''
const LEGACY_PRICE_PRO = process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.PRICE_ID_PRO_MONTHLY || ''
const LEGACY_PRICE_SECURITY = process.env.STRIPE_PRICE_SECURITY || process.env.STRIPE_PRICE_SECURITY_BUNDLE || ''

/** Whitelist of allowed price IDs for checkout (must start with price_) */
export const STRIPE_WHITELISTED_PRICE_IDS: string[] = [
  STRIPE_PRICE_LITE_MONTHLY,
  STRIPE_PRICE_PRO_MONTHLY,
  STRIPE_PRICE_ENTERPRISE_MONTHLY,
  LEGACY_PRICE_STARTER,
  LEGACY_PRICE_TEAM,
  LEGACY_PRICE_PRO,
  LEGACY_PRICE_SECURITY,
].filter((id): id is string => typeof id === 'string' && id.length > 0 && id.startsWith('price_'))

export function isPriceIdWhitelisted(priceId: string | undefined): boolean {
  if (!priceId || typeof priceId !== 'string' || !priceId.startsWith('price_')) return false
  return STRIPE_WHITELISTED_PRICE_IDS.includes(priceId)
}/** Lookup quota by tier: lite 5, pro/enterprise unlimited (-1). */
export function getLookupQuotaForTier(tier: string): number {
  const t = (tier || '').toLowerCase()
  if (t === 'pro' || t === 'enterprise' || t === 'custom') return -1
  return 5 // lite, free, or unknown
}

/** Canonical price map: lite, pro, enterprise only. */
export const STRIPE_PRICE_MAP: Record<string, string> = {
  lite: STRIPE_PRICE_LITE_MONTHLY,
  pro: STRIPE_PRICE_PRO_MONTHLY,
  enterprise: STRIPE_PRICE_ENTERPRISE_MONTHLY,
  one_time: STRIPE_PRICE_ONE_TIME,
};

/** Map Stripe price ID → canonical plan_tier for webhooks. Legacy IDs map to lite/pro/enterprise. */
export function getPriceToTierMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (STRIPE_PRICE_LITE_MONTHLY) map[STRIPE_PRICE_LITE_MONTHLY] = "lite";
  if (STRIPE_PRICE_PRO_MONTHLY) map[STRIPE_PRICE_PRO_MONTHLY] = "pro";
  if (STRIPE_PRICE_ENTERPRISE_MONTHLY) map[STRIPE_PRICE_ENTERPRISE_MONTHLY] = "enterprise";
  if (LEGACY_PRICE_STARTER) map[LEGACY_PRICE_STARTER] = "lite";
  if (LEGACY_PRICE_TEAM) map[LEGACY_PRICE_TEAM] = "pro";
  if (LEGACY_PRICE_PRO) map[LEGACY_PRICE_PRO] = "pro";
  if (LEGACY_PRICE_SECURITY) map[LEGACY_PRICE_SECURITY] = "pro";
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

/** Log missing price IDs (server-side). Canonical: lite, pro, enterprise. */
export function logMissingStripePriceIds(): void {
  const missing: string[] = []
  if (!STRIPE_PRICE_LITE_MONTHLY) missing.push('STRIPE_PRICE_LITE_MONTHLY or NEXT_PUBLIC_STRIPE_LITE_MONTHLY')
  if (!STRIPE_PRICE_PRO_MONTHLY) missing.push('STRIPE_PRICE_PRO_MONTHLY or NEXT_PUBLIC_STRIPE_PRO_MONTHLY')
  if (!STRIPE_PRICE_ENTERPRISE_MONTHLY) missing.push('STRIPE_PRICE_ENTERPRISE_MONTHLY or NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY')
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