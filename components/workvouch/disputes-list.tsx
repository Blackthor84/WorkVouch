'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateLong } from '@/lib/utils/date'
import { useRouter } from 'next/navigation'

interface Dispute {
  id: string
  employerAccount: {
    id: string
    companyName: string
    email: string
  }
  jobHistory: {
    id: string
    userId: string
    employerName: string
    jobTitle: string
    user: {
      id: string
      name: string
      email: string
    }
    documents: Array<{
      id: string
      documentType: string
      fileName: string
      fileUrl: string
      createdAt: string
    }>
  }
  disputeReason: string
  status: string
  createdAt: string
}

export function DisputesList() {
  const router = useRouter()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const url = filter === 'all' 
        ? '/api/admin/disputes'
        : `/api/admin/disputes?status=${filter}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch disputes')
      }

      setDisputes(data.disputes || [])
    } catch (error) {
      console.error('Error fetching disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (disputeId: string, resolution: 'resolved' | 'rejected', verificationStatus: 'verified' | 'unverified') => {
    if (!confirm(`Are you sure you want to ${resolution === 'resolved' ? 'resolve' : 'reject'} this dispute?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/resolve-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          resolution,
          verificationStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to resolve dispute')
      }

      router.refresh()
      fetchDisputes()
    } catch (error) {
      alert('Failed to resolve dispute')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { variant: 'warning' as const, label: 'Open' },
      waiting_employee: { variant: 'info' as const, label: 'Waiting for Employee' },
      awaiting_review: { variant: 'warning' as const, label: 'Awaiting Review' },
      resolved: { variant: 'success' as const, label: 'Resolved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
    }

    const config = variants[status] || { variant: 'secondary' as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return <Card className="p-8 text-center">Loading disputes...</Card>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'open' ? 'primary' : 'secondary'}
          onClick={() => setFilter('open')}
          size="sm"
        >
          Open
        </Button>
        <Button
          variant={filter === 'awaiting_review' ? 'primary' : 'secondary'}
          onClick={() => setFilter('awaiting_review')}
          size="sm"
        >
          Awaiting Review
        </Button>
      </div>

      {disputes.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-grey-medium dark:text-gray-400">No disputes found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                      Dispute from {dispute.employerAccount.companyName}
                    </h3>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                    <strong>Employee:</strong> {dispute.jobHistory.user.name} ({dispute.jobHistory.user.email})
                  </p>
                  <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                    <strong>Job:</strong> {dispute.jobHistory.jobTitle} at {dispute.jobHistory.employerName}
                  </p>
                  <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                    <strong>Reason:</strong> {dispute.disputeReason}
                  </p>
                  <p className="text-xs text-grey-medium dark:text-gray-400">
                    Filed: {formatDateLong(dispute.createdAt)}
                  </p>
                  {dispute.jobHistory.documents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">
                        Documents ({dispute.jobHistory.documents.length})
                      </p>
                      <div className="space-y-1">
                        {dispute.jobHistory.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline block"
                          >
                            {doc.documentType}: {doc.fileName}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {dispute.status === 'awaiting_review' && (
                <div className="flex gap-3 pt-4 border-t border-grey-background dark:border-[#374151]">
                  <Button
                    variant="info"
                    onClick={() => handleResolve(dispute.id, 'resolved', 'verified')}
                  >
                    Approve (Mark Verified)
                  </Button>
                  <Button
                    variant="info"
                    onClick={() => handleResolve(dispute.id, 'rejected', 'unverified')}
                  >
                    Reject (Mark Unverified)
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
