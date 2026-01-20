import { getPublishedJobPostings } from '@/lib/actions/employer/job-postings'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BriefcaseIcon, MapPinIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default async function JobsPage() {
  let postings = []
  try {
    postings = await getPublishedJobPostings()
  } catch (error) {
    console.error('Failed to load job postings:', error)
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Job Opportunities
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Browse verified job postings from employers in law enforcement, security, hospitality, retail, and warehousing
          </p>
        </div>

        {postings.length === 0 ? (
          <Card className="p-12 text-center">
            <BriefcaseIcon className="h-12 w-12 text-grey-medium dark:text-gray-400 mx-auto mb-4" />
            <p className="text-grey-medium dark:text-gray-400">
              No job postings available at this time.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {postings.map((posting: any) => (
              <Card key={posting.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-grey-dark dark:text-gray-200 flex-1">
                    {posting.title}
                  </h3>
                  {posting.is_boosted && (
                    <Badge variant="info">Featured</Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-grey-medium dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4" />
                    {posting.location}
                  </div>
                  {posting.pay_range_min && posting.pay_range_max && (
                    <div className="flex items-center gap-2 text-sm text-grey-medium dark:text-gray-400">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      ${posting.pay_range_min} - ${posting.pay_range_max}
                    </div>
                  )}
                  {posting.shift && (
                    <div className="flex items-center gap-2 text-sm text-grey-medium dark:text-gray-400">
                      <ClockIcon className="h-4 w-4" />
                      {posting.shift}
                    </div>
                  )}
                  {posting.industry && (
                    <Badge variant="default" className="mt-2">
                      {posting.industry.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-grey-dark dark:text-gray-200 line-clamp-3 mb-4">
                  {posting.description}
                </p>
                
                <Button
                  variant="secondary"
                  href={`/jobs/${posting.id}`}
                  className="w-full"
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
