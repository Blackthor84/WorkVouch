import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Check if employer can view employees (Basic or Pro plan)
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

  const employerAccountAny = employerAccount as any
  return employerAccountAny.plan_tier === 'basic' || employerAccountAny.plan_tier === 'pro'
}

/**
 * Check if employer can file disputes (Pro plan only)
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

  const employerAccountAny = employerAccount as any
  return employerAccountAny.plan_tier === 'pro'
}

/**
 * Check if employer can request verification (Basic or Pro plan)
 */
export async function canRequestVerification(userId: string): Promise<boolean> {
  return canViewEmployees(userId) // Same requirement
}
