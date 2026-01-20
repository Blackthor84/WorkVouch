import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { getCandidateReport } from '@/lib/actions/employer-purchases'
import { CandidateReportView } from '@/components/candidate-report-view'

export default async function CandidateReportPage({
  params,
}: {
  params: { candidateId: string }
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const isEmployer = await hasRole('employer')
  
  if (!isEmployer) {
    redirect('/dashboard')
  }

  let report
  try {
    report = await getCandidateReport(params.candidateId)
  } catch (error: any) {
    return (
      <>
        <NavbarServer />
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
          <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-8 shadow-md">
            <h1 className="text-2xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              Access Denied
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              {error.message || 'You do not have access to this report.'}
            </p>
            <a
              href={`/employer/search?candidateId=${params.candidateId}`}
              className="inline-block"
            >
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
                Purchase Report
              </button>
            </a>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <CandidateReportView report={report} />
      </main>
    </>
  )
}
