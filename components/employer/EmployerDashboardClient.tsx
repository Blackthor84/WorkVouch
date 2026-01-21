'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UpgradeModal from '@/components/UpgradeModal'
import EmployerAnalytics from './EmployerAnalytics'
import VerificationLimitWarning from '@/components/VerificationLimitWarning'
import ExportDataButton from '@/components/ExportDataButton'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

interface EmployerDashboardClientProps {
  userRole: string
  planTier?: string
  employerId?: string
}

export function EmployerDashboardClient({ userRole, planTier, employerId }: EmployerDashboardClientProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [rehireCount, setRehireCount] = useState<number | null>(null)
  const [rehireData, setRehireData] = useState<any[]>([])
  const [trustScores, setTrustScores] = useState<any[]>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [verificationCount, setVerificationCount] = useState(0)
  const [verificationLimit, setVerificationLimit] = useState(10)

  useEffect(() => {
    // Fetch verification limit data
    if (employerId) {
      fetch(`/api/employer/verification-limit?employerId=${employerId}`)
        .then((r) => r.json())
        .then((data) => {
          setVerificationCount(data.currentCount || 0)
          setVerificationLimit(data.limit || 10)
        })
        .catch((error) => {
          console.error('Failed to fetch verification limit:', error)
        })
    }

    // Fetch additional data if user has pro/enterprise plan
    if (planTier === 'pro' || planTier === 'enterprise') {
      // Fetch analytics data
      if (employerId) {
        setLoadingAnalytics(true)
        Promise.all([
          fetch(`/api/employer/analytics/rehire?employerId=${employerId}`).then((r) => r.json()),
          fetch(`/api/employer/analytics/trust-scores?employerId=${employerId}`).then((r) =>
            r.json()
          ),
        ])
          .then(([rehire, trust]) => {
            setRehireData(rehire.data || [])
            setTrustScores(trust.data || [])
            setLoadingAnalytics(false)
          })
          .catch(() => {
            setLoadingAnalytics(false)
          })
      }
    }
  }, [planTier, employerId])

  const isBasicPlan = planTier === 'free' || planTier === 'basic' || !planTier

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
    <>
      {isBasicPlan && showUpgradeModal && (
        <UpgradeModal
          feature="Pro Features"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Dashboard
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your job postings and candidates.
          </p>
          {planTier && (
            <Badge variant={planTier === 'pro' || planTier === 'enterprise' ? 'success' : 'default'} className="mt-2">
              {planTier === 'pro' ? 'Professional Plan' : planTier === 'enterprise' ? 'Enterprise Plan' : 'Basic Plan'}
            </Badge>
          )}
        </div>

        {/* Pro Features (only visible for Pro/Enterprise) */}
        {!isBasicPlan && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-grey-dark dark:text-gray-200">
                Trust Score
              </h3>
              <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                {trustScore ?? 'N/A'}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-grey-dark dark:text-gray-200">
                Rehire Count
              </h3>
              <p className="text-3xl font-bold text-grey-dark dark:text-gray-200">
                {rehireCount ?? 'N/A'}
              </p>
            </Card>
          </div>
        )}

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
          <Button 
            variant="secondary" 
            href="/pricing" 
            className="h-auto p-4 flex flex-col items-start"
            onClick={(e) => {
              if (isBasicPlan) {
                e.preventDefault()
                setShowUpgradeModal(true)
              }
            }}
          >
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

        {/* Verification Limit Warning */}
        {isBasicPlan && (
          <VerificationLimitWarning limit={verificationLimit} used={verificationCount} />
        )}

        {/* Analytics Section */}
        <div className="mt-8">
          {loadingAnalytics ? (
            <Card className="p-6">
              <p className="text-grey-medium dark:text-gray-400 text-center">Loading analytics...</p>
            </Card>
          ) : (
            <>
              <EmployerAnalytics
                rehireData={rehireData}
                trustScores={trustScores}
                userRole={userRole}
                planTier={planTier}
              />
              {/* Export button for Pro/Enterprise */}
              {(planTier === 'pro' || planTier === 'enterprise') && (
                <div className="mt-6 flex gap-4">
                  <ExportDataButton
                    endpoint="/api/employer/analytics/export?type=rehire"
                    filename="rehire-data.csv"
                    label="Export Rehire Data"
                  />
                  <ExportDataButton
                    endpoint="/api/employer/analytics/export?type=trust-scores"
                    filename="trust-scores.csv"
                    label="Export Trust Scores"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
