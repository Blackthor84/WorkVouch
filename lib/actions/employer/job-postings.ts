'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export interface JobPosting {
  id: string
  employer_id: string
  title: string
  description: string
  location: string
  pay_range_min: number | null
  pay_range_max: number | null
  shift: string | null
  requirements: string | null
  industry: string | null
  is_published: boolean
  is_boosted: boolean
  boost_expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateJobPostingInput {
  title: string
  description: string
  location: string
  pay_range_min?: number
  pay_range_max?: number
  shift?: string
  requirements?: string
  industry?: string
}

/**
 * Create a new job posting
 */
export async function createJobPosting(input: CreateJobPostingInput) {
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
    throw new Error('Only employers can create job postings')
  }

  const { data, error } = await supabaseAny
    .from('job_postings')
    .insert([{
      employer_id: user.id,
      ...input,
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create job posting: ${error.message}`)
  }

  revalidatePath('/employer/dashboard')
  return data as JobPosting
}

/**
 * Update a job posting
 */
export async function updateJobPosting(id: string, input: Partial<CreateJobPostingInput>) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  // Verify ownership
  const supabaseAny = supabase as any
  const { data: posting } = await supabaseAny
    .from('job_postings')
    .select('employer_id')
    .eq('id', id)
    .single()

  if (!posting || (posting as any).employer_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabaseAny
    .from('job_postings')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update job posting: ${error.message}`)
  }

  revalidatePath('/employer/dashboard')
  return data as JobPosting
}

/**
 * Publish/unpublish a job posting
 */
export async function toggleJobPostingPublish(id: string, isPublished: boolean) {
  return updateJobPosting(id, { is_published: isPublished } as any)
}

/**
 * Boost a job posting
 */
export async function boostJobPosting(id: string, days: number = 30) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  // Verify ownership
  const supabaseAny = supabase as any
  const { data: posting } = await supabaseAny
    .from('job_postings')
    .select('employer_id')
    .eq('id', id)
    .single()

  if (!posting || (posting as any).employer_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const boostExpiresAt = new Date()
  boostExpiresAt.setDate(boostExpiresAt.getDate() + days)

  const { data, error } = await supabaseAny
    .from('job_postings')
    .update({
      is_boosted: true,
      boost_expires_at: boostExpiresAt.toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to boost job posting: ${error.message}`)
  }

  revalidatePath('/employer/dashboard')
  return data as JobPosting
}

/**
 * Get all job postings for current employer
 */
export async function getEmployerJobPostings() {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data, error } = await supabaseAny
    .from('job_postings')
    .select('*')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch job postings: ${error.message}`)
  }

  return (data || []) as JobPosting[]
}

/**
 * Get published job postings (public)
 */
export async function getPublishedJobPostings(industry?: string) {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  let query: any = supabaseAny
    .from('job_postings')
    .select('*, profiles:employer_id(full_name, email)')
    .eq('is_published', true)
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })

  if (industry) {
    query = query.eq('industry', industry)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch job postings: ${error.message}`)
  }

  return data || []
}

/**
 * Get job posting by ID
 */
export async function getJobPosting(id: string) {
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data, error } = await supabaseAny
    .from('job_postings')
    .select('*, profiles:employer_id(full_name, email)')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch job posting: ${error.message}`)
  }

  return data
}

/**
 * Get applications for a job posting
 */
export async function getJobApplications(jobPostingId: string) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Verify ownership
  const { data: posting } = await supabaseAny
    .from('job_postings')
    .select('employer_id')
    .eq('id', jobPostingId)
    .single()

  if (!posting || (posting as any).employer_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabaseAny
    .from('job_applications')
    .select('*, profiles:candidate_id(full_name, email, profile_photo_url)')
    .eq('job_posting_id', jobPostingId)
    .order('applied_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`)
  }

  return data || []
}

/**
 * Apply to a job posting
 */
export async function applyToJob(jobPostingId: string, coverLetter?: string) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  const supabaseAny = supabase as any
  const { data, error } = await supabaseAny
    .from('job_applications')
    .insert([{
      job_posting_id: jobPostingId,
      candidate_id: user.id,
      cover_letter: coverLetter,
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already applied to this job')
    }
    throw new Error(`Failed to apply: ${error.message}`)
  }

  revalidatePath('/jobs')
  return data
}
