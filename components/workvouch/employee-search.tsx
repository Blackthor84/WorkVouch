'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MagnifyingGlassIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { formatDateShort } from '@/lib/utils/date'

interface Employee {
  userId: string
  jobId: string // Add job ID for verification/dispute actions
  name: string
  email: string
  industry: string | null
  jobTitle: string
  startDate: string
  endDate: string | null
  verificationStatus: string
  isVisibleToEmployer: boolean
  references: Array<{
    id: string
    fromUserName: string | null
    rating: number
    message: string | null
  }>
}

export function EmployeeSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setEmployees([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/employer/search-employees?name=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search employees')
      }

      setEmployees(data.employees || [])
    } catch (err: any) {
      setError(err.message)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircleIcon className="h-4 w-4" />
            Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            Pending
          </Badge>
        )
      case 'disputed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4" />
            Disputed
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unverified</Badge>
    }
  }

  const handleRequestVerification = async (jobId: string) => {
    try {
      const response = await fetch('/api/employer/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobHistoryId: jobId }),
      })

      if (!response.ok) {
        throw new Error('Failed to request verification')
      }

      alert('Verification requested successfully')
      handleSearch() // Refresh results
    } catch (err: any) {
      alert('Failed to request verification: ' + err.message)
    }
  }

  const handleFileDispute = async (jobId: string) => {
    const reason = prompt('Please provide a reason for disputing this job history:')
    if (!reason || reason.length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)')
      return
    }

    try {
      const response = await fetch('/api/employer/file-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobHistoryId: jobId,
          disputeReason: reason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to file dispute')
      }

      alert('Dispute filed successfully')
      handleSearch() // Refresh results
    } catch (err: any) {
      alert('Failed to file dispute: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      {employees.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-grey-medium dark:text-gray-400">
            Found {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </p>
          {employees.map((employee, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                      {employee.name}
                    </h3>
                    {getStatusBadge(employee.verificationStatus)}
                  </div>
                  <p className="text-grey-medium dark:text-gray-400 mb-2">{employee.email}</p>
                  <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                    <strong>Position:</strong> {employee.jobTitle}
                  </p>
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    {formatDateShort(employee.startDate)} -{' '}
                    {employee.endDate ? formatDateShort(employee.endDate) : 'Present'}
                  </p>
                  {employee.references.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">
                        References ({employee.references.length})
                      </p>
                      <div className="space-y-1">
                        {employee.references.map((ref) => (
                          <div key={ref.id} className="text-sm text-grey-medium dark:text-gray-400">
                            {ref.fromUserName}: {ref.rating}/5 stars
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-grey-background dark:border-[#374151]">
                <Button
                  variant="outline"
                  onClick={() => handleRequestVerification(employee.jobId)}
                >
                  Request Verification
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFileDispute(employee.jobId)}
                >
                  File Dispute
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && searchQuery.length >= 2 && employees.length === 0 && !error && (
        <Card className="p-8 text-center">
          <p className="text-grey-medium dark:text-gray-400">
            No employees found matching "{searchQuery}"
          </p>
        </Card>
      )}
    </div>
  )
}
