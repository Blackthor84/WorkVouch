'use server'

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from '@/lib/auth'
import {
  requireEmployerLegalAcceptance,
  EMPLOYER_DISCLAIMER_NOT_ACCEPTED,
} from '@/lib/employer/requireEmployerLegalAcceptance'
import { getReferenceCredibilityBadges } from '@/lib/employer/referenceCredibilityBadges'

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
  const supabase = await createClient()
  const supabaseAny = supabase as any

  // Verify user is an employer
  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role ?? null
  if (role !== 'employer') {
    throw new Error('Only employers can search candidates')
  }

  const legalCheck = await requireEmployerLegalAcceptance(user.id, role)
  if (!legalCheck.allowed) {
    throw new Error(legalCheck.reasonCode)
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
    // Get jobs (only visible to employers; archived/hidden never appear)
    const { data: jobs } = await supabaseAny
      .from('jobs')
      .select('id, company_name, title, start_date, end_date')
      .eq('user_id', profileAny.id)
      .or('is_visible_to_employer.eq.true,is_visible_to_employer.is.null')
      .order('start_date', { ascending: false })

    // Apply job title filter if provided
    if (filters.job_title && jobs) {
      const filteredJobs = (jobs as any[]).filter((job: any) =>
        (job.title ?? job.job_title)?.toLowerCase().includes(filters.job_title!.toLowerCase())
      )
      if (filteredJobs.length === 0) continue
    }

    // Get references
    const { data: references } = await supabaseAny
      .from('user_references')
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

/** Payload shape returned by getCandidateProfileData (same as employer view). */
export type CandidateProfilePayload = {
  profile: { id: string; full_name: string; email: string; [k: string]: unknown } | null
  jobs: Array<{ id: string; company_name: string; job_title: string; [k: string]: unknown }>
  references: Array<{
    id: string
    from_user?: { full_name?: string; profile_photo_url?: string | null } | null
    is_direct_manager?: boolean
    is_repeated_coworker?: boolean
    is_verified_match?: boolean
    [k: string]: unknown
  }>
  trust_score: number
  verified_employment_coverage_pct: number
  verified_employment_count: number
  total_employment_count: number
  industry_fields: unknown[]
}

/**
 * Fetch candidate profile data (exact same shape as employer view). No auth.
 * Used by getCandidateProfileForEmployer and getMyProfileAsEmployerSeesIt.
 */
export async function getCandidateProfileData(candidateId: string): Promise<CandidateProfilePayload> {
  const supabase = await createClient()
  const supabaseAny = supabase as any

  const { data: candidateProfile, error: profileError } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (profileError || !candidateProfile) {
    throw new Error('Candidate not found')
  }

  const { data: jobs } = await supabaseAny
    .from('jobs')
    .select(`
      *,
      coworker_matches!jobs_coworker_matches_job_id_fkey(
        user_1,
        user_2
      )
    `)
    .eq('user_id', candidateId)
    .or('is_visible_to_employer.eq.true,is_visible_to_employer.is.null')
    .order('start_date', { ascending: false })

  const { data: references } = await supabaseAny
    .from('user_references')
    .select(`
      *,
      from_user:profiles!references_from_user_id_fkey(full_name, profile_photo_url)
    `)
    .eq('to_user_id', candidateId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const { data: trustScore } = await supabaseAny
    .from('trust_scores')
    .select('score')
    .eq('user_id', candidateId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single()

  const { data: employmentRows } = await supabaseAny
    .from('employment_records')
    .select('verification_status')
    .eq('user_id', candidateId)
  const totalEmployment = (employmentRows ?? []).length
  const verifiedEmployment = (employmentRows ?? []).filter(
    (r: { verification_status?: string }) => r.verification_status === 'verified'
  ).length
  const verified_employment_coverage_pct = totalEmployment > 0
    ? Math.round((verifiedEmployment / totalEmployment) * 100)
    : 0
  const verified_employment_count = verifiedEmployment
  const total_employment_count = totalEmployment

  const { data: industryFields } = await supabaseAny
    .from('industry_profile_fields')
    .select('*')
    .eq('user_id', candidateId)

  const refList = references ?? []
  const badges = await getReferenceCredibilityBadges(supabaseAny, candidateId, refList)
  const referencesWithBadges = refList.map((ref: { id: string }) => ({
    ...ref,
    is_direct_manager: badges[ref.id]?.is_direct_manager ?? false,
    is_repeated_coworker: badges[ref.id]?.is_repeated_coworker ?? false,
    is_verified_match: badges[ref.id]?.is_verified_match ?? false,
  }))

  const profileAny = candidateProfile as Record<string, unknown>
  const safeProfile = profileAny
    ? {
        id: (profileAny.id as string) ?? '',
        ...profileAny,
        full_name: (profileAny.full_name as string) ?? '',
        email: (profileAny.email as string) ?? '',
      }
    : null

  const safeJobs = (jobs || []).map((job: Record<string, unknown>) => ({
    ...job,
    company_name: (job.company_name as string) ?? '',
    job_title: (job.title ?? (job as { job_title?: string }).job_title) ?? '',
  }))

  return {
    profile: safeProfile,
    jobs: safeJobs,
    references: referencesWithBadges,
    trust_score: Number((trustScore as { score?: number } | null)?.score) || 0,
    verified_employment_coverage_pct,
    verified_employment_count,
    total_employment_count,
    industry_fields: industryFields || [],
  }
}

/**
 * Get full candidate profile for employer view (employer-only).
 */
export async function getCandidateProfileForEmployer(candidateId: string): Promise<CandidateProfilePayload> {
  const user = await requireAuth()
  const supabase = await createClient()
  const supabaseAny = supabase as any

  const { data: profile } = await supabaseAny
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role ?? null
  if (role !== 'employer') {
    throw new Error('Only employers can view candidate profiles')
  }

  const legalCheck = await requireEmployerLegalAcceptance(user.id, role)
  if (!legalCheck.allowed) {
    throw new Error(legalCheck.reasonCode)
  }

  return getCandidateProfileData(candidateId)
}

/**
 * Get current user's profile in the exact same shape employers see (employee self-view).
 */
export async function getMyProfileAsEmployerSeesIt(): Promise<CandidateProfilePayload> {
  const user = await requireAuth()
  return getCandidateProfileData(user.id)
}
