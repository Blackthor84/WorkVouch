import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { Database } from '@/types/database'
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

    const supabase = await supabaseTyped()

    // Type definitions for employer_disputes (not in Database types yet)
    type EmployerDisputeRow = { id: string; job_id: string; status: string }
    type EmployerDisputeUpdate = { status?: string }

    // Get dispute to find job_id
    const supabaseAny = supabase as any
    const { data: dispute, error: disputeError } = await supabaseAny
      .from('employer_disputes')
      .select('id, job_id')
      .eq('id', data.disputeId)
      .single()

    if (disputeError || !dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Update dispute status
    const { data: updatedDispute, error: updateError } = await supabaseAny
      .from('employer_disputes')
      .update({
        status: data.resolution === 'resolved' ? 'resolved' : 'rejected',
      } as Partial<EmployerDisputeUpdate>)
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
    const { error: jobUpdateError } = await (supabase as any)
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
        { error: 'Invalid input', details: error.issues },
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
