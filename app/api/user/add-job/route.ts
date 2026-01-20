import { NextRequest, NextResponse } from 'next/server'
import { supabaseTyped } from '@/lib/supabase-fixed'
import { getCurrentUser } from '@/lib/auth'
import { Database } from '@/types/database'
import { z } from 'zod'

const addJobSchema = z.object({
  employerName: z.string().min(1),
  jobTitle: z.string().min(1),
  startDate: z.string(), // ISO date string
  endDate: z.string().optional().nullable(), // ISO date string or null
  isVisibleToEmployer: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = addJobSchema.parse(body)

    const supabase = await supabaseTyped()
    const supabaseAny = supabase as any

    // Insert job
    // Note: verification_status and is_visible_to_employer may not be in Database types yet
    const { data: jobHistory, error: jobError } = await supabaseAny
      .from('jobs')
      .insert({
        user_id: user.id,
        company_name: data.employerName,
        job_title: data.jobTitle,
        start_date: data.startDate,
        end_date: data.endDate || null,
        is_current: !data.endDate,
        is_visible_to_employer: data.isVisibleToEmployer,
        verification_status: 'unverified',
        employment_type: 'full_time', // Default, can be updated later
      })
      .select()
      .single()

    if (jobError) {
      console.error('Add job error:', jobError)
      return NextResponse.json(
        { error: 'Failed to add job', details: jobError.message },
        { status: 500 }
      )
    }

    // Smart matching: Find potential coworkers with overlapping dates
    // Use RPC function or query with date overlap logic
    const { data: potentialCoworkerJobs } = await supabaseAny
      .from('jobs')
      .select(`
        id,
        user_id,
        job_title,
        start_date,
        end_date,
        profiles!inner (
          id,
          full_name,
          email
        )
      `)
      .ilike('company_name', data.employerName)
      .neq('user_id', user.id)
    
    // Filter for overlapping dates in JavaScript (more reliable than complex SQL)
    const startDate = new Date(data.startDate)
    const endDate = data.endDate ? new Date(data.endDate) : new Date()
    
    const potentialCoworkers = (potentialCoworkerJobs || [])
      .filter((job: any) => {
        const jobStart = new Date(job.start_date)
        const jobEnd = job.end_date ? new Date(job.end_date) : new Date()
        
        // Check if dates overlap
        return (jobStart <= endDate && jobEnd >= startDate)
      })
      .map((job: any) => ({
        userId: job.user_id,
        name: job.profiles?.full_name || null,
        email: job.profiles?.email || null,
        jobTitle: job.job_title,
        startDate: job.start_date,
        endDate: job.end_date,
      }))

    type JobHistoryRow = {
      id: string
      user_id: string
      company_name: string
      job_title: string
      start_date: string
      end_date: string | null
      is_visible_to_employer: boolean
      verification_status: string
    }
    const jobHistoryTyped = jobHistory as JobHistoryRow

    return NextResponse.json({
      success: true,
      jobHistory: {
        id: jobHistoryTyped.id,
        userId: jobHistoryTyped.user_id,
        employerName: jobHistoryTyped.company_name,
        jobTitle: jobHistoryTyped.job_title,
        startDate: jobHistoryTyped.start_date,
        endDate: jobHistoryTyped.end_date,
        isVisibleToEmployer: jobHistoryTyped.is_visible_to_employer,
        verificationStatus: jobHistoryTyped.verification_status,
      },
      potentialCoworkers,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Add job error:', error)
    return NextResponse.json(
      { error: 'Failed to add job' },
      { status: 500 }
    )
  }
}
