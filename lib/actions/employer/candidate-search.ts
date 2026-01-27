'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export interface CandidateSearchFilters {
  industry?: string
  job_title?: string
  experience_level?: string
  certifications?: string[]
  min_trust_score?: number
  location?: string
}

export interface CandidateSearchResult {
  id: string
  full_name: string
  email: string
  city: string | null
  state: string | null
  industry: string | null
  profile_photo_url: string | null
  trust_score: number | null
  jobs: Array<{
    id: string
    company_name: string
    job_title: string
    start_date: string
    end_date: string | null
  }>
  references: Array<{
    id: string
    rating: number
    written_feedback: string | null
  }>
}

/**
 * Search for candidates with filters
 */
export async function searchCandidates(filters: CandidateSearchFilters = {}) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Verify user is an employer
  const { data: roles } = await supabaseAny
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!roles) {
    throw new Error('Only employers can search candidates')
  }

  // Build query - get all profiles first, then filter
  let query: any = supabaseAny
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      city,
      state,
      industry,
      profile_photo_url
    `)
    .limit(100) // Limit to prevent too many results

  // Apply filters
  if (filters.industry) {
    query = query.eq('industry', filters.industry)
  }

  if (filters.location) {
    query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
  }

  const { data: profiles, error } = await query

  if (error) {
    throw new Error(`Failed to search candidates: ${error.message}`)
  }

  if (!profiles) {
    return []
  }

  // Get jobs and references for each profile
  const results: CandidateSearchResult[] = []

  for (const profile of profiles) {
    const profileAny = profile as any
    // Get jobs
    const { data: jobs } = await supabaseAny
      .from('jobs')
      .select('id, company_name, job_title, start_date, end_date')
      .eq('user_id', profileAny.id)
      .order('start_date', { ascending: false })

    // Apply job title filter if provided
    if (filters.job_title && jobs) {
      const filteredJobs = (jobs as any[]).filter((job: any) =>
        job.job_title?.toLowerCase().includes(filters.job_title!.toLowerCase())
      )
      if (filteredJobs.length === 0) continue
    }

    // Get references
    const { data: references } = await supabaseAny
      .from('references')
      .select('id, rating, written_feedback')
      .eq('to_user_id', profileAny.id)
      .eq('is_deleted', false)

    // Get trust score
    const { data: trustScoreData } = await supabaseAny
      .from('trust_scores')
      .select('score')
      .eq('user_id', profileAny.id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single()

    const trustScore = (trustScoreData as any)?.score || 0

    // Apply trust score filter
    if (filters.min_trust_score && trustScore < filters.min_trust_score) {
      continue
    }

    // Apply certification filter (would need to check industry_profile_fields)
    if (filters.certifications && filters.certifications.length > 0) {
      const { data: fields } = await supabaseAny
        .from('industry_profile_fields')
        .select('field_value')
        .eq('user_id', profileAny.id)
        .eq('field_type', 'certification')

      const hasCert = (fields as any[])?.some((field: any) =>
        filters.certifications!.some(cert =>
          field.field_value?.toLowerCase().includes(cert.toLowerCase())
        )
      )

      if (!hasCert) continue
    }

    results.push({
      id: profileAny.id,
      full_name: profileAny.full_name,
      email: profileAny.email,
      city: profileAny.city,
      state: profileAny.state,
      industry: profileAny.industry,
      profile_photo_url: profileAny.profile_photo_url,
      trust_score: trustScore,
      jobs: jobs || [],
      references: references || [],
    })
  }

  return results
}

/**
 * Get full candidate profile for employer view
 */
export async function getCandidateProfileForEmployer(candidateId: string) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Verify user is an employer
  const { data: roles } = await supabaseAny
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!roles) {
    throw new Error('Only employers can view candidate profiles')
  }

  // Get profile
  const { data: profile, error: profileError } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (profileError || !profile) {
    throw new Error('Candidate not found')
  }

  // Get jobs with coworker matches
  const { data: jobs } = await supabaseAny
    .from('jobs')
    .select(`
      *,
      coworker_matches!jobs_coworker_matches_job_id_fkey(
        user1_id,
        user2_id,
        matched_at
      )
    `)
    .eq('user_id', candidateId)
    .order('start_date', { ascending: false })

  // Get references
  const { data: references } = await supabaseAny
    .from('references')
    .select(`
      *,
      from_user:profiles!references_from_user_id_fkey(full_name, profile_photo_url)
    `)
    .eq('to_user_id', candidateId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  // Get trust score
  const { data: trustScore } = await supabaseAny
    .from('trust_scores')
    .select('score')
    .eq('user_id', candidateId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()

  // Get industry fields
  const { data: industryFields } = await supabaseAny
    .from('industry_profile_fields')
    .select('*')
    .eq('user_id', candidateId)

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

  return {
    profile: safeProfile,
    jobs: safeJobs,
    references: references || [],
    trust_score: (trustScore as any)?.score || 0,
    industry_fields: industryFields || [],
  }
}
