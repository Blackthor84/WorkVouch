import { Navbar } from '@/components/navbar'
import { HealthcareSearchClient } from './healthcare-search-client'

export default function HealthcareSearchPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-6">
            Search Healthcare Candidates
          </h1>
          <HealthcareSearchClient />
        </div>
      </main>
    </>
  )
}
