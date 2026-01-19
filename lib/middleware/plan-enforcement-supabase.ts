import { createServerClient } from '@/lib/supabase/server'

/**
 * Check if employer can view employees (Basic or Pro plan)
 */
export async function canViewEmployees(userId: string): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { data: employerAccount } = await supabase
    .from('employer_accounts')
    .select('plan_tier')
    .eq('user_id', userId)
    .single()

  if (!employerAccount) {
    return false
  }

  return employerAccount.plan_tier === 'basic' || employerAccount.plan_tier === 'pro'
}

/**
 * Check if employer can file disputes (Pro plan only)
 */
export async function canFileDispute(userId: string): Promise<boolean> {
  const supabase = await createServerClient()
  
  const { data: employerAccount } = await supabase
    .from('employer_accounts')
    .select('plan_tier')
    .eq('user_id', userId)
    .single()

  if (!employerAccount) {
    return false
  }

  return employerAccount.plan_tier === 'pro'
}

/**
 * Check if employer can request verification (Basic or Pro plan)
 */
export async function canRequestVerification(userId: string): Promise<boolean> {
  return canViewEmployees(userId) // Same requirement
}
