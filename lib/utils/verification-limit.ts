/**
 * Verification Limit Utilities
 * Handles checking and tracking verification limits for Basic employers
 */

import { createServerSupabase } from '@/lib/supabase/server'

export interface VerificationLimitResult {
  canVerify: boolean
  currentCount: number
  limit: number
  message?: string
}

/**
 * Check if employer can perform a verification
 * Basic plan: 10 verifications/month
 * Pro: Unlimited
 */
export async function checkVerificationLimit(
  employerId: string
): Promise<VerificationLimitResult> {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Get employer account to check plan tier
  type EmployerAccountRow = { plan_tier: string }
  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('plan_tier')
    .eq('id', employerId)
    .single()

  if (!employerAccount) {
    return {
      canVerify: false,
      currentCount: 0,
      limit: 0,
      message: 'Employer account not found',
    }
  }

  const planTier = (employerAccount as EmployerAccountRow).plan_tier

  // Pro has unlimited verifications
  if (planTier === 'pro') {
    return {
      canVerify: true,
      currentCount: 0,
      limit: 999999, // Unlimited
    }
  }

  // Basic plan: 10 verifications per month
  const limit = 10

  // Get current month's verification count
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Check verification_requests table for this employer in current month
  const { data: verifications, error } = await supabaseAny
    .from('verification_requests')
    .select('id')
    .eq('employer_id', employerId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())

  if (error) {
    console.error('Error checking verification limit:', error)
    return {
      canVerify: false,
      currentCount: 0,
      limit,
      message: 'Error checking verification limit',
    }
  }

  const currentCount = verifications?.length || 0
  const canVerify = currentCount < limit

  return {
    canVerify,
    currentCount,
    limit,
    message: canVerify
      ? undefined
      : `You've reached your monthly limit of ${limit} verifications. Upgrade to Pro for unlimited verifications.`,
  }
}

/**
 * Record a verification (call this after successful verification)
 */
export async function recordVerification(employerId: string): Promise<void> {
  // The verification is already recorded in verification_requests table
  // This function is here for future use if we need additional tracking
  // For now, the checkVerificationLimit function reads from verification_requests
}
