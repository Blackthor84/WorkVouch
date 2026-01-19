import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole } from '@/lib/auth'
import { EmployerHeader } from '@/components/employer/employer-header'
import { EmployerSidebar } from '@/components/employer/employer-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const isEmployer = await hasRole('employer')
  const isSuperAdmin = await hasRole('superadmin')
  
  // Allow superadmin to access employer dashboard
  if (!isEmployer && !isSuperAdmin) {
    redirect('/dashboard')
  }

  // Mock data
  const recentActivity = [
    { id: 1, type: 'application', message: 'New application for Security Guard position', time: '2 hours ago' },
    { id: 2, type: 'message', message: 'Message from John Doe', time: '5 hours ago' },
    { id: 3, type: 'candidate', message: 'New candidate saved: Jane Smith', time: '1 day ago' },
  ]

  const stats = [
    { label: 'Active Jobs', value: '12', change: '+3' },
    { label: 'Applications', value: '48', change: '+12' },
    { label: 'Saved Candidates', value: '24', change: '+5' },
    { label: 'Messages', value: '8', change: '+2' },
  ]

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                Dashboard
              </h1>
              <p className="text-grey-medium dark:text-gray-400 mt-1">
                Welcome back! Here's what's happening with your job postings and candidates.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button href="/employer/job-posts?action=create" className="h-auto p-4 flex flex-col items-start">
                <PlusIcon className="h-6 w-6 mb-2" />
                <span className="font-semibold">Post New Job</span>
                <span className="text-sm opacity-90">Create a job listing</span>
              </Button>
              <Button variant="secondary" href="/employer/employees" className="h-auto p-4 flex flex-col items-start">
                <MagnifyingGlassIcon className="h-6 w-6 mb-2" />
                <span className="font-semibold">Search Employees</span>
                <span className="text-sm opacity-90">View employees who list your company</span>
              </Button>
              <Button variant="secondary" href="/employer/billing" className="h-auto p-4 flex flex-col items-start">
                <ArrowTrendingUpIcon className="h-6 w-6 mb-2" />
                <span className="font-semibold">Upgrade Plan</span>
                <span className="text-sm opacity-90">Unlock premium features</span>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-grey-medium dark:text-gray-400">{stat.label}</p>
                    <Badge variant="success">{stat.change}</Badge>
                  </div>
                  <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
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
                {recentActivity.map((activity) => (
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
        </main>
      </div>
    </div>
  )
}
