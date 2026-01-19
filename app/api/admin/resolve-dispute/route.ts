import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { z } from 'zod'

const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(['resolved', 'rejected']),
  verificationStatus: z.enum(['verified', 'unverified']),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = resolveDisputeSchema.parse(body)

    const supabase = await createServerClient()

    // Get dispute to find job_id
    const { data: dispute, error: disputeError } = await supabase
      .from('employer_disputes')
      .select('id, job_id')
      .eq('id', data.disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Update dispute status
    const { data: updatedDispute, error: updateError } = await supabase
      .from('employer_disputes')
      .update({
        status: data.resolution === 'resolved' ? 'resolved' : 'rejected',
      })
      .eq('id', data.disputeId)
      .select()
      .single()

    if (updateError) {
      console.error('Update dispute error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update dispute' },
        { status: 500 }
      )
    }

    // Update job history verification status
    const { error: jobUpdateError } = await supabase
      .from('jobs')
      .update({
        verification_status: data.verificationStatus,
      })
      .eq('id', dispute.job_id)

    if (jobUpdateError) {
      console.error('Update job error:', jobUpdateError)
      return NextResponse.json(
        { error: 'Failed to update job verification status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, dispute: updatedDispute })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Resolve dispute error:', error)
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    )
  }
}
