'use client'

import { JobPosting } from '@/lib/actions/employer/job-postings'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { EyeIcon, EyeSlashIcon, RocketLaunchIcon, PencilIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface JobPostingListProps {
  postings: JobPosting[]
  onTogglePublish: (id: string, currentStatus: boolean) => void
  onBoost: (id: string) => void
  onEdit: (posting: JobPosting) => void
}

export function JobPostingList({ postings, onTogglePublish, onBoost, onEdit }: JobPostingListProps) {
  if (postings.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-grey-medium dark:text-gray-400 mb-4">
          No job postings yet. Create your first one!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {postings.map((posting) => (
        <Card key={posting.id} className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                  {posting.title}
                </h3>
                {posting.is_published && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-xs font-semibold">
                    Published
                  </span>
                )}
                {posting.is_boosted && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs font-semibold flex items-center gap-1">
                    <RocketLaunchIcon className="h-3 w-3" />
                    Boosted
                  </span>
                )}
              </div>
              <p className="text-sm text-grey-medium dark:text-gray-400 mb-2">
                {posting.location} {posting.industry && `• ${posting.industry.replace('_', ' ')}`}
              </p>
              <p className="text-grey-dark dark:text-gray-200 line-clamp-2">
                {posting.description}
              </p>
              {posting.pay_range_min && posting.pay_range_max && (
                <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mt-2">
                  ${posting.pay_range_min} - ${posting.pay_range_max}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onTogglePublish(posting.id, posting.is_published)}
              >
                {posting.is_published ? (
                  <>
                    <EyeSlashIcon className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBoost(posting.id)}
                disabled={posting.is_boosted}
              >
                <RocketLaunchIcon className="h-4 w-4 mr-2" />
                Boost
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(posting)}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                href={`/jobs/${posting.id}`}
              >
                View
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
