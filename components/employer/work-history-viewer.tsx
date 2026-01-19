'use client'

import { Card } from '../ui/card'
import { CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface WorkHistoryViewerProps {
  jobs: any[]
}

export function WorkHistoryViewer({ jobs }: WorkHistoryViewerProps) {
  if (jobs.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Work History
        </h2>
        <p className="text-grey-medium dark:text-gray-400">
          No work history available.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Verified Work History
      </h2>
      <div className="space-y-4">
        {jobs.map((job) => {
          const hasMatches = job.coworker_matches && job.coworker_matches.length > 0
          const isVerified = hasMatches

          return (
            <div
              key={job.id}
              className="p-4 border border-grey-background dark:border-[#374151] rounded-xl"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                    {job.job_title}
                  </h3>
                  <p className="text-grey-medium dark:text-gray-400">
                    {job.company_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <>
                      <CheckBadgeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                        Unverified
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-sm text-grey-medium dark:text-gray-400">
                {new Date(job.start_date).toLocaleDateString()} -{' '}
                {job.end_date ? new Date(job.end_date).toLocaleDateString() : 'Present'}
              </div>
              {hasMatches && (
                <div className="mt-2 text-sm text-grey-medium dark:text-gray-400">
                  Matched with {job.coworker_matches.length} coworker{job.coworker_matches.length !== 1 ? 's' : ''}
                </div>
              )}
              {job.description && (
                <p className="mt-2 text-sm text-grey-dark dark:text-gray-200">
                  {job.description}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
