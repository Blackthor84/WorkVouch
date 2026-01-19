import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobs, education, skills, certifications, contactInfo, summary } = body

    if (!user.id) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
    }

    const errors: string[] = []

    // Save jobs
    if (jobs && Array.isArray(jobs) && jobs.length > 0) {
      const jobsToInsert = jobs.map((job: any) => ({
        user_id: user.id,
        company_name: job.company || '',
        job_title: job.title || '',
        employment_type: 'full_time' as const, // Default, can be updated later
        start_date: job.startDate || new Date().toISOString().split('T')[0],
        end_date: job.endDate || (job.isCurrent ? null : new Date().toISOString().split('T')[0]),
        is_current: job.isCurrent || false,
        location: job.location || null,
        responsibilities: job.responsibilities || null,
      }))

      const { error: jobsError } = await supabase.from('jobs').upsert(jobsToInsert, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

      if (jobsError) {
        console.error('Jobs insert error:', jobsError)
        errors.push(`Failed to save jobs: ${jobsError.message}`)
      }
    }

    // Save education
    if (education && Array.isArray(education) && education.length > 0) {
      const educationToInsert = education.map((edu: any) => ({
        user_id: user.id,
        school: edu.school || '',
        degree: edu.degree || null,
        field_of_study: edu.fieldOfStudy || null,
        start_year: edu.startYear || null,
        end_year: edu.endYear || null,
        is_current: edu.isCurrent || false,
        gpa: edu.gpa || null,
        description: edu.description || null,
      }))

      const { error: educationError } = await supabase.from('education').upsert(educationToInsert, {
        onConflict: 'id',
        ignoreDuplicates: false,
      })

      if (educationError) {
        console.error('Education insert error:', educationError)
        errors.push(`Failed to save education: ${educationError.message}`)
      }
    }

    // Save skills
    if (skills && Array.isArray(skills) && skills.length > 0) {
      // Delete existing skills first to avoid duplicates
      await supabase.from('skills').delete().eq('user_id', user.id)

      const skillsToInsert = skills.map((skill: string) => ({
        user_id: user.id,
        skill_name: skill.trim(),
        skill_category: 'technical', // Default, can be updated later
        proficiency_level: null,
      }))

      const { error: skillsError } = await supabase.from('skills').insert(skillsToInsert)

      if (skillsError) {
        console.error('Skills insert error:', skillsError)
        errors.push(`Failed to save skills: ${skillsError.message}`)
      }
    }

    // Save certifications as skills with category
    if (certifications && Array.isArray(certifications) && certifications.length > 0) {
      const certsToInsert = certifications.map((cert: string) => ({
        user_id: user.id,
        skill_name: cert.trim(),
        skill_category: 'certification',
        proficiency_level: null,
      }))

      const { error: certsError } = await supabase.from('skills').upsert(certsToInsert, {
        onConflict: 'user_id,skill_name',
        ignoreDuplicates: false,
      })

      if (certsError) {
        console.error('Certifications insert error:', certsError)
        errors.push(`Failed to save certifications: ${certsError.message}`)
      }
    }

    // Update profile with contact info and summary
    const profileUpdates: any = {}
    if (contactInfo?.email) {
      profileUpdates.email = contactInfo.email
    }
    if (contactInfo?.phone) {
      // Store phone in a custom field if you have one, or skip
      // profileUpdates.phone = contactInfo.phone
    }
    if (summary) {
      profileUpdates.professional_summary = summary
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        errors.push(`Failed to update profile: ${profileError.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Profile saved with some errors',
          errors,
        },
        { status: 207 } // Multi-Status
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
    })
  } catch (error) {
    console.error('Save profile error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
