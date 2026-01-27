// Re-export from centralized stripe.ts for backward compatibility
export { stripe } from '@/lib/stripe'

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

export const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC || ''
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || ''
