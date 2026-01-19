'use server'

import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Find potential coworkers based on overlapping employment
 * This is the foundational matching logic - can be extended in Phase 2+
 */
export async function findPotentialCoworkers(jobId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get the job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  // Find users with overlapping employment at the same company
  // Case-insensitive company name matching
  // We'll filter date overlaps in code for better reliability
  const { data: potentialCoworkers, error } = await supabase
    .from('jobs')
    .select(`
      *,
      profiles!jobs_user_id_fkey (
        id,
        full_name,
        email,
        city,
        state,
        profile_photo_url,
        visibility
      )
    `)
    .eq('is_private', false) // Only match with public jobs
    .neq('user_id', user.id) // Exclude self
    .ilike('company_name', job.company_name)

  if (error) {
    throw new Error(`Failed to find potential coworkers: ${error.message}`)
  }

  // Filter for date overlaps
  // Date overlap: (start1 <= end2) AND (end1 >= start2)
  const jobEndDate = job.end_date ? new Date(job.end_date) : new Date('9999-12-31')
  const jobStartDate = new Date(job.start_date)

  const dateOverlaps = potentialCoworkers?.filter((otherJob) => {
    const otherStart = new Date(otherJob.start_date)
    const otherEnd = otherJob.end_date ? new Date(otherJob.end_date) : new Date('9999-12-31')
    
    // Check overlap: (start1 <= end2) AND (end1 >= start2)
    return otherStart <= jobEndDate && otherEnd >= jobStartDate
  }) || []

  // Filter out users who are already connected
  const { data: existingConnections } = await supabase
    .from('connections')
    .select('connected_user_id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  const connectedUserIds = new Set(
    existingConnections?.map((c) => c.connected_user_id) || []
  )

  const filtered = dateOverlaps.filter(
    (job) => job.profiles && !connectedUserIds.has(job.profiles.id)
  )

  return filtered.map((job) => ({
    job_id: job.id,
    user: job.profiles,
    matching_job: {
      company_name: job.company_name,
      job_title: job.job_title,
      start_date: job.start_date,
      end_date: job.end_date,
    },
  }))
}

/**
 * Initiate a connection request
 */
export async function initiateConnection(
  connectedUserId: string,
  jobId?: string
) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Prevent self-connection
  if (user.id === connectedUserId) {
    throw new Error('Cannot connect to yourself')
  }

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .or(
      `and(user_id.eq.${user.id},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${user.id})`
    )
    .single()

  if (existing) {
    throw new Error('Connection already exists')
  }

  // Create connection (bidirectional)
  // We create two records to simplify queries, but the unique constraint ensures no duplicates
  const { data: connection, error } = await supabase
    .from('connections')
    .insert({
      user_id: user.id,
      connected_user_id: connectedUserId,
      job_id: jobId || null,
      status: 'pending',
      initiated_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to initiate connection: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return connection
}

/**
 * Confirm a connection request
 */
export async function confirmConnection(connectionId: string) {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Verify the connection is for this user
  const { data: connection } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single()

  if (!connection) {
    throw new Error('Connection not found')
  }

  if (
    connection.user_id !== user.id &&
    connection.connected_user_id !== user.id
  ) {
    throw new Error('Unauthorized')
  }

  // Update status to confirmed
  const { data: updated, error } = await supabase
    .from('connections')
    .update({ status: 'confirmed' })
    .eq('id', connectionId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to confirm connection: ${error.message}`)
  }

  revalidatePath('/dashboard')
  return updated
}

/**
 * Get user's connections
 */
export async function getUserConnections() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      *,
      connected_user:profiles!connections_connected_user_id_fkey (
        id,
        full_name,
        email,
        city,
        state,
        profile_photo_url
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  if (error) {
    throw new Error(`Failed to fetch connections: ${error.message}`)
  }

  return connections
}

