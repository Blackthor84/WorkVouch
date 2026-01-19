'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Save a candidate
 */
export async function saveCandidate(candidateId: string, notes?: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Verify user is an employer
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!roles) {
    throw new Error('Only employers can save candidates')
  }

  const { data, error } = await supabase
    .from('saved_candidates')
    .upsert({
      employer_id: user.id,
      candidate_id: candidateId,
      notes,
    }, {
      onConflict: 'employer_id,candidate_id',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save candidate: ${error.message}`)
  }

  revalidatePath('/employer/dashboard')
  return data
}

/**
 * Remove a saved candidate
 */
export async function unsaveCandidate(candidateId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { error } = await supabase
    .from('saved_candidates')
    .delete()
    .eq('employer_id', user.id)
    .eq('candidate_id', candidateId)

  if (error) {
    throw new Error(`Failed to unsave candidate: ${error.message}`)
  }

  revalidatePath('/employer/dashboard')
}

/**
 * Get all saved candidates
 */
export async function getSavedCandidates() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('saved_candidates')
    .select(`
      *,
      profiles:candidate_id(
        id,
        full_name,
        email,
        city,
        state,
        industry,
        profile_photo_url,
        trust_scores(score)
      )
    `)
    .eq('employer_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch saved candidates: ${error.message}`)
  }

  return data || []
}

/**
 * Check if candidate is saved
 */
export async function isCandidateSaved(candidateId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data } = await supabase
    .from('saved_candidates')
    .select('id')
    .eq('employer_id', user.id)
    .eq('candidate_id', candidateId)
    .single()

  return !!data
}
