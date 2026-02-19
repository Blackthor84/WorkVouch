'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { RelationshipType } from '@/types/database'
import { calculateAndStoreRisk } from '@/lib/risk/calculateAndPersist'

export interface CreateReferenceInput {
  to_user_id: string
  job_id: string
  relationship_type: RelationshipType
  rating: number
  written_feedback?: string
}

/**
 * Create a peer reference
 * References are immutable once created
 */
export async function createReference(input: CreateReferenceInput) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  // Verify connection exists
  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .or(
      `and(user_id.eq.${user.id},connected_user_id.eq.${input.to_user_id},status.eq.confirmed),and(user_id.eq.${input.to_user_id},connected_user_id.eq.${user.id},status.eq.confirmed)`
    )
    .single()

  if (!connection) {
    throw new Error(
      'Cannot create reference: You must be connected to this user'
    )
  }

  // Verify job belongs to the target user
  const { data: job } = await supabase
    .from('jobs')
    .select('user_id')
    .eq('id', input.job_id)
    .single()

  if (!job || (job as any).user_id !== input.to_user_id) {
    throw new Error('Invalid job: Job must belong to the target user')
  }

  // Check if reference already exists for this job
  const { data: existing } = await supabase
    .from('user_references')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', input.to_user_id)
    .eq('job_id', input.job_id)
    .single()

  if (existing) {
    throw new Error('Reference already exists for this job')
  }

  // Validate rating
  if (input.rating < 1 || input.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Create reference
  const { data: reference, error } = await supabase
    .from('user_references')
    .insert({
      ...input,
      from_user_id: user.id,
    } as any)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create reference: ${error.message}`)
  }

  await calculateAndStoreRisk(input.to_user_id).catch((error) => { console.error("[SYSTEM_FAIL]", error); })

  revalidatePath('/dashboard')
  return reference
}

/**
 * Get references for a user (that the current user can view)
 */
export async function getUserReferences(userId: string) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  // Users can see references they gave or received
  // Employers can see public references for public jobs
  const { data: references, error } = await supabase
    .from('user_references')
    .select(`
      *,
      from_user:profiles!references_from_user_id_fkey (
        id,
        full_name,
        profile_photo_url
      ),
      job:jobs!references_job_id_fkey (
        id,
        company_name,
        job_title,
        is_private
      )
    `)
    .eq('to_user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch references: ${error.message}`)
  }

  // Filter based on visibility rules
  const filtered = references?.filter((ref: any) => {
    // User can always see references they gave or received
    if (ref.from_user_id === user.id || ref.to_user_id === user.id) {
      return true
    }

    // Employers can see references for public jobs only
    // (This is handled by RLS, but we double-check here)
    if (ref.job && !ref.job.is_private) {
      return true
    }

    return false
  }) || []

  return filtered
}

