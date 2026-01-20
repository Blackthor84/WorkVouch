'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HEALTHCARE_SETTINGS = [
  'Hospital',
  'Nursing Home',
  'Assisted Living',
  'Home Health Agency',
  'Dental Office',
  'Clinic / Outpatient',
  'Rehab Center',
  'Lab / Diagnostics'
]

export function EmployerOnboardingClient() {
  const router = useRouter()
  const supabase = createClient()
  const [companyName, setCompanyName] = useState('')
  const [workSetting, setWorkSetting] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      // Check if user is an employer
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (profile?.role !== 'employer') {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [router, supabase])

  const handleNext = async () => {
    if (!companyName || !workSetting || !location) {
      alert('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Update employer account with healthcare info
      const { error: employerError } = await supabase
        .from('employer_accounts')
        .update({
          company_name: companyName,
          industry: 'healthcare',
          work_setting: workSetting,
          location: location
        })
        .eq('user_id', user.id)

      if (employerError) {
        console.error('Error updating employer account:', employerError)
        // If employer_accounts doesn't exist, create it
        const { error: createError } = await supabase
          .from('employer_accounts')
          .insert({
            user_id: user.id,
            company_name: companyName,
            industry: 'healthcare',
            work_setting: workSetting,
            location: location,
            plan_tier: 'free'
          })

        if (createError) {
          console.error('Error creating employer account:', createError)
          alert('Error saving information. Please try again.')
          setLoading(false)
          return
        }
      }

      router.push('/onboarding/employer/healthcare/job-post')
    } catch (err: any) {
      console.error('Error:', err)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        Healthcare Employer Setup
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Tell us about your healthcare facility
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="companyName">Company/Facility Name *</Label>
          <Input
            id="companyName"
            type="text"
            placeholder="e.g., General Hospital, ABC Clinic"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="workSetting">Work Setting *</Label>
          <select
            id="workSetting"
            value={workSetting}
            onChange={(e) => setWorkSetting(e.target.value)}
            className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          >
            <option value="">-- Select Setting --</option>
            {HEALTHCARE_SETTINGS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., New York, NY or 123 Main St, City, State"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
      </div>

      <Button
        onClick={handleNext}
        disabled={loading || !companyName || !workSetting || !location}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Next'}
      </Button>
    </Card>
  )
}
