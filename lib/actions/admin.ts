'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  await requireRole('admin')
  const supabase = await createServerClient()

  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (
        role
      ),
      trust_scores (
        score,
        job_count,
        reference_count,
        average_rating
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  return users
}

/**
 * Get all jobs (admin only)
 */
export async function getAllJobs() {
  await requireRole('admin')
  const supabase = await createServerClient()

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      profiles!jobs_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`)
  }

  return jobs
}

/**
 * Get all references (admin only)
 */
export async function getAllReferences() {
  await requireRole('admin')
  const supabase = await createServerClient()

  const { data: references, error } = await supabase
    .from('references')
    .select(`
      *,
      from_user:profiles!references_from_user_id_fkey (
        id,
        full_name,
        email
      ),
      to_user:profiles!references_to_user_id_fkey (
        id,
        full_name,
        email
      ),
      job:jobs!references_job_id_fkey (
        id,
        company_name,
        job_title
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch references: ${error.message}`)
  }

  return references
}

/**
 * Soft-delete a reference (admin only)
 */
export async function softDeleteReference(referenceId: string) {
  await requireRole('admin')
  const supabase = await createServerClient()
  const supabaseAny = supabase as any

  const { data: reference, error } = await supabaseAny
    .from('references')
    .update({ is_deleted: true })
    .eq('id', referenceId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to delete reference: ${error.message}`)
  }

  return reference
}

/**
 * Suspend a user (admin only)
 * Note: This is a placeholder - implement actual suspension logic
 */
export async function suspendUser(userId: string) {
  await requireRole('admin')
  const supabase = await createServerClient()

  // TODO: Implement actual suspension logic
  // This could involve:
  // - Adding a 'suspended' flag to profiles
  // - Updating RLS policies to block suspended users
  // - Logging the suspension action

  throw new Error('Suspension not yet implemented')
}

