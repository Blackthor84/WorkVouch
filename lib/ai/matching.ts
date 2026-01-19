/**
 * AI-Powered Job Matching Engine
 * Uses semantic similarity to match candidates with job postings
 */

import { createServerClient } from '@/lib/supabase/server'
import { generateJobEmbedding, generateCandidateEmbedding, cosineSimilarity } from './embeddings'

export interface MatchScore {
  candidateId: string
  score: number // 0-100
  semanticScore: number // 0-1 (cosine similarity)
  trustScore: number // 0-100
  experienceScore: number // 0-100
  locationScore: number // 0-100
  industryMatch: boolean
  reasons: string[] // Why this candidate matches
}

export interface JobMatchInput {
  jobId: string
  jobTitle: string
  description: string
  requirements?: string
  industry?: string
  location?: string
}

/**
 * Calculate AI-powered match score for a candidate against a job
 */
export async function calculateMatchScore(
  candidateId: string,
  jobInput: JobMatchInput
): Promise<MatchScore> {
  const supabase = await createServerClient()

  // Get candidate data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, trust_scores(score)')
    .eq('id', candidateId)
    .single()

  if (!profile) {
    throw new Error('Candidate not found')
  }

  // Get candidate jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('job_title, company_name, description, start_date, end_date')
    .eq('user_id', candidateId)
    .eq('is_private', false)
    .order('start_date', { ascending: false })

  // Get references
  const { data: references } = await supabase
    .from('references')
    .select('rating')
    .eq('to_user_id', candidateId)
    .eq('is_deleted', false)

  // Get industry fields (skills/certifications)
  const { data: industryFields } = await supabase
    .from('industry_profile_fields')
    .select('field_type, field_value')
    .eq('user_id', candidateId)

  const skills = industryFields
    ?.filter((f) => f.field_type === 'certification' || f.field_type === 'skill')
    .map((f) => f.field_value) || []

  // Calculate semantic similarity
  const jobEmbedding = await generateJobEmbedding({
    title: jobInput.jobTitle,
    description: jobInput.description,
    requirements: jobInput.requirements,
    industry: jobInput.industry,
    location: jobInput.location,
  })

  const candidateEmbedding = await generateCandidateEmbedding({
    jobs: jobs || [],
    industry: profile.industry || undefined,
    skills: skills as string[],
    location: profile.city && profile.state ? `${profile.city}, ${profile.state}` : undefined,
  })

  const semanticScore = cosineSimilarity(jobEmbedding, candidateEmbedding)

  // Calculate trust score (0-100)
  const trustScore = profile.trust_scores?.[0]?.score || 0

  // Calculate experience score
  const experienceScore = calculateExperienceScore(jobs || [], jobInput)

  // Calculate location score
  const locationScore = calculateLocationScore(
    profile.city,
    profile.state,
    jobInput.location
  )

  // Industry match
  const industryMatch = !jobInput.industry || profile.industry === jobInput.industry

  // Generate match reasons
  const reasons = generateMatchReasons({
    semanticScore,
    trustScore,
    experienceScore,
    locationScore,
    industryMatch,
    jobs: jobs || [],
    references: references || [],
  })

  // Calculate final weighted score (0-100)
  const finalScore =
    semanticScore * 40 + // 40% semantic similarity
    (trustScore / 100) * 25 + // 25% trust score
    (experienceScore / 100) * 20 + // 20% experience match
    (locationScore / 100) * 10 + // 10% location
    (industryMatch ? 5 : 0) // 5% industry match

  return {
    candidateId,
    score: Math.round(finalScore),
    semanticScore,
    trustScore,
    experienceScore,
    locationScore,
    industryMatch,
    reasons,
  }
}

/**
 * Calculate experience score based on job history relevance
 */
