'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { stripe, isStripeConfigured } from '@/lib/stripe/config'
import { productIdToTier } from '@/lib/stripe/products'
import { revalidatePath } from 'next/cache'

/**
 * Get user's current subscription
 */
export async function getUserSubscription() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get stripe_customer_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return null
  }

  // Get subscription by customer_id (matching the pattern)
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('stripe_customer_id', profile.stripe_customer_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // Also try by user_id as fallback
    const { data: fallbackSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return fallbackSub || null
  }

  return subscription || null
}

/**
 * Get user's subscription tier
 * Returns: 'free', 'pro', or 'elite'
 */
export async function getUserSubscriptionTier() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get stripe_customer_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return 'free'
  }

  // Get active subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_price_id, status')
    .eq('stripe_customer_id', profile.stripe_customer_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription || subscription.status !== 'active') {
    return 'free'
  }

  // Determine tier from price_id
  const priceId = subscription.stripe_price_id?.toLowerCase() || ''
  if (priceId.includes('elite')) return 'elite'
  if (priceId.includes('pro')) return 'pro'

  // Fallback: check tier column if available
  const { data: subWithTier } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('stripe_customer_id', profile.stripe_customer_id)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (subWithTier?.tier) {
    const tier = subWithTier.tier as string
    if (tier === 'elite') return 'elite'
    if (tier === 'pro') return 'pro'
  }

  return 'free'
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createSubscriptionCheckout(
  priceId: string,
  productId: string
) {
  const user = await requireAuth()

  const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      productId,
      mode: 'subscription',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const data = await response.json()
  return {
    sessionId: data.sessionId,
    url: data.url,
  }
}

/**
 * Create Stripe Checkout Session for one-time payment (pay-per-lookup)
 */
export async function createOneTimeCheckout(
  priceId: string,
  candidateId?: string
) {
  const user = await requireAuth()

  const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      candidateId,
      mode: 'payment',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const data = await response.json()
  return {
    sessionId: data.sessionId,
    url: data.url,
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Verify ownership
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_subscription_id')
    .eq('id', subscriptionId)
    .eq('user_id', user.id)
    .single()

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  // Cancel in Stripe
  if (subscription.stripe_subscription_id && isStripeConfigured && stripe) {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })
  } else if (subscription.stripe_subscription_id && !isStripeConfigured) {
    // Stripe not configured - just update database
    console.warn('Stripe not configured - subscription cancellation will only update database')
  }

  // Update in database
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId)

  if (error) {
    throw new Error(`Failed to cancel subscription: ${error.message}`)
  }

  revalidatePath('/dashboard')
}

/**
 * Get employer lookup usage for current period
 */
export async function getEmployerLookupUsage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get active subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('id, tier, current_period_start, current_period_end')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing'])
    .in('tier', ['emp_lite', 'emp_pro', 'emp_enterprise'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!subscription) {
    return {
      used: 0,
      limit: 0,
      tier: 'none',
    }
  }

  // Get quota based on tier
  let limit = 0
  switch (subscription.tier) {
    case 'emp_enterprise':
      limit = 999999 // Unlimited
      break
    case 'emp_pro':
      limit = 100
      break
    case 'emp_lite':
      limit = 20
      break
  }

  // Count lookups in current period
  const { count } = await supabase
    .from('employer_lookups')
    .select('*', { count: 'exact', head: true })
    .eq('employer_id', user.id)
    .eq('subscription_id', subscription.id)

  return {
    used: count || 0,
    limit,
    tier: subscription.tier,
    periodEnd: subscription.current_period_end,
  }
}
