import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { EmployerHeader } from '@/components/employer/employer-header'
import { EmployerSidebar } from '@/components/employer/employer-sidebar'
import { CandidateSearch } from '@/components/employer/candidate-search'
import { Button } from '@/components/ui/button'

export default async function EmployerCandidatesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const isEmployer = await hasRole('employer')
  
  if (!isEmployer) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                    Candidate Search
                  </h1>
                  <p className="text-grey-medium dark:text-gray-400 mt-1">
                    Find qualified professionals in law enforcement, security, hospitality, retail, and warehousing
                  </p>
                </div>
                <Button href="/employer/search-users" variant="secondary">
                  Search by Name
                </Button>
              </div>
            </div>
            <CandidateSearch />
          </div>
        </main>
      </div>
    </div>
  )
}
