'use client'

import { useState, useEffect } from 'react'
import { searchUsers, getPublicProfile } from '@/lib/actions/employer'
import { hasPurchasedReport } from '@/lib/actions/employer-purchases'
import Link from 'next/link'
import { Button } from './ui/button'

interface Profile {
  id: string
  full_name: string
  email: string
  city: string | null
  state: string | null
  professional_summary: string | null
  profile_photo_url: string | null
}

export function EmployerSearchForm() {
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [results, setResults] = useState<Profile[]>([])
  const [purchaseStatus, setPurchaseStatus] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState({
    name: '',
    city: '',
    state: '',
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const users = await searchUsers(searchQuery)
      setResults(users)
      
      // Check purchase status for all results
      const statuses: Record<string, boolean> = {}
      for (const user of users) {
        try {
          statuses[user.id] = await hasPurchasedReport(user.id)
        } catch {
          statuses[user.id] = false
        }
      }
      setPurchaseStatus(statuses)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (candidateId: string) => {
    setPurchasing(candidateId)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Failed to create checkout session')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to initiate purchase')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
                Name
              </label>
              <input
                type="text"
                value={searchQuery.name}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, name: e.target.value })
                }
                className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
                placeholder="Search by name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
                City
              </label>
              <input
                type="text"
                value={searchQuery.city}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, city: e.target.value })
                }
                className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
                placeholder="Search by city..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200">
                State
              </label>
              <input
                type="text"
                value={searchQuery.state}
                onChange={(e) =>
                  setSearchQuery({ ...searchQuery, state: e.target.value })
                }
                className="mt-1 block w-full rounded-xl border border-grey-light dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 px-3 py-2"
                placeholder="Search by state..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 px-6 py-2.5 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
            Results ({results.length})
          </h2>
          {results.map((profile) => (
            <div
              key={profile.id}
              className="rounded-2xl bg-white dark:bg-[#1A1F2B] p-6 shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                    {profile.full_name}
                  </h3>
                  <p className="text-sm text-grey-medium dark:text-gray-400">{profile.email}</p>
                  {(profile.city || profile.state) && (
                    <p className="text-sm text-grey-medium dark:text-gray-400">
                      {[profile.city, profile.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {profile.professional_summary && (
                    <p className="mt-2 text-sm text-grey-dark dark:text-gray-200">
                      {profile.professional_summary}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    href={`/employer/profile/${profile.id}`}
                  >
                    View Profile
                  </Button>
                  {purchaseStatus[profile.id] ? (
                    <Button
                      size="sm"
                      href={`/employer/reports/${profile.id}`}
                    >
                      View Report
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(profile.id)}
                        disabled={purchasing === profile.id}
                      >
                        {purchasing === profile.id ? 'Processing...' : 'Purchase Report ($7.99)'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        href="/pricing"
                      >
                        Subscribe
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

