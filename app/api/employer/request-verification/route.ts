import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { canRequestVerification } from '@/lib/middleware/plan-enforcement-supabase'
import { Database } from '@/types/database'
import { z } from 'zod'

const requestVerificationSchema = z.object({
  jobHistoryId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
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
    const hasAccess = await canRequestVerification(user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'This feature requires a paid plan. Please upgrade to Basic or Pro.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = requestVerificationSchema.parse(body)

    const supabase = await supabaseTyped()

    // Type definitions for tables not in Database types yet
    type EmployerAccountRow = { id: string; company_name: string }
    type VerificationRequestInsert = {
      job_id: string
      requested_by_type: string
      requested_by_id: string
      status: string
    }

    // Get employer's company name
    const supabaseAny = supabase as any
    const { data: employerAccount, error: employerError } = await supabaseAny
      .from('employer_accounts')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (employerError || !employerAccount) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    // Verify job history exists and is for this employer
    const { data: jobHistory, error: jobError } = await supabaseAny
      .from('jobs')
      .select('id, company_name')
      .eq('id', data.jobHistoryId)
      .single()

    if (jobError || !jobHistory) {
      return NextResponse.json({ error: 'Job history not found' }, { status: 404 })
    }

    type JobHistoryRow = { id: string; company_name: string }
    const jobHistoryTyped = jobHistory as JobHistoryRow
    const employerAccountTyped = employerAccount as EmployerAccountRow

    if (jobHistoryTyped.company_name.toLowerCase() !== employerAccountTyped.company_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized to request verification for this job history' },
        { status: 403 }
      )
    }

    // Create verification request
    const { data: verificationRequest, error: createError } = await supabaseAny
      .from('verification_requests')
      .insert({
        job_id: data.jobHistoryId,
        requested_by_type: 'employer',
        requested_by_id: employerAccountTyped.id,
        status: 'pending',
      } as VerificationRequestInsert)
      .select()
      .single()

    if (createError) {
      console.error('Create verification request error:', createError)
      return NextResponse.json(
        { error: 'Failed to create verification request' },
        { status: 500 }
      )
    }

    // Update job history to make it visible and set status to pending
    await (supabase as any)
      .from('jobs')
      .update({
        is_visible_to_employer: true,
        verification_status: 'pending',
      })
      .eq('id', data.jobHistoryId)

    return NextResponse.json({ success: true, verificationRequest })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Request verification error:', error)
    return NextResponse.json(
      { error: 'Failed to request verification' },
      { status: 500 }
    )
  }
}
