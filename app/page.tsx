import Link from 'next/link'
import { NavbarServer } from '@/components/navbar-server'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/logo'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0D1117]">
      <NavbarServer />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 dark:from-blue-500 dark:via-blue-600 dark:to-[#1E40AF] pt-20 pb-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex justify-center mb-2">
              <Logo size="hero" showText={false} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Your Work. Verified by the People Who Worked With You.
            </h1>
            <p className="mt-6 text-lg leading-8 text-blue-100 sm:text-xl">
              WorkVouch helps you prove your experience using real coworker references — fast, simple, and trusted. Perfect for law enforcement, security, hospitality, retail, and warehousing professionals who want better jobs without the hassle.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" href="/auth/signup" className="bg-white text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-700">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Benefits */}
      <section className="border-b border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <CheckBadgeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Verified work history
              </h3>
            </div>
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Coworker references you control
              </h3>
            </div>
            <div className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-4">
                <StarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
                Stand out when applying for jobs
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 sm:py-32 bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-grey-dark dark:text-gray-200 sm:text-5xl">
              Why WorkVouch?
            </h2>
            <p className="mt-4 text-lg leading-8 text-grey-dark dark:text-gray-200 font-semibold">
              Build credibility through verified peer references from real coworkers
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <Card hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                  <ShieldCheckIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-grey-dark dark:text-gray-200">Verified Trust</h3>
              </div>
              <p className="text-grey-dark dark:text-gray-200 leading-relaxed font-medium">
                Every reference is verified from real coworkers. Build a trust score that employers can rely on.
              </p>
            </Card>
            <Card hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                  <UserGroupIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-grey-dark dark:text-gray-200">Professional Network</h3>
              </div>
              <p className="text-grey-dark dark:text-gray-200 leading-relaxed font-medium">
                Connect with coworkers, discover mutual connections, and build your professional reputation.
              </p>
            </Card>
            <Card hover>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                  <ChartBarIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-grey-dark dark:text-gray-200">Trust Score</h3>
              </div>
              <p className="text-grey-dark dark:text-gray-200 leading-relaxed font-medium">
                Your professional credibility in one number. See how references and connections impact your score.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Score Explanation */}
      <section className="bg-white dark:bg-[#111827] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-grey-dark dark:text-gray-200">
                  Your Trust Score
                </h2>
            <p className="mt-6 text-lg leading-8 text-grey-dark dark:text-gray-200 font-semibold">
              Your Trust Score is calculated based on verified references from coworkers, 
              your connection network, and professional history. It's your professional 
              credibility in one number.
            </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckBadgeIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-grey-dark dark:text-gray-200">Verified References</h4>
                      <p className="text-sm text-grey-dark dark:text-gray-200 font-medium">Each reference from a coworker adds to your score</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckBadgeIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-grey-dark dark:text-gray-200">Connection Network</h4>
                      <p className="text-sm text-grey-dark dark:text-gray-200 font-medium">Strong professional connections boost credibility</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckBadgeIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-grey-dark dark:text-gray-200">Job History</h4>
                      <p className="text-sm text-grey-dark dark:text-gray-200 font-medium">Complete professional history adds depth</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-64 w-64">
                  <div className="absolute inset-0 rounded-full border-8 border-grey-background"></div>
                  <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin-slow"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">850</div>
                      <div className="text-sm text-grey-dark dark:text-gray-200 font-semibold mt-2">Trust Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to prove your experience?
            </h2>
            <p className="mt-4 text-lg leading-8 text-blue-100">
              Join professionals in law enforcement, security, hospitality, retail, and warehousing who use WorkVouch to stand out.
            </p>
            <div className="mt-10">
              <Button size="lg" href="/auth/signup" className="bg-white text-blue-700 hover:bg-blue-50 dark:bg-white dark:text-blue-700">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#111827] border-t border-grey-background dark:border-[#374151]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200">Product</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/features" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/about" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">About</Link></li>
                <li><Link href="/contact" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200">Support</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/help" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Help Center</Link></li>
                <li><Link href="/privacy" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><Link href="/terms" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Terms</Link></li>
                <li><Link href="/security" className="text-sm text-grey-dark dark:text-gray-200 font-medium hover:text-primary">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-grey-background pt-8 text-center">
            <p className="text-sm text-grey-dark dark:text-gray-200 font-medium">
              © 2024 WorkVouch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}


