import { redirect } from 'next/navigation'
import { isAdmin, isSuperAdmin } from '@/lib/auth'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AdminDashboard() {
  const admin = await isAdmin()
  const superAdmin = await isSuperAdmin()

  if (!admin && !superAdmin) {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/users" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Manage Users
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                View and manage all user accounts
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/disputes" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Disputes Queue
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Review and resolve employer disputes
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/verifications" className="block">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Verification Requests
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Approve or reject verification requests
              </p>
            </Link>
          </Card>

          {superAdmin && (
            <>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
                <Link href="/admin/superadmin" className="block">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    Superadmin Control
                  </h2>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    Full system access and management
                  </p>
                </Link>
              </Card>
              <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
                <Link href="/admin/signups" className="block">
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                    All Signups
                  </h2>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    View complete list of all user signups
                  </p>
                </Link>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  )
}

