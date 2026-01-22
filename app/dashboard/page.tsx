import { redirect } from 'next/navigation'
import { getCurrentUser, getCurrentUserProfile, isEmployer } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrustScoreCard } from '@/components/trust-score-card'
import {
  UserCircleIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon as JobsIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline'

export default async function UserDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user is an employer and redirect them
  const userIsEmployer = await isEmployer()
  if (userIsEmployer) {
    redirect('/employer/dashboard')
  }

  const profile = await getCurrentUserProfile()

  // Normalize profile: convert string | null to string
  const safeProfile = profile ? {
    ...profile,
    full_name: profile.full_name ?? "",
    email: profile.email ?? "",
  } : null

  // Mock data
  const shortcuts = [
    { href: '/upload-resume', label: 'Upload Resume', icon: DocumentArrowUpIcon, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { href: '/profile', label: 'Profile', icon: UserCircleIcon, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { href: '/my-jobs', label: 'Job History', icon: BriefcaseIcon, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { href: '/coworker-matches', label: 'Coworker Matches', icon: UserGroupIcon, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    { href: '/messages', label: 'Messages', icon: ChatBubbleLeftRightIcon, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    { href: '/jobs', label: 'Browse Jobs', icon: JobsIcon, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  ]

  const activityFeed = [
    { id: 1, type: 'reference', message: 'New reference from John Doe', time: '2 hours ago' },
    { id: 2, type: 'match', message: 'Coworker match found at ABC Security', time: '1 day ago' },
    { id: 3, type: 'message', message: 'New message from employer', time: '2 days ago' },
  ]

  return (
    <>
      <NavbarServer />
      <main className="flex-1 flex flex-col container mx-auto px-4 py-8 md:py-12 lg:py-16 bg-background dark:bg-[#0D1117]">
        <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
              Dashboard
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mt-1">
              Welcome back, {safeProfile?.full_name || user.email}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
            {/* Shortcuts */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {shortcuts.map((shortcut) => {
                  const Icon = shortcut.icon
                  return (
                    <Button
                      key={shortcut.href}
                      href={shortcut.href}
                      variant="ghost"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                    >
                      <div className={`p-3 rounded-xl ${shortcut.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold">{shortcut.label}</span>
                    </Button>
                  )
                })}
              </div>
            </Card>

            {/* Activity Feed */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                  Recent Activity
                </h2>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {activityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-grey-background dark:bg-[#1A1F2B]"
                  >
                    <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm text-grey-dark dark:text-gray-200">{activity.message}</p>
                      <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
            <TrustScoreCard userId={safeProfile?.id || user.id} />
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
                Profile Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-medium dark:text-gray-400">Profile Complete</span>
                  <Badge variant="success">85%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-medium dark:text-gray-400">References</span>
                  <Badge variant="info">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-grey-medium dark:text-gray-400">Job History</span>
                  <Badge variant="info">5</Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
