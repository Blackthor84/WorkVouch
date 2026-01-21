'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

/**
 * Get user subscription tier (exact match to provided code pattern)
 * Returns: 'free', 'pro', or 'elite'
 * Uses the subscriptions table (simple version)
 */
export async function getUserSubscriptionTierSimple() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get stripe_customer_id from profile
  const supabaseAny = supabase as any
  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile || !(profile as any).stripe_customer_id) {
    return 'free'
  }

  // Get active subscription from subscriptions table (matching your code)
  const { data: subscription } = await supabaseAny
    .from('subscriptions')
    .select('price_id, status')
    .eq('stripe_customer_id', (profile as any).stripe_customer_id)
    .eq('status', 'active')
    .single()

  if (!subscription || (subscription as any).status !== 'active') {
    return 'free'
  }

  // Determine tier from price_id (matching your code)
  const priceId = (subscription as any).price_id?.toLowerCase() || ''
  if (priceId.includes('elite')) return 'elite'
  if (priceId.includes('pro')) return 'pro'

  return 'free'
}

/**
 * Get user subscription tier by userId (for server-side use)
 * Returns: 'free', 'pro', or 'elite'
 */
export async function getUserSubscriptionTierByUserId(userId: string) {
  const supabase = await createServerClient()
  const supabaseAny = supabase as any

  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile || !(profile as any).stripe_customer_id) {
    return 'free'
  }

  const { data: subscription } = await supabaseAny
    .from('subscriptions')
    .select('price_id, status')
    .eq('stripe_customer_id', (profile as any).stripe_customer_id)
    .eq('status', 'active')
    .single()

  if (!subscription || (subscription as any).status !== 'active') {
    return 'free'
  }

  const priceId = (subscription as any).price_id?.toLowerCase() || ''
  if (priceId.includes('elite')) return 'elite'
  if (priceId.includes('pro')) return 'pro'

  return 'free'
}

/**
 * Check if user has a specific subscription tier
 */
export async function hasSubscriptionTier(tier: 'pro' | 'elite'): Promise<boolean> {
  const currentTier = await getUserSubscriptionTierSimple()
  
  if (tier === 'elite') {
    return currentTier === 'elite'
  }
  
  if (tier === 'pro') {
    return currentTier === 'pro' || currentTier === 'elite'
  }
  
  return false
}
