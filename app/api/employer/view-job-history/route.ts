import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { canViewEmployees } from '@/lib/middleware/plan-enforcement-supabase'
import { Database } from '@/types/database'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isEmployer = await hasRole('employer')
    if (!isEmployer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check plan tier
    const hasAccess = await canViewEmployees(user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'This feature requires a paid plan. Please upgrade to Basic or Pro.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const jobHistoryId = searchParams.get('jobHistoryId')

    if (!jobHistoryId) {
      return NextResponse.json(
        { error: 'jobHistoryId is required' },
        { status: 400 }
      )
    }

    const supabase = await supabaseTyped()

    // Type definitions for tables not in Database types yet
    type EmployerAccountRow = { id: string; company_name: string }

    // Get employer's company name
    const supabaseAny = supabase as any
    const { data: employerAccount } = await supabaseAny
      .from('employer_accounts')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (!employerAccount) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    // Get job history
    const { data: jobHistory, error: jobError } = await supabaseAny
      .from('jobs')
      .select(`
        *,
        profiles!inner (
          id,
          full_name,
          email,
          industry
        )
      `)
      .eq('id', jobHistoryId)
      .single()

    if (jobError || !jobHistory) {
      return NextResponse.json({ error: 'Job history not found' }, { status: 404 })
    }

    // Type definitions for job history
    type JobHistoryWithProfile = {
      id: string
      user_id: string
      company_name: string
      job_title: string
      start_date: string
      end_date: string | null
      verification_status?: string
      is_visible_to_employer?: boolean
      profiles?: {
        id: string
        full_name: string
        email: string
        industry: string
      }
    }

    const jobHistoryTyped = jobHistory as JobHistoryWithProfile
    const employerAccountTyped = employerAccount as EmployerAccountRow

    // Verify the job is for this employer's company
    if (jobHistoryTyped.company_name.toLowerCase() !== employerAccountTyped.company_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized to view this job history' },
        { status: 403 }
      )
    }

    // Verify visibility (unless employer is searching manually - paid feature)
    if (!(jobHistory as any).is_visible_to_employer) {
      return NextResponse.json(
        { error: 'This job history is not visible to employers' },
        { status: 403 }
      )
    }

    // Get references
    // Note: references table may not be in Database types yet
    type ReferenceRow = { id: string; rating: number; written_feedback: string; from_user_id: string; profiles?: { full_name: string } }
    const { data: references } = await supabaseAny
      .from('references')
      .select(`
        id,
        rating,
        written_feedback,
        from_user_id,
        profiles!references_from_user_id_fkey (
          full_name
        )
      `)
      .eq('job_id', jobHistoryId)
      .eq('to_user_id', jobHistory.user_id)

    // Get disputes for this job by this employer
    type EmployerDisputeRow = { id: string; dispute_reason: string; status: string; created_at: string }
    const { data: disputes } = await supabaseAny
      .from('employer_disputes')
      .select('id, dispute_reason, status, created_at')
      .eq('job_id', jobHistoryId)
      .eq('employer_account_id', employerAccountTyped.id)

    return NextResponse.json({
      jobHistory: {
        id: jobHistoryTyped.id,
        userId: jobHistoryTyped.user_id,
        employerName: jobHistoryTyped.company_name,
        jobTitle: jobHistoryTyped.job_title,
        startDate: jobHistoryTyped.start_date,
        endDate: jobHistoryTyped.end_date,
        verificationStatus: jobHistoryTyped.verification_status,
        isVisibleToEmployer: jobHistoryTyped.is_visible_to_employer,
        user: {
          id: jobHistoryTyped.profiles?.id,
          name: jobHistoryTyped.profiles?.full_name,
          email: jobHistoryTyped.profiles?.email,
          industry: jobHistoryTyped.profiles?.industry,
        },
        coworkerReferences: (references || []).map((ref: ReferenceRow) => ({
          id: ref.id,
          fromUser: {
            id: ref.from_user_id,
            name: ref.profiles?.full_name,
          },
          rating: ref.rating,
          message: ref.written_feedback,
        })),
        disputes: disputes || [],
      },
    })
  } catch (error) {
    console.error('View job history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job history' },
      { status: 500 }
    )
  }
}
