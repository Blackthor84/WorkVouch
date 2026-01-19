'use client'

import { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Purchase {
  id: string
  candidate_id: string
  status: string
  purchased_at: string | null
  amount_paid: number
  candidate: {
    id: string
    full_name: string
    email: string
    city: string | null
    state: string | null
  }
}

export function EmployerDashboard({ purchases }: { purchases: Purchase[] }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Search Candidates
          </h2>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
            Find and verify candidate profiles with our comprehensive search tool.
          </p>
          <Button href="/employer/search" className="w-full">
            Start Searching
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Purchased Reports
          </h2>
          <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
            You have {purchases.filter(p => p.status === 'completed').length} completed purchase{purchases.filter(p => p.status === 'completed').length !== 1 ? 's' : ''}.
          </p>
          <Button variant="secondary" href="/employer/purchases" className="w-full">
            View All Purchases
          </Button>
        </Card>
      </div>

      {purchases.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
            Recent Purchases
          </h2>
          <div className="space-y-3">
            {purchases.slice(0, 5).map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-4 border border-grey-background dark:border-[#374151] rounded-xl"
              >
                <div>
                  <h3 className="font-semibold text-grey-dark dark:text-gray-200">
                    {purchase.candidate.full_name}
                  </h3>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    {purchase.candidate.email}
                    {purchase.candidate.city && purchase.candidate.state && (
                      <> • {purchase.candidate.city}, {purchase.candidate.state}</>
                    )}
                  </p>
                  {purchase.purchased_at && (
                    <p className="text-xs text-grey-light dark:text-gray-500 mt-1">
                      Purchased {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    purchase.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : purchase.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                    {purchase.status}
                  </span>
                  {purchase.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`/employer/reports/${purchase.candidate_id}`}
                    >
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
