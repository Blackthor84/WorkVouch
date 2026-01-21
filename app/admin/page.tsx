import { redirect } from 'next/navigation'
import { isAdmin, isSuperAdmin } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

// Mark as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminPanel() {
  const admin = await isAdmin()
  const superAdmin = await isSuperAdmin()

  if (!admin && !superAdmin) {
    redirect('/dashboard')
  }

  // Get all users with their roles
  const supabase = await createSupabaseServerClient()
  const supabaseAny = supabase as any

  // Get all profiles
  const { data: profiles } = await supabaseAny
    .from('profiles')
    .select('id, email, full_name, created_at')
    .order('created_at', { ascending: false })
    .limit(100) // Limit to recent 100 users for performance

  // Get all user roles
  const { data: userRoles } = await supabaseAny
    .from('user_roles')
    .select('user_id, role')

  // Create a map of user_id -> roles
  const rolesMap = new Map<string, string[]>()
  if (userRoles) {
    for (const ur of userRoles as any[]) {
      const userId = ur.user_id
      if (!rolesMap.has(userId)) {
        rolesMap.set(userId, [])
      }
      rolesMap.get(userId)!.push(ur.role)
    }
  }

  return (
    <>
      <NavbarServer />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Admin Panel
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Manage users, disputes, and verification requests
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        {/* Users Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Recent Users ({profiles?.length || 0})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-[#1A1F2B] rounded-xl shadow overflow-hidden">
              <thead className="bg-gray-100 dark:bg-[#0D1117]">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Email
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Name
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Roles
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {profiles && profiles.length > 0 ? (
                  (profiles as any[]).map((profile) => {
                    const roles = rolesMap.get(profile.id) || []
                    return (
                      <tr
                        key={profile.id}
                        className="border-b border-grey-background dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                          {profile.email || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                          {profile.full_name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {roles.length > 0 ? (
                              roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant={
                                    role === 'superadmin'
                                      ? 'destructive'
                                      : role === 'admin'
                                      ? 'warning'
                                      : role === 'employer'
                                      ? 'info'
                                      : 'default'
                                  }
                                >
                                  {role}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="default">user</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-grey-medium dark:text-gray-400">
                          {new Date(profile.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-grey-medium dark:text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <Link href="/admin/users">
              <Button variant="secondary">View All Users</Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
