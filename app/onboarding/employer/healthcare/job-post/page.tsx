import { NavbarServer } from '@/components/navbar-server'
import { JobPostClient } from './job-post-client'

export default function HealthcareJobPosting() {
  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <JobPostClient />
        </div>
      </main>
    </>
  )
}
