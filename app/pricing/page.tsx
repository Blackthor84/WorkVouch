import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { PricingSection } from '@/components/pricing-section'

export default async function PricingPage() {
  const user = await getCurrentUser()

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-grey-medium dark:text-gray-400 max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade or downgrade at any time.
          </p>
        </div>
        <PricingSection currentUserId={user?.id} />
      </main>
    </>
  )
}
