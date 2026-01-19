'use client'

import { useEffect, useState } from 'react'
import { getUserSubscription, getUserSubscriptionTier } from '@/lib/actions/subscriptions'
import { Card } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'

function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to open billing portal')
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to open billing portal')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={openPortal}
      disabled={loading}
      className="flex-1"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </Button>
  )
}

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<any>(null)
  const [tier, setTier] = useState<string>('starter')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const [sub, currentTier] = await Promise.all([
          getUserSubscription(),
          getUserSubscriptionTier(),
        ])
        setSubscription(sub)
        setTier(currentTier)
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">Loading subscription...</p>
      </Card>
    )
  }

  if (!subscription || tier === 'starter') {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
          Current Plan: Starter (Free)
        </h3>
        <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
          Upgrade to unlock premium features and unlimited access.
        </p>
        <Button href="/pricing">View Plans</Button>
      </Card>
    )
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-1">
            Current Plan: {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}
          </h3>
          <p className="text-sm text-grey-medium dark:text-gray-400">
            Status: <span className="font-semibold text-green-600 dark:text-green-400 capitalize">
              {subscription.status}
            </span>
          </p>
        </div>
        {subscription.cancel_at_period_end && (
          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-semibold">
            Cancels at period end
          </span>
        )}
      </div>
      
      <div className="space-y-2 text-sm mb-4">
        <div className="flex justify-between">
          <span className="text-grey-medium dark:text-gray-400">Current Period:</span>
          <span className="text-grey-dark dark:text-gray-200 font-medium">
            {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" href="/pricing" className="flex-1">
          Change Plan
        </Button>
        <ManageSubscriptionButton />
      </div>
    </Card>
  )
}