function calculateExperienceScore(
  candidateJobs: Array<{
    job_title: string
    company_name: string
    description?: string
  }>,
  jobInput: JobMatchInput
): number {
  if (candidateJobs.length === 0) return 0

  // Check for exact or similar job titles
  const titleMatch = candidateJobs.some((job) => {
    const candidateTitle = job.job_title.toLowerCase()
    const jobTitle = jobInput.jobTitle.toLowerCase()
    return (
      candidateTitle === jobTitle ||
      candidateTitle.includes(jobTitle) ||
      jobTitle.includes(candidateTitle)
    )
  })

  // Calculate years of experience
  const totalYears = candidateJobs.length * 2 // Rough estimate

  let score = 50 // Base score

  if (titleMatch) score += 30
  if (totalYears >= 5) score += 10
  if (totalYears >= 10) score += 10

  return Math.min(100, score)
}

/**
 * Calculate location score (0-100)
 */
function calculateLocationScore(
  candidateCity?: string | null,
  candidateState?: string | null,
  jobLocation?: string
): number {
  if (!jobLocation) return 50 // Neutral if no location specified

  const candidateLocation = [candidateCity, candidateState].filter(Boolean).join(', ').toLowerCase()
  const jobLoc = jobLocation.toLowerCase()

  if (!candidateLocation) return 30 // Lower score if candidate location unknown

  // Exact match
  if (candidateLocation === jobLoc) return 100

  // State match
  if (candidateState && jobLoc.includes(candidateState.toLowerCase())) return 70

  // City match
  if (candidateCity && jobLoc.includes(candidateCity.toLowerCase())) return 80

  // Partial match
  if (candidateLocation.includes(jobLoc) || jobLoc.includes(candidateLocation)) return 60

  return 20 // Low score for no match
}

/**
 * Generate human-readable match reasons
 */
function generateMatchReasons(params: {
  semanticScore: number
  trustScore: number
  experienceScore: number
  locationScore: number
  industryMatch: boolean
  jobs: Array<any>
  references: Array<any>
}): string[] {
  const reasons: string[] = []

  if (params.semanticScore > 0.7) {
    reasons.push('Strong profile-job description match')
  } else if (params.semanticScore > 0.5) {
    reasons.push('Good profile-job description alignment')
  }

  if (params.trustScore >= 80) {
    reasons.push('High trust score with verified work history')
  } else if (params.trustScore >= 60) {
    reasons.push('Good trust score')
  }

  if (params.experienceScore >= 80) {
    reasons.push('Strong relevant experience')
  }

  if (params.locationScore >= 80) {
    reasons.push('Location match')
  }

  if (params.industryMatch) {
    reasons.push('Industry match')
  }

  if (params.references.length >= 3) {
    reasons.push(`${params.references.length} peer references`)
  }

  if (params.jobs.length >= 5) {
    reasons.push(`Extensive work history (${params.jobs.length} jobs)`)
  }

  return reasons.length > 0 ? reasons : ['Potential match based on profile']
}

/**
 * Find top matching candidates for a job using AI
 */
export async function findTopMatches(
  jobInput: JobMatchInput,
  limit: number = 20
): Promise<MatchScore[]> {
  const supabase = await createServerClient()

  // Get all public profiles (or filter by industry if specified)
  let query = supabase
    .from('profiles')
    .select('id, industry, city, state, trust_scores(score)')
    .eq('visibility', 'public')

  if (jobInput.industry) {
    query = query.eq('industry', jobInput.industry)
  }

  const { data: profiles } = await query

  if (!profiles || profiles.length === 0) {
    return []
  }

  // Calculate match scores for all candidates
  const matchPromises = profiles.map((profile) =>
    calculateMatchScore(profile.id, jobInput).catch((error) => {
      console.error(`Error calculating match for ${profile.id}:`, error)
      return null
    })
  )

  const matches = await Promise.all(matchPromises)

  // Filter out nulls and sort by score
  const validMatches = matches.filter((m): m is MatchScore => m !== null)
  validMatches.sort((a, b) => b.score - a.score)

  return validMatches.slice(0, limit)
}
