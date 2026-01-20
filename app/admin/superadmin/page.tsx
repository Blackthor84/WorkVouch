import { redirect } from 'next/navigation'
import { isSuperAdmin } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

export default async function SuperAdminPage() {
  const isSuper = await isSuperAdmin()

  if (!isSuper) {
    redirect('/admin')
  }

  return (
    <>
      <NavbarServer />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Superadmin Control Panel
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Full system access and management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-red-500">
            <Link href="/admin/signups" className="block">
              <UserGroupIcon className="h-10 w-10 text-red-600 dark:text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                All Signups
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                View complete list of all user signups and accounts
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin/users" className="block">
              <UserGroupIcon className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Manage Users
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                View and manage all user accounts and profiles
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/admin" className="block">
              <ShieldCheckIcon className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Admin Dashboard
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Standard admin functions and controls
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/employer/dashboard" className="block">
              <ChartBarIcon className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-4" />
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Employer Dashboard
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Access employer features and tools
              </p>
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <Link href="/dashboard" className="block">
              <Cog6ToothIcon className="h-10 w-10 text-gray-600 dark:text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-2">
                User Dashboard
              </h2>
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Standard user dashboard and features
              </p>
            </Link>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
            Superadmin Access
          </h3>
          <p className="text-sm text-red-800 dark:text-red-300">
            As a superadmin, you have full access to all features, screens, and data in the system. 
            You can view all signups, manage users, access employer features, and perform all administrative functions.
          </p>
        </div>
      </div>
    </>
  )
}
