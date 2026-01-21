'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('')
  const [loadingPlan, setLoadingPlan] = useState(true)

  useEffect(() => {
    // Fetch current plan
    async function fetchPlan() {
      try {
        const response = await fetch('/api/employer/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentPlan(data.planTier || 'free')
        }
      } catch (error) {
        console.error('Failed to fetch plan:', error)
      } finally {
        setLoadingPlan(false)
      }
    }
    fetchPlan()
  }, [])

  async function handleUpgrade(plan: string) {
    setLoading(plan)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to start upgrade process')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117] p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-grey-dark dark:text-gray-200">
            Manage Subscription
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mb-8">
            Upgrade your plan to unlock premium features and unlimited verifications.
          </p>

          {loadingPlan ? (
            <Card className="p-8 text-center">
              <p className="text-grey-medium dark:text-gray-400">Loading...</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Professional Plan */}
              <Card className="p-8 relative">
                {currentPlan === 'pro' && (
                  <Badge variant="success" className="absolute top-4 right-4">
                    Current Plan
                  </Badge>
                )}
                <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
                  Professional
                </h2>
                <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">
                  $49<span className="text-lg text-grey-medium dark:text-gray-400">/mo</span>
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Unlimited verifications',
                    'Rehire status unlock',
                    'Trust score visibility',
                    'Worker analytics',
                    'Company badge',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-grey-dark dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading === 'pro' || currentPlan === 'pro'}
                  className="w-full"
                  variant={currentPlan === 'pro' ? 'secondary' : 'primary'}
                >
                  {loading === 'pro'
                    ? 'Processing...'
                    : currentPlan === 'pro'
                    ? 'Current Plan'
                    : 'Upgrade to Professional'}
                </Button>
              </Card>

              {/* Enterprise Plan */}
              <Card className="p-8 relative border-2 border-blue-500 dark:border-blue-400">
                {currentPlan === 'enterprise' && (
                  <Badge variant="success" className="absolute top-4 right-4">
                    Current Plan
                  </Badge>
                )}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="info" className="px-3 py-1">
                    Popular
                  </Badge>
                </div>
                <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
                  Enterprise
                </h2>
                <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">
                  $199<span className="text-lg text-grey-medium dark:text-gray-400">/mo</span>
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    'Everything in Pro',
                    'Bulk verification tools',
                    'Admin dashboard',
                    'Exportable trust reports',
                    'API access + priority support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-grey-dark dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={loading === 'enterprise' || currentPlan === 'enterprise'}
                  className="w-full"
                  variant={currentPlan === 'enterprise' ? 'secondary' : 'primary'}
                >
                  {loading === 'enterprise'
                    ? 'Processing...'
                    : currentPlan === 'enterprise'
                    ? 'Current Plan'
                    : 'Upgrade to Enterprise'}
                </Button>
              </Card>
            </div>
          )}

          <div className="mt-8">
            <Link href="/employer/dashboard">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
  )
}
