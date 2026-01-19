import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { isEmployer } from '@/lib/auth'

const MAX_RESULTS = 50

export async function GET(request: NextRequest) {
  try {
    // Check authentication and employer role
    const userIsEmployer = await isEmployer()
    if (!userIsEmployer) {
      return NextResponse.json({ error: 'Forbidden: Employer access required' }, { status: 403 })
    }

    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')?.trim()

    if (!query || query.length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Sanitize query - remove special characters that could cause SQL injection
    const sanitizedQuery = query.replace(/[%_]/g, '')

    if (sanitizedQuery.length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Search profiles by full_name (case-insensitive)
    // Split the query to search for first name, last name, or full name
    const searchTerms = sanitizedQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0)

    // Build the query - search for profiles where full_name contains the query (case-insensitive)
    // Using ilike for case-insensitive pattern matching
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        professional_summary
      `)
      .ilike('full_name', `%${sanitizedQuery}%`)
      .limit(MAX_RESULTS)

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      return NextResponse.json({ error: 'Failed to search profiles' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get user IDs
    const userIds = profiles.map(p => p.id)

    // Fetch skills for all users
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('user_id, skill_name')
      .in('user_id', userIds)

    if (skillsError) {
      console.error('Skills query error:', skillsError)
      // Continue without skills if query fails
    }

    // Fetch jobs for all users (limit to most recent 3 per user for summary)
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('user_id, job_title, company_name, start_date, is_current')
      .in('user_id', userIds)
      .eq('is_private', false) // Only show public jobs
      .order('start_date', { ascending: false })

    if (jobsError) {
      console.error('Jobs query error:', jobsError)
      // Continue without jobs if query fails
    }

    // Group skills by user_id
    const skillsByUser = new Map<string, string[]>()
    if (skillsData) {
      skillsData.forEach((skill) => {
        if (!skillsByUser.has(skill.user_id)) {
          skillsByUser.set(skill.user_id, [])
        }
        skillsByUser.get(skill.user_id)!.push(skill.skill_name)
      })
    }

    // Group jobs by user_id and limit to 3 most recent per user
    const jobsByUser = new Map<string, Array<{ title: string; company: string; date: string }>>()
    if (jobsData) {
      const userJobCounts = new Map<string, number>()
      jobsData.forEach((job) => {
        const userId = job.user_id
        const currentCount = userJobCounts.get(userId) || 0
        
        if (currentCount < 3) {
          if (!jobsByUser.has(userId)) {
            jobsByUser.set(userId, [])
          }
          
          const dateStr = job.is_current 
            ? `${new Date(job.start_date).getFullYear()} - Present`
            : `${new Date(job.start_date).getFullYear()}`
          
          jobsByUser.get(userId)!.push({
            title: job.job_title,
            company: job.company_name,
            date: dateStr,
          })
          
          userJobCounts.set(userId, currentCount + 1)
        }
      })
    }

    // Combine data into result array
    const users = profiles.map((profile) => {
      const skills = skillsByUser.get(profile.id) || []
      const jobs = jobsByUser.get(profile.id) || []

      return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        skills: skills.slice(0, 10), // Limit to 10 skills for display
        workHistory: jobs,
        summary: profile.professional_summary || null,
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
