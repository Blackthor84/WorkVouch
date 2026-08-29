'use server'

import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import { requireAuth } from '@/lib/auth'
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";
import {
  requireEmployerLegalAcceptance,
  EMPLOYER_DISCLAIMER_NOT_ACCEPTED,
} from '@/lib/employer/requireEmployerLegalAcceptance'
import { getReferenceCredibilityBadges } from '@/lib/employer/referenceCredibilityBadges'

/** Profile loaders for employer candidate views — search uses lib/search/employerSearchService. */
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
  /** Matches trust_scores.reference_count (all review sources in rank formula). */
  trust_reference_count: number
  verified_employment_coverage_pct: number
  verified_employment_count: number
  total_employment_count: number
  industry_fields: unknown[]
}

export type CandidateProfileForEmployerResult = CandidateProfilePayload & {
  hiringDataUnlocked: boolean
}

function redactCandidateProfileForFreePreview(full: CandidateProfilePayload): CandidateProfilePayload {
  const p = full.profile
  const safeProfile = p ? { ...p, email: "" } : null
  const jobs = Array.isArray(full.jobs) ? full.jobs.slice(0, 1) : []
  return {
    ...full,
    profile: safeProfile,
    jobs,
    references: [],
    trust_score: 0,
    trust_reference_count: 0,
    verified_employment_coverage_pct: 0,
    verified_employment_count: 0,
    total_employment_count: Math.min(full.total_employment_count, 1),
    industry_fields: [],
  }
}

/**
 * Fetch candidate profile data (exact same shape as employer view). No auth.
 * Uses admin client — employer session RLS only allows reading own profile row.
 * Used by getCandidateProfileForEmployer and getMyProfileAsEmployerSeesIt.
 */
export async function getCandidateProfileData(candidateId: string): Promise<CandidateProfilePayload> {
  const supabaseAny = admin as any

  const { data: candidateProfile, error: profileError } = await supabaseAny
    .from('profiles')
    .select('*')
    .eq('id', candidateId)
    .single()

  if (profileError || !candidateProfile) {
    console.error("[getCandidateProfileData:diag]", "reject: profiles lookup", {
      candidateId,
      code: (profileError as { code?: string } | null)?.code ?? null,
      message: profileError?.message ?? null,
      hasRow: Boolean(candidateProfile),
    })
    throw new Error('Candidate not found')
  }

  console.error("[getCandidateProfileData:diag]", "profiles lookup ok", {
    candidateId,
    profileId: (candidateProfile as { id?: string }).id ?? null,
    role: (candidateProfile as { role?: string }).role ?? null,
  })

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
    .select('score, reference_count')
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
    trust_reference_count: Number((trustScore as { reference_count?: number } | null)?.reference_count) || 0,
    verified_employment_coverage_pct,
    verified_employment_count,
    total_employment_count,
    industry_fields: industryFields || [],
  }
}

/**
 * Get full candidate profile for employer view (employer-only).
 * Free plan: limited fields + hiringDataUnlocked false (UI gates premium sections).
 */
const EMPLOYER_PROFILE_DIAG = "[getCandidateProfileForEmployer:diag]";

export async function getCandidateProfileForEmployer(
  candidateId: string
): Promise<CandidateProfileForEmployerResult> {
  console.error(EMPLOYER_PROFILE_DIAG, "start", { candidateId });

  const user = await requireAuth()
  console.error(EMPLOYER_PROFILE_DIAG, "auth ok", { employerId: user.id, candidateId });

  const supabase = await createClient()
  const supabaseAny = supabase as any

  const { data: profile, error: employerRoleError } = await supabaseAny
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile as { role?: string } | null)?.role ?? null
  if (role !== 'employer') {
    console.error(EMPLOYER_PROFILE_DIAG, "reject: employer role check", {
      candidateId,
      employerId: user.id,
      role,
      employerRoleError: employerRoleError?.message ?? null,
    })
    throw new Error('Only employers can view candidate profiles')
  }

  const legalCheck = await requireEmployerLegalAcceptance(user.id, role)
  if (!legalCheck.allowed) {
    console.error(EMPLOYER_PROFILE_DIAG, "reject: legal acceptance", {
      candidateId,
      employerId: user.id,
      reasonCode: legalCheck.reasonCode,
    })
    throw new Error(legalCheck.reasonCode)
  }

  const access = await resolveEmployerDataAccess(user.id)
  if (!access.ok) {
    console.error(EMPLOYER_PROFILE_DIAG, "reject: resolveEmployerDataAccess", {
      candidateId,
      employerId: user.id,
      status: access.status,
      error: access.error,
    })
    throw new Error(access.error)
  }

  console.error(EMPLOYER_PROFILE_DIAG, "employer access ok", {
    candidateId,
    employerId: user.id,
    mode: access.mode,
    plan: access.plan,
  })

  let full: CandidateProfilePayload
  try {
    full = await getCandidateProfileData(candidateId)
  } catch (error: unknown) {
    console.error(EMPLOYER_PROFILE_DIAG, "reject: getCandidateProfileData threw", {
      candidateId,
      employerId: user.id,
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  }

  if (access.mode === 'free_preview') {
    console.error(EMPLOYER_PROFILE_DIAG, "return: free_preview redaction", {
      candidateId,
      employerId: user.id,
      profileId: full.profile?.id ?? null,
    })
    return {
      ...redactCandidateProfileForFreePreview(full),
      hiringDataUnlocked: false,
    }
  }

  console.error(EMPLOYER_PROFILE_DIAG, "return: full access", {
    candidateId,
    employerId: user.id,
    profileId: full.profile?.id ?? null,
    hiringDataUnlocked: true,
  })
  return { ...full, hiringDataUnlocked: true }
}

/**
 * Get current user's profile in the exact same shape employers see (employee self-view).
 */
export async function getMyProfileAsEmployerSeesIt(): Promise<CandidateProfilePayload> {
  const user = await requireAuth()
  return getCandidateProfileData(user.id)
}
