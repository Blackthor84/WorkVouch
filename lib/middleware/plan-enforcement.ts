// This file is deprecated - use plan-enforcement-supabase.ts instead
// Keeping for backward compatibility but redirecting to Supabase version

import { canFileDispute as canFileDisputeSupabase } from './plan-enforcement-supabase'
import { createServerSupabase } from '@/lib/supabase/server'

export type PlanTier = 'free' | 'basic' | 'pro'

export async function checkEmployerPlan(employerId: string): Promise<{
  hasAccess: boolean
  planTier: PlanTier
  message?: string
}> {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any
  
  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('plan_tier')
    .eq('id', employerId)
    .single()

  if (!employerAccount) {
    return {
      hasAccess: false,
      planTier: 'free',
      message: 'Employer account not found',
    }
  }

  const planTier = (employerAccount as any).plan_tier || 'free'

  if (planTier === 'free') {
    return {
      hasAccess: false,
      planTier: 'free',
      message: 'This feature requires a paid plan. Please upgrade to Basic or Pro.',
    }
  }

  return {
    hasAccess: true,
    planTier: planTier as PlanTier,
  }
}

export async function canFileDispute(employerId: string): Promise<boolean> {
  // Use Supabase version
  return canFileDisputeSupabase(employerId)
}

export async function canViewEmployees(employerId: string): Promise<boolean> {
  const { hasAccess } = await checkEmployerPlan(employerId)
  return hasAccess
}

export async function canRequestVerification(employerId: string): Promise<boolean> {
  const { hasAccess } = await checkEmployerPlan(employerId)
  return hasAccess
}
