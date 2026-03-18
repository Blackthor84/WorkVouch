'use server'

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { EmploymentType } from '@/types/database'

export interface CreateJobInput {
  company_name: string
  job_title: string
  employment_type: EmploymentType
  start_date: string
  end_date?: string | null
  is_current: boolean
  location?: string
  supervisor_name?: string
  is_private: boolean
}

/**
 * Create a new job entry.
 * user_id (profile_id) is always set from the authenticated user — never from input.
 */
export async function createJob(input: CreateJobInput) {
  const user = await requireAuth()
  const supabase = await createClient()
  const supabaseAny = supabase as any

  const safeTitle = input.job_title?.trim() || "Unknown Job"
  const { job_title: _jt, ...rest } = input
  // Strip any client-supplied user_id/profile_id so insert always uses auth user
  const { user_id: _uid, profile_id: _pid, ...safeInput } = rest as CreateJobInput & { user_id?: string; profile_id?: string }
  const { data: job, error } = await supabaseAny
    .from('jobs')
    .insert([{
      ...safeInput,
      title: safeTitle,
      user_id: user.id,
    }])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create job: ${error.message}`)
  }

  // Trigger coworker matching (async, don't wait)
  if (job && !input.is_private) {
    // Fire and forget - matching happens in background
    supabaseAny.rpc('detect_coworker_matches', { p_job_id: (job as any).id })
      .then(() => {
        // Optionally revalidate notifications page
        revalidatePath('/notifications')
      })
      .catch((err: any) => console.error('Failed to detect coworker matches:', err))
  }

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  return job
}

/**
 * Update a job entry
 */
export async function updateJob(jobId: string, input: Partial<CreateJobInput>) {
  const user = await requireAuth()
  const supabase = await createClient()

  // Verify ownership
  const supabaseAny = supabase as any
  const { data: existingJob } = await supabaseAny
    .from('jobs')
    .select('user_id')
    .eq('id', jobId)
    .single()

  if (!existingJob || (existingJob as any).user_id !== user.id) {
    throw new Error('Unauthorized: You can only update your own jobs')
  }

  const { job_title: _jt, ...rest } = input
  const updatePayload = _jt !== undefined ? { ...rest, title: _jt?.trim() || "Unknown Job" } : rest
  const { data: job, error } = await supabaseAny
    .from('jobs')
    .update(updatePayload)
    .eq('id', jobId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update job: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return job
}

/**
 * Delete a job entry
 */
export async function deleteJob(jobId: string) {
  const user = await requireAuth()
  const supabase = await createClient()

  // Verify ownership
  const supabaseAny = supabase as any
  const { data: existingJob } = await supabaseAny
    .from('jobs')
    .select('user_id')
    .eq('id', jobId)
    .single()

  if (!existingJob || (existingJob as any).user_id !== user.id) {
    throw new Error('Unauthorized: You can only delete your own jobs')
  }

  const { error } = await supabaseAny
    .from('jobs')
    .delete()
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to delete job: ${error.message}`)
  }

  revalidatePath('/dashboard')
}

/**
 * Get user's jobs
 */
export async function getUserJobs(userId?: string) {
  const user = await requireAuth()
  const targetUserId = userId || user.id
  const supabase = await createClient()
  const supabaseAny = supabase as any

  const { data: jobs, error } = await supabaseAny
    .from('jobs')
    .select('*')
    .eq('user_id', targetUserId)
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return jobs
}

/**
 * Get jobs for a specific user (for reference requests)
 * This allows fetching jobs for connected users
 */
export async function getJobsForUser(targetUserId: string) {
  await requireAuth() // User must be authenticated
  const supabase = await createClient()
  const supabaseAny = supabase as any

  const { data: jobs, error } = await supabaseAny
    .from('jobs')
    .select('*')
    .eq('user_id', targetUserId)
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return jobs
}

