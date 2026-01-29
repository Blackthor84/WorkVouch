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

/** Canonical price map for subscriptions (starter, team, pro) and one-time */
export const STRIPE_PRICE_MAP: Record<string, string> = {
  starter: STRIPE_PRICE_STARTER,
  team: STRIPE_PRICE_TEAM,
  pro: STRIPE_PRICE_PRO,
  security: STRIPE_PRICE_SECURITY,
  one_time: STRIPE_PRICE_ONE_TIME,
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
