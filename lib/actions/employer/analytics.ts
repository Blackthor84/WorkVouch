'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export interface RehireData {
  workerEmail: string
  rehireCount: number
  lastHired: string
}

export interface TrustScore {
  workerEmail: string
  score: number
}

/**
 * Get rehire data for workers
 * Rehire is tracked by counting how many times an employer has hired the same worker
 * (multiple job postings with the same worker)
 */
export async function getRehireData(employerId: string): Promise<RehireData[]> {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Get employer account
  type EmployerAccountRow = { id: string; company_name: string }
  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('id, company_name')
    .eq('id', employerId)
    .single()

  if (!employerAccount) {
    return []
  }

  const employerAccountTyped = employerAccount as EmployerAccountRow

  // Get all jobs for this employer's company
  const { data: jobs } = await supabaseAny
    .from('jobs')
    .select('user_id, created_at, profiles!inner(email)')
    .eq('company_name', employerAccountTyped.company_name)
    .order('created_at', { ascending: false })

  if (!jobs || jobs.length === 0) {
    return []
  }

  // Count rehires per worker
  const rehireMap = new Map<string, { count: number; lastHired: Date }>()

  for (const job of jobs as any[]) {
    const workerId = job.user_id
    const workerEmail = job.profiles?.email || 'Unknown'
    const jobDate = new Date(job.created_at)

    if (rehireMap.has(workerId)) {
      const existing = rehireMap.get(workerId)!
      existing.count += 1
      if (jobDate > existing.lastHired) {
        existing.lastHired = jobDate
      }
    } else {
      rehireMap.set(workerId, { count: 1, lastHired: jobDate })
    }
  }

  // Convert to array format, only include workers with rehire count > 1
  const rehireData: RehireData[] = []
  for (const [workerId, data] of rehireMap.entries()) {
    const job = (jobs as any[]).find(j => j.user_id === workerId)
    const workerEmail = job?.profiles?.email || 'Unknown'
    
    if (data.count > 1) {
      rehireData.push({
        workerEmail,
        rehireCount: data.count,
        lastHired: data.lastHired.toISOString(),
      })
    }
  }

  // Sort by rehire count descending
  return rehireData.sort((a, b) => b.rehireCount - a.rehireCount)
}

/**
 * Get trust scores for workers who have worked for this employer
 */
export async function getTrustScoresForEmployer(employerId: string): Promise<TrustScore[]> {
  const user = await requireAuth()
  const supabase = await createServerSupabase()
  const supabaseAny = supabase as any

  // Get employer account
  type EmployerAccountRow = { id: string; company_name: string }
  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('id, company_name')
    .eq('id', employerId)
    .single()

  if (!employerAccount) {
    return []
  }

  const employerAccountTyped = employerAccount as EmployerAccountRow

  // Get all unique worker IDs who have worked for this company
  const { data: jobs } = await supabaseAny
    .from('jobs')
    .select('user_id')
    .eq('company_name', employerAccountTyped.company_name)

  if (!jobs || jobs.length === 0) {
    return []
  }

  const workerIds = [...new Set((jobs as any[]).map(j => j.user_id))]

  // Get trust scores for these workers
  const { data: trustScores } = await supabaseAny
    .from('trust_scores')
    .select('user_id, score, profiles!inner(email)')
    .in('user_id', workerIds)

  if (!trustScores || trustScores.length === 0) {
    return []
  }

  // Format and return
  return (trustScores as any[]).map(ts => ({
    workerEmail: ts.profiles?.email || 'Unknown',
    score: parseFloat(ts.score) || 0,
  })).sort((a, b) => b.score - a.score)
}
