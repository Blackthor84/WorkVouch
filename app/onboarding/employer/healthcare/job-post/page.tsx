'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const HEALTHCARE_ROLES = [
  'CNA',
  'HHA',
  'Medical Assistant',
  'Patient Care Tech',
  'Dental Assistant',
  'Medical Receptionist',
  'Phlebotomist',
  'Pharmacy Technician',
  'ER Tech',
  'Caregiver',
  'Lab Assistant',
  'Sterile Processing Tech'
]

export default function HealthcareJobPosting() {
  const router = useRouter()
  const supabase = createClient()
  const [jobTitle, setJobTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredCertifications, setRequiredCertifications] = useState('')
  const [shift, setShift] = useState('')
  const [payRange, setPayRange] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [router, supabase])

  const handlePost = async () => {
    if (!jobTitle || !description) {
      alert('Please fill in job title and description')
      return
    }

    setLoading(true)

    try {
      // Get employer account
      const { data: employerAccount } = await supabase
        .from('employer_accounts')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!employerAccount) {
        alert('Employer account not found. Please complete employer setup first.')
        router.push('/onboarding/employer/healthcare')
        setLoading(false)
        return
      }

      // Parse certifications
      const certificationsArray = requiredCertifications
        ? requiredCertifications.split(',').map((c) => c.trim()).filter((c) => c.length > 0)
        : []

      // Create job posting
      const { error: jobError } = await supabase
        .from('job_postings')
        .insert({
          employer_id: employerAccount.id,
          title: jobTitle,
          description: description,
          industry: 'healthcare',
          required_certifications: certificationsArray.length > 0 ? certificationsArray : null,
          shift: shift || null,
          pay_range: payRange || null,
          is_published: true
        })

      if (jobError) {
        console.error('Error creating job posting:', jobError)
        alert('Error creating job posting. Please try again.')
        setLoading(false)
        return
      }

      router.push('/employer/dashboard')
    } catch (err: any) {
      console.error('Error:', err)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background dark:bg-[#0D1117] flex items-center justify-center">
          <div className="text-center">
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
              Post a Healthcare Job
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Create your first job posting
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <select
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                >
                  <option value="">-- Select Job Title --</option>
                  {HEALTHCARE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="requiredCertifications">Required Certifications (comma-separated)</Label>
                <Input
                  id="requiredCertifications"
                  type="text"
                  placeholder="e.g., BLS, CPR, CNA Certification"
                  value={requiredCertifications}
                  onChange={(e) => setRequiredCertifications(e.target.value)}
                />
                <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
                  Separate multiple certifications with commas
                </p>
              </div>

              <div>
                <Label htmlFor="shift">Shift</Label>
                <select
                  id="shift"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">-- Select Shift --</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                  <option value="Evening">Evening</option>
                  <option value="Weekend">Weekend</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <Label htmlFor="payRange">Pay Range</Label>
                <Input
                  id="payRange"
                  type="text"
                  placeholder="e.g., $20-25/hour or $40,000-50,000/year"
                  value={payRange}
                  onChange={(e) => setPayRange(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handlePost}
              disabled={loading || !jobTitle || !description}
              className="w-full"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </Card>
        </div>
      </main>
    </>
  )
}
