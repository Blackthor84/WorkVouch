'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface HealthcareCandidate {
  id: string
  full_name: string
  email: string
  healthcare_profile: {
    role: string
    work_setting: string
  } | null
  jobs: Array<{
    job_title: string
    company_name: string
    certifications: string[] | null
    start_date: string
    end_date: string | null
  }>
}

export default function HealthcareSearchPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<HealthcareCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [searchRole, setSearchRole] = useState('')
  const [searchSetting, setSearchSetting] = useState('')
  const [searchCertification, setSearchCertification] = useState('')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        window.location.href = '/auth/signin'
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [supabase])

  const handleSearch = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          healthcare_profiles (
            role,
            work_setting
          ),
          jobs (
            job_title,
            company_name,
            certifications,
            start_date,
            end_date
          )
        `)
        .eq('industry', 'healthcare')

      // Filter by role if specified
      if (searchRole) {
        query = query.eq('healthcare_profiles.role', searchRole)
      }

      // Filter by work setting if specified
      if (searchSetting) {
        query = query.eq('healthcare_profiles.work_setting', searchSetting)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error searching candidates:', error)
        alert('Error searching candidates. Please try again.')
        setLoading(false)
        return
      }

      // Filter by certification if specified
      let filtered = (data || []) as HealthcareCandidate[]
      
      if (searchCertification) {
        filtered = filtered.filter((candidate) => {
          return candidate.jobs?.some((job) => 
            job.certifications?.some((cert) => 
              cert.toLowerCase().includes(searchCertification.toLowerCase())
            )
          )
        })
      }

      setCandidates(filtered)
    } catch (err: any) {
      console.error('Error:', err)
      alert('An error occurred. Please try again.')
    } finally {
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
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="p-8 mb-6">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
              Search Healthcare Candidates
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Find qualified healthcare workers
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="searchRole">Role</Label>
                <Input
                  id="searchRole"
                  type="text"
                  placeholder="e.g., CNA, Medical Assistant"
                  value={searchRole}
                  onChange={(e) => setSearchRole(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="searchSetting">Work Setting</Label>
                <Input
                  id="searchSetting"
                  type="text"
                  placeholder="e.g., Hospital, Clinic"
                  value={searchSetting}
                  onChange={(e) => setSearchSetting(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="searchCertification">Certification</Label>
                <Input
                  id="searchCertification"
                  type="text"
                  placeholder="e.g., BLS, CPR"
                  value={searchCertification}
                  onChange={(e) => setSearchCertification(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Searching...' : 'Search Candidates'}
            </Button>
          </Card>

          {candidates.length > 0 && (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                        {candidate.full_name}
                      </h2>
                      <p className="text-grey-medium dark:text-gray-400">{candidate.email}</p>
                      {candidate.healthcare_profile && (
                        <div className="mt-2 flex gap-2">
                          <Badge variant="outline">{candidate.healthcare_profile.role}</Badge>
                          <Badge variant="outline">{candidate.healthcare_profile.work_setting}</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {candidate.jobs && candidate.jobs.length > 0 && (
                    <div className="mt-4">
                      <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-2">
                        Work History:
                      </h3>
                      <div className="space-y-2">
                        {candidate.jobs.map((job, idx) => (
                          <div key={idx} className="text-sm text-grey-medium dark:text-gray-400">
                            <strong>{job.job_title}</strong> at {job.company_name}
                            {job.certifications && job.certifications.length > 0 && (
                              <div className="mt-1">
                                <span className="text-xs">Certifications: </span>
                                {job.certifications.map((cert, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs mr-1">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {candidates.length === 0 && !loading && (
            <Card className="p-8 text-center">
              <p className="text-grey-medium dark:text-gray-400">
                No candidates found. Try adjusting your search criteria.
              </p>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
