import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile } from '@/lib/auth'
import { getUserJobs } from '@/lib/actions/jobs'
import { getUserReferences } from '@/lib/actions/references'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProfileSection } from '@/components/profile-section'
import { JobsSection } from '@/components/jobs-section'
import { BriefcaseIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const profile = await getCurrentUserProfile()
  const jobs = await getUserJobs()
  const references = profile ? await getUserReferences(profile.id) : []

  // Normalize profile: convert string | null to string
  const safeProfile = profile ? {
    ...profile,
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
  } : null

  // Normalize jobs: convert string | null to string
  const safeJobs = (jobs && Array.isArray(jobs)) ? jobs.map((job: any) => ({
    ...job,
    company_name: job.company_name ?? "",
    job_title: job.job_title ?? "",
    location: job.location ?? null, // location can remain null
  })) : []

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            My Profile
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Manage your profile, job history, and references
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {safeProfile && <ProfileSection profile={safeProfile} />}
            {safeJobs && safeJobs.length > 0 && <JobsSection jobs={safeJobs} />}
            
            {/* Peer References */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                  Peer References
                </h2>
                <Button variant="ghost" size="sm" href="/dashboard#references">
                  Request Reference
                </Button>
              </div>
              {references && references.length > 0 ? (
                <div className="space-y-4">
                  {references.map((ref: any) => (
                    <div
                      key={ref.id}
                      className="p-4 border border-grey-background dark:border-[#374151] rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {ref.from_user?.full_name?.charAt(0) || 'R'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-grey-dark dark:text-gray-200">
                              {ref.from_user?.full_name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-grey-medium dark:text-gray-400">
                              Former Coworker
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIconSolid
                              key={i}
                              className={`h-5 w-5 ${
                                i < ref.rating
                                  ? 'text-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {ref.comment && (
                        <p className="text-sm text-grey-dark dark:text-gray-200 italic mt-2">
                          "{ref.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <StarIcon className="h-12 w-12 text-grey-medium dark:text-gray-400 mx-auto mb-4" />
                  <p className="text-grey-medium dark:text-gray-400">
                    No references yet. Request references from coworkers to build your profile.
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            {/* Skills/Industry Fields */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Skills & Certifications
              </h3>
              <div className="space-y-2">
                {safeProfile?.industry && (
                  <Badge variant="info" className="mr-2 mb-2">
                    {safeProfile.industry.replace('_', ' ')}
                  </Badge>
                )}
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Add industry-specific skills and certifications in your profile settings.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
