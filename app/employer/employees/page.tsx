import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { EmployerHeader } from '@/components/employer/employer-header'
import { EmployerSidebar } from '@/components/employer/employer-sidebar'
import { EmployeeSearch } from '@/components/workvouch/employee-search'

export default async function EmployerEmployeesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  const isEmployer = await hasRole('employer')
  const isSuperAdmin = await hasRole('superadmin')

  if (!isEmployer && !isSuperAdmin) {
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
              <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
                Employee Roster
              </h1>
              <p className="text-grey-medium dark:text-gray-400">
                Search and view employees who list your company in their work history
              </p>
            </div>
            <EmployeeSearch />
          </div>
        </main>
      </div>
    </div>
  )
}
