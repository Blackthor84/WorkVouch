'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth, hasRole } from '@/lib/auth'

/**
 * Check if employer has access to a candidate's report
 * Checks subscriptions first, then one-time purchases
 */
export async function hasPurchasedReport(candidateId: string) {
  const user = await requireAuth()
  const isEmployer = await hasRole('employer')
  
  if (!isEmployer) {
    return false
  }

  const supabase = await createServerSupabase()

  // First check if they have a subscription with available quota
  const supabaseAny = supabase as any
  const { data: quotaCheck } = await supabaseAny.rpc('check_employer_lookup_quota', {
    p_employer_id: user.id,
  })

  if (quotaCheck === true) {
    // Has subscription with quota, check if they've already looked up this candidate
    const { data: existingLookup } = await supabaseAny
      .from('employer_lookups')
      .select('id')
      .eq('employer_id', user.id)
      .eq('candidate_id', candidateId)
      .limit(1)
      .single()

    // If they have quota and haven't looked up this candidate, they have access
    // (we'll record the lookup when they actually view it)
    return true
  }

  // Fall back to checking one-time purchases
  const { data, error } = await supabaseAny
    .from('employer_purchases')
    .select('id')
    .eq('employer_id', user.id)
    .eq('candidate_id', candidateId)
    .eq('status', 'completed')
    .single()

  return !error && !!data
}

/**
 * Get employer's purchase history
 */
export async function getEmployerPurchases() {
  const user = await requireAuth()
  const isEmployer = await hasRole('employer')
  
  if (!isEmployer) {
    throw new Error('Only employers can view purchases')
  }

  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data: purchases, error } = await supabaseAny
    .from('employer_purchases')
    .select(`
      *,
      candidate:profiles!employer_purchases_candidate_id_fkey (
        id,
        full_name,
        email,
        city,
        state
      )
    `)
    .eq('employer_id', user.id)
    .order('purchased_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch purchases: ${error.message}`)
  }

  return purchases || []
}

/**
 * Get candidate report data (only if purchased)
 */
export async function getCandidateReport(candidateId: string) {
  const user = await requireAuth()
  const isEmployer = await hasRole('employer')
  
  if (!isEmployer) {
    throw new Error('Only employers can view reports')
  }

  // Check if has access (subscription or purchase)
  const hasAccess = await hasPurchasedReport(candidateId)
  
  if (!hasAccess) {
    throw new Error('Report not purchased. Please purchase to view or subscribe to a plan.')
  }

  // Record lookup if using subscription
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any
  const { data: quotaCheck } = await supabaseAny.rpc('check_employer_lookup_quota', {
    p_employer_id: user.id,
  })

  if (quotaCheck === true) {
    // Record the lookup for subscription tracking
    await supabaseAny.rpc('record_employer_lookup', {
      p_employer_id: user.id,
      p_candidate_id: candidateId,
      p_lookup_type: 'report',
    })
  }

  // Get full candidate data
  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  const { data: jobs } = await supabaseAny
    .from('jobs')
    .select('*')
    .eq('user_id', candidateId)
    .order('start_date', { ascending: false })

  const { data: references } = await supabaseAny
    .from('references')
    .select(`
      *,
      from_user:profiles!references_from_user_id_fkey (
        id,
        full_name,
        email
      ),
      job:jobs!references_job_id_fkey (
        id,
        company_name,
        job_title
      )
    `)
    .eq('to_user_id', candidateId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const { data: trustScore } = await supabaseAny
    .from('trust_scores')
    .select('*')
    .eq('user_id', candidateId)
    .single()

  return {
    profile,
    jobs: jobs || [],
    references: references || [],
    trustScore,
  }
}

/**
 * Record employer lookup and return candidate profile
 * Checks access (subscription quota or one-time purchase) before returning profile
 */
export const recordEmployerLookup = async (userId: string, candidateId: string) => {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // First check if they have a subscription with available quota
  const { data: quotaCheck } = await supabaseAny.rpc('check_employer_lookup_quota', {
    p_employer_id: userId
  })

  let hasAccess = false

  if (quotaCheck === true) {
    // Has subscription with quota - record the lookup
    await supabaseAny.rpc('record_employer_lookup', {
      p_employer_id: userId,
      p_candidate_id: candidateId,
      p_lookup_type: 'report'
    })
    hasAccess = true
  } else {
    // Check if they have a one-time purchase for this candidate
    const { data: purchase, error } = await supabaseAny
      .from('employer_purchases')
      .select('id')
      .eq('employer_id', userId)
      .eq('candidate_id', candidateId)
      .eq('status', 'completed')
      .single()

    hasAccess = !error && !!purchase
  }

  if (!hasAccess) {
    throw new Error('Access denied. Please purchase this report or subscribe to a plan with available quota.')
  }

  // Get and return the profile
  const { data: profile, error: profileError } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (profileError || !profile) {
    throw new Error('Candidate profile not found')
  }

  return profile
}
