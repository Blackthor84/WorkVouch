import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null

export const isStripeConfigured = !!(
  process.env.STRIPE_SECRET_KEY &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
)

export const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC || ''
export const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO || ''
