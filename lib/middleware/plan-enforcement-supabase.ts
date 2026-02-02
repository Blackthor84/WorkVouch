import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Check if employer can view employees (Pro or Custom plan). Standardized tiers: lite, pro, custom.
 */
export async function canViewEmployees(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('plan_tier')
    .eq('user_id', userId)
    .single()

  if (!employerAccount) {
    return false
  }

  const tier = (employerAccount as { plan_tier?: string }).plan_tier?.toLowerCase()
  return tier === 'pro' || tier === 'custom'
}

/**
 * Check if employer can file disputes (Pro or Custom plan only)
 */
export async function canFileDispute(userId: string): Promise<boolean> {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('plan_tier')
    .eq('user_id', userId)
    .single()

  if (!employerAccount) {
    return false
  }

  const tier = (employerAccount as { plan_tier?: string }).plan_tier?.toLowerCase()
  return tier === 'pro' || tier === 'custom'
}

/**
 * Check if employer can request verification (Basic or Pro plan)
 */
export async function canRequestVerification(userId: string): Promise<boolean> {
  return canViewEmployees(userId) // Same requirement
}
