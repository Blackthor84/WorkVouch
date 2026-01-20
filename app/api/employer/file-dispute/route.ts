import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { canFileDispute } from '@/lib/middleware/plan-enforcement-supabase'
import { Database } from '@/types/database'
import { z } from 'zod'

const fileDisputeSchema = z.object({
  jobHistoryId: z.string().uuid(),
  disputeReason: z.string().min(10),
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

    // Check plan tier - only Pro can file disputes
    const hasAccess = await canFileDispute(user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Filing disputes requires a Pro plan. Please upgrade.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const data = fileDisputeSchema.parse(body)

    const supabase = await supabaseTyped()

    // Type definitions for tables not in Database types yet
    type EmployerAccountRow = { id: string; company_name: string; user_id: string }
    type EmployerDisputeInsert = {
      employer_account_id: string
      job_id: string
      dispute_reason: string
      status: string
    }

    // Get employer's company name
    const { data: employerAccount, error: employerError } = await (supabase as any)
      .from<EmployerAccountRow>('employer_accounts')
      .select('id, company_name')
      .eq('user_id', user.id)
      .single()

    if (employerError || !employerAccount) {
      return NextResponse.json({ error: 'Employer not found' }, { status: 404 })
    }

    // Verify job history exists and is for this employer
    const { data: jobHistory, error: jobError } = await supabase
      .from<Database['public']['Tables']['jobs']['Row']>('jobs')
      .select('id, company_name')
      .eq('id', data.jobHistoryId)
      .single()

    if (jobError || !jobHistory) {
      return NextResponse.json({ error: 'Job history not found' }, { status: 404 })
    }

    if (jobHistory.company_name.toLowerCase() !== employerAccount.company_name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Unauthorized to dispute this job history' },
        { status: 403 }
      )
    }

    // Create dispute
    const { data: dispute, error: disputeError } = await (supabase as any)
      .from('employer_disputes')
      .insert({
        employer_account_id: employerAccount.id,
        job_id: data.jobHistoryId,
        dispute_reason: data.disputeReason,
        status: 'open',
      } as EmployerDisputeInsert)
      .select()
      .single()

    if (disputeError) {
      console.error('Create dispute error:', disputeError)
      return NextResponse.json(
        { error: 'Failed to create dispute' },
        { status: 500 }
      )
    }

    // Update job history status to disputed
    await supabase
      .from<Database['public']['Tables']['jobs']['Row']>('jobs')
      .update({ verification_status: 'disputed' } as any)
      .eq('id', data.jobHistoryId)

    return NextResponse.json({ success: true, dispute })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('File dispute error:', error)
    return NextResponse.json(
      { error: 'Failed to file dispute' },
      { status: 500 }
    )
  }
}
