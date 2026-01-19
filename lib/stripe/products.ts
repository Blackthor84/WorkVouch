/**
 * Stripe Product Configuration
 * These IDs should match the products created in your Stripe Dashboard
 */

export interface StripePrice {
  nickname: string
  currency: string
  unit_amount: number
  recurring?: {
    interval: 'month' | 'year'
  }
}

export interface StripeProduct {
  name: string
  description: string
  id: string
  prices: StripePrice[]
}

export const STRIPE_PRODUCTS: StripeProduct[] = [
  {
    name: 'PeerCV Starter',
    description: 'Perfect for job seekers starting their verified employment journey. Build your trust score with real coworker references and share a clean professional profile.',
    id: 'peer-starter-000',
    prices: [],
  },
  {
    name: 'PeerCV Pro',
    description: 'Unlock AI résumé tools, expanded coworker network requests, ATS optimization, and profile analytics. Perfect for active job seekers and people moving between industries.',
    id: 'peer-pro',
    prices: [
      {
        nickname: 'Monthly',
        currency: 'usd',
        unit_amount: 899, // $8.99
        recurring: { interval: 'month' },
      },
      {
        nickname: 'Yearly',
        currency: 'usd',
        unit_amount: 8400, // $84.00
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    name: 'PeerCV Elite',
    description: 'Designed for professionals who want the strongest verification and visibility. Includes Blue Verified Badge, unlimited coworker requests, premium themes, AI Career Coach, and anonymous employer browsing.',
    id: 'peer-elite',
    prices: [
      {
        nickname: 'Monthly',
        currency: 'usd',
        unit_amount: 1999, // $19.99
        recurring: { interval: 'month' },
      },
      {
        nickname: 'Yearly',
        currency: 'usd',
        unit_amount: 19800, // $198.00
        recurring: { interval: 'year' },
      },
    ],
  },
  {
    name: 'Employer Lite',
    description: '20 profile lookups/month with full access to verified work history, references, and candidate messaging.',
    id: 'emp-lite',
    prices: [
      {
        nickname: 'Monthly',
        currency: 'usd',
        unit_amount: 4900, // $49.00
        recurring: { interval: 'month' },
      },
    ],
  },
  {
    name: 'Employer Pro',
    description: 'Unlimited profiles, references, messaging, and job posting boosts. Perfect for growing businesses.',
    id: 'emp-pro',
    prices: [
      {
        nickname: 'Monthly',
        currency: 'usd',
        unit_amount: 19900, // $199.00
        recurring: { interval: 'month' },
      },
    ],
  },
  {
    name: 'Employer Enterprise',
    description: 'Unlimited lookups, custom API access, turnover insights, and dedicated account support.',
    id: 'emp-enterprise',
    prices: [
      {
        nickname: 'Monthly',
        currency: 'usd',
        unit_amount: 49900, // $499.00
        recurring: { interval: 'month' },
      },
    ],
  },
  {
    name: 'Pay-Per-Lookup',
    description: 'Simple pay-as-you-go access to one verified candidate profile.',
    id: 'lookup',
    prices: [
      {
        nickname: 'Single Lookup',
        currency: 'usd',
        unit_amount: 799, // $7.99
      },
    ],
  },
]

// Helper to get product by ID
export function getProductById(id: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS.find((p) => p.id === id)
}

// Helper to get user tier products
export function getUserProducts(): StripeProduct[] {
  return STRIPE_PRODUCTS.filter((p) => p.id.startsWith('peer-'))
}

// Helper to get employer tier products
export function getEmployerProducts(): StripeProduct[] {
  return STRIPE_PRODUCTS.filter((p) => p.id.startsWith('emp-'))
}

// Map Stripe product ID to subscription tier
export function productIdToTier(productId: string): string {
  const mapping: Record<string, string> = {
    'peer-starter-000': 'starter',
    'peer-pro': 'pro',
    'peer-elite': 'elite',
    'emp-lite': 'emp_lite',
    'emp-pro': 'emp_pro',
    'emp-enterprise': 'emp_enterprise',
  }
  return mapping[productId] || 'starter'
}

// Map subscription tier to product ID
export function tierToProductId(tier: string): string {
  const mapping: Record<string, string> = {
    starter: 'peer-starter-000',
    pro: 'peer-pro',
    elite: 'peer-elite',
    emp_lite: 'emp-lite',
    emp_pro: 'emp-pro',
    emp_enterprise: 'emp-enterprise',
  }
  return mapping[tier] || 'peer-starter-000'
}
