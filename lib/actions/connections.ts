'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

/**
 * Find potential coworkers based on overlapping employment
 * This is the foundational matching logic - can be extended in Phase 2+
 */
export async function findPotentialCoworkers(jobId: string) {
  const user = await requireAuth()
  const supabase = await createServerSupabase()

  // Get the job details
  const supabaseAny = supabase as any
  const { data: job, error: jobError } = await supabaseAny
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (jobError || !job) {
    throw new Error('Job not found')
  }

  type JobRow = { company_name: string; start_date: string; end_date: string | null }
  const jobTyped = job as JobRow

  // Find users with overlapping employment at the same company
  // Case-insensitive company name matching
  // We'll filter date overlaps in code for better reliability
  const { data: potentialCoworkers, error } = await supabaseAny
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
    .ilike('company_name', jobTyped.company_name)

  if (error) {
    throw new Error(`Failed to find potential coworkers: ${error.message}`)
  }

  // Filter for date overlaps
  // Date overlap: (start1 <= end2) AND (end1 >= start2)
  const jobEndDate = jobTyped.end_date ? new Date(jobTyped.end_date) : new Date('9999-12-31')
  const jobStartDate = new Date(jobTyped.start_date)

  type PotentialCoworkerJob = { start_date: string; end_date: string | null; profiles?: any; id: string; company_name: string; job_title: string }
  const dateOverlaps = (potentialCoworkers as PotentialCoworkerJob[] | null)?.filter((otherJob: PotentialCoworkerJob) => {
    const otherStart = new Date(otherJob.start_date)
    const otherEnd = otherJob.end_date ? new Date(otherJob.end_date) : new Date('9999-12-31')
    
    // Check overlap: (start1 <= end2) AND (end1 >= start2)
    return otherStart <= jobEndDate && otherEnd >= jobStartDate
  }) || []

  // Filter out users who are already connected
  type ConnectionRow = { connected_user_id: string }
  const { data: existingConnections } = await supabaseAny
    .from('connections')
    .select('connected_user_id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  const connectedUserIds = new Set(
    (existingConnections as ConnectionRow[] | null)?.map((c: ConnectionRow) => c.connected_user_id) || []
  )

  const filtered = dateOverlaps.filter(
    (job: PotentialCoworkerJob) => job.profiles && !connectedUserIds.has(job.profiles.id)
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
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Prevent self-connection
  if (user.id === connectedUserId) {
    throw new Error('Cannot connect to yourself')
  }

  // Check if connection already exists
  const { data: existing } = await supabaseAny
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
  const { data: connection, error } = await supabaseAny
    .from('connections')
    .insert([{
      user_id: user.id,
      connected_user_id: connectedUserId,
      job_id: jobId || null,
      status: 'pending',
      initiated_by: user.id,
    }])
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
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Verify the connection is for this user
  type ConnectionFullRow = { user_id: string; connected_user_id: string }
  const { data: connection } = await supabaseAny
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single()
  
  const connectionTyped = connection as ConnectionFullRow | null

  if (!connectionTyped) {
    throw new Error('Connection not found')
  }

  if (
    connectionTyped.user_id !== user.id &&
    connectionTyped.connected_user_id !== user.id
  ) {
    throw new Error('Unauthorized')
  }

  // Update status to confirmed
  const { data: updated, error } = await supabaseAny
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
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  const { data: connections, error } = await supabaseAny
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

