// Re-export from centralized stripe.ts for backward compatibility
export { stripe } from '@/lib/stripe'

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

// Standardized Stripe Price IDs - use canonical names
export const STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER || ''
export const STRIPE_PRICE_TEAM = process.env.STRIPE_PRICE_TEAM || ''
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || ''
export const STRIPE_PRICE_SECURITY = process.env.STRIPE_PRICE_SECURITY || ''
export const STRIPE_PRICE_ONE_TIME = process.env.STRIPE_PRICE_ONE_TIME || ''
