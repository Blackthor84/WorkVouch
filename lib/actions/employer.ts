'use server'

import { createServerSupabase } from '@/lib/supabase/server'
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
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  let queryBuilder = supabaseAny
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
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Get profile
  const { data: profile, error: profileError } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .eq('visibility', 'public')
    .single()

  if (profileError || !profile) {
    throw new Error('Profile not found or not public')
  }

  // Get public jobs
  const { data: jobs, error: jobsError } = await supabaseAny
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('is_private', false)
    .order('start_date', { ascending: false })

  if (jobsError) {
    throw new Error(`Failed to fetch jobs: ${jobsError.message}`)
  }

  // Get public references (for public jobs)
  const { data: references, error: refsError } = await supabaseAny
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
  type ReferenceWithJob = { job?: { is_private?: boolean } | null }
  const publicReferences =
    (references as ReferenceWithJob[] | null)?.filter((ref: ReferenceWithJob) => ref.job && !ref.job.is_private) || []

  // Get trust score
  const { data: trustScore } = await supabaseAny
    .from('trust_scores')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Normalize profile: convert string | null to string
  const profileAny = profile as any
  const safeProfile = profileAny ? {
    ...profileAny,
    full_name: profileAny.full_name ?? "",
    email: profileAny.email ?? "",
  } : null

  // Normalize jobs: convert string | null to string
  const safeJobs = (jobs || []).map((job: any) => ({
    ...job,
    company_name: job.company_name ?? "",
    job_title: job.job_title ?? "",
  }))

  // Normalize references: convert string | null to string
  const safeReferences = (publicReferences || []).map((ref: any) => ({
    ...ref,
    from_user: ref.from_user ? {
      ...ref.from_user,
      full_name: ref.from_user.full_name ?? "",
    } : null,
    job: ref.job ? {
      ...ref.job,
      company_name: ref.job.company_name ?? "",
      job_title: ref.job.job_title ?? "",
    } : null,
  }))

  // Normalize trust score
  const safeTrustScore = trustScore ? {
    score: Number(trustScore.score) || 0,
    job_count: Number(trustScore.job_count) || 0,
    reference_count: Number(trustScore.reference_count) || 0,
    average_rating: trustScore.average_rating ? Number(trustScore.average_rating) : null,
  } : null

  return {
    profile: safeProfile,
    jobs: safeJobs,
    references: safeReferences,
    trust_score: safeTrustScore,
  }
}

