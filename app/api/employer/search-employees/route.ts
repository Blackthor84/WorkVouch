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

    const supabase = await supabaseTyped()

    // Type definition for employer_accounts (not in Database types yet)
    type EmployerAccountRow = { company_name: string }

    // Get employer's company name
    const supabaseAny = supabase as any
    const { data: employerAccount } = await supabaseAny
      .from('employer_accounts')
      .select('company_name')
      .eq('user_id', user.id)
      .single()

    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')
    const companyName = searchParams.get('companyName') || employerAccount?.company_name

    if (!name || name.length < 2) {
      return NextResponse.json({ employees: [] })
    }

    if (!companyName) {
      return NextResponse.json({ error: 'Company name not found' }, { status: 404 })
    }

    // Search for employees who:
    // 1. Have a job history with this employer's company name
    // 2. Have isVisibleToEmployer = true OR the employer is searching by name (paid feature)
    // 3. Match the name search

    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        user_id,
        job_title,
        start_date,
        end_date,
        verification_status,
        is_visible_to_employer,
        company_name,
        profiles!inner (
          id,
          full_name,
          email,
          industry
        )
      `)
      .ilike('company_name', companyName)
      .ilike('profiles.full_name', `%${name}%`)
      .order('start_date', { ascending: false })

    if (jobsError) {
      console.error('Search employees error:', jobsError)
      return NextResponse.json(
        { error: 'Failed to search employees' },
        { status: 500 }
      )
    }

    // Filter for visible jobs or allow if searching (paid feature)
    const visibleJobs = (jobs || []).filter((job: any) => 
      job.is_visible_to_employer || true // Paid employers can see all when searching
    )

    // Get references for each job
    const employeesWithReferences = await Promise.all(
      visibleJobs.map(async (job: any) => {
        const { data: references } = await supabase
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
          .eq('job_id', job.id)
          .eq('to_user_id', job.user_id)

        return {
          userId: job.user_id,
          jobId: job.id, // Add job ID for verification/dispute actions
          name: job.profiles?.full_name || null,
          email: job.profiles?.email || null,
          industry: job.profiles?.industry || null,
          jobTitle: job.job_title,
          startDate: job.start_date,
          endDate: job.end_date,
          verificationStatus: job.verification_status,
          isVisibleToEmployer: job.is_visible_to_employer,
          references: (references || []).map((ref: any) => ({
            id: ref.id,
            fromUserName: ref.profiles?.full_name || null,
            rating: ref.rating,
            message: ref.written_feedback,
          })),
        }
      })
    )

    return NextResponse.json({ employees: employeesWithReferences })
  } catch (error) {
    console.error('Search employees error:', error)
    return NextResponse.json(
      { error: 'Failed to search employees' },
      { status: 500 }
    )
  }
}
