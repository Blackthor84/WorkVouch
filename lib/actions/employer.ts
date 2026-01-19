'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/database'

/**
 * Search users by name or location (employer only)
 */
export async function searchUsers(query: {
  name?: string
  city?: string
  state?: string
  limit?: number
}) {
  await requireRole('employer')
  const supabase = await createServerClient()

  let queryBuilder = supabase
    .from('profiles')
    .select('*')
    .eq('visibility', 'public')
    .limit(query.limit || 50)

  if (query.name) {
    queryBuilder = queryBuilder.ilike('full_name', `%${query.name}%`)
  }

  if (query.city) {
    queryBuilder = queryBuilder.ilike('city', `%${query.city}%`)
  }

  if (query.state) {
    queryBuilder = queryBuilder.ilike('state', `%${query.state}%`)
  }

  const { data: profiles, error } = await queryBuilder

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`)
  }

  return profiles
}

/**
 * Get public profile with jobs and references (employer view)
 */
export async function getPublicProfile(userId: string) {
  await requireRole('employer')
  const supabase = await createServerClient()

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .eq('visibility', 'public')
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found or not public')
  }

  // Get public jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_private', false)
    .order('start_date', { ascending: false })

  if (jobsError) {
    throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
  }

  // Get public references (for public jobs)
  const { data: references, error: refsError } = await supabase
    .from('references')
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
        job_title
      )
    `)
    .eq('to_user_id', userId)
    .eq('is_deleted', false)

  if (refsError) {
    throw new Error(`Failed to fetch references: ${refsError.message}`)
  }

  // Filter references to only those for public jobs
  const publicReferences =
    references?.filter((ref) => ref.job && !ref.job.is_private) || []

  // Get trust score
  const { data: trustScore } = await supabase
    .from('trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  return {
    profile,
    jobs: jobs || [],
    references: publicReferences,
    trust_score: trustScore,
  }
}

