'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Get user subscription tier by userId
 * Returns: 'free', 'pro', or 'elite'
 * 
 * Usage:
 * const tier = await getUserSubscription(userId);
 * if (tier !== "elite") return <UpgradePrompt />;
 */
export async function getUserSubscription(userId: string): Promise<'free' | 'pro' | 'elite'> {
  const supabase = await createServerClient()

  // Get stripe_customer_id from profile
  const supabaseAny = supabase as any
  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile || !(profile as any).stripe_customer_id) {
    return 'free'
  }

  // Get active subscription from subscriptions table
  const { data: subscription } = await supabaseAny
    .from('subscriptions')
    .select('price_id, status')
    .eq('stripe_customer_id', (profile as any).stripe_customer_id)
    .eq('status', 'active')
    .single()

  if (!subscription || (subscription as any).status !== 'active') {
    return 'free'
  }

  // Determine tier from price_id
  const priceId = (subscription as any).price_id?.toLowerCase() || ''
  if (priceId.includes('elite')) return 'elite'
  if (priceId.includes('pro')) return 'pro'

  return 'free'
}

/**
 * Check if user has a specific subscription tier or higher
 * 
 * Usage:
 * const hasPro = await hasTierOrHigher(userId, 'pro'); // true for pro or elite
 * const hasElite = await hasTierOrHigher(userId, 'elite'); // true only for elite
 */
export async function hasTierOrHigher(
  userId: string,
  requiredTier: 'pro' | 'elite'
): Promise<boolean> {
  const tier = await getUserSubscription(userId)

  if (requiredTier === 'elite') {
    return tier === 'elite'
  }

  if (requiredTier === 'pro') {
    return tier === 'pro' || tier === 'elite'
  }

  return false
}
