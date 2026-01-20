import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import {
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline'

export default function FeaturesPage() {
  const features = [
    {
      icon: CheckCircleIcon,
      title: 'Peer-Verified References',
      description: 'No fake references. Every job on your profile is verified by people who actually worked with you. Build trust with employers through authentic peer verification.',
    },
    {
      icon: ChartBarIcon,
      title: 'Trust Score System',
      description: 'A 0-100 score that shows how verified and trustworthy your career profile is. Built from verified jobs, peer references, and reference quality. Employers trust it.',
    },
    {
      icon: ClockIcon,
      title: 'Instant Employer Verification',
      description: 'Employers can instantly verify your work history, see your peer references, and check your Trust Score. No more waiting weeks for background checks.',
    },
    {
      icon: LockClosedIcon,
      title: 'Secure Storage',
      description: 'Your career profile is stored securely with enterprise-grade encryption. You control who sees what. Your privacy is our priority.',
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Industry-Specific',
      description: 'Tailored for law enforcement, security, hospitality, retail, and warehousing. Industry-specific fields, certifications, and verification processes designed for your field.',
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile-Ready',
      description: 'Manage your profile, request references, and check your Trust Score from your phone. Full mobile app coming soon.',
    },
  ]

  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-grey-dark dark:text-gray-200 mb-4">
              WorkVouch Features
            </h1>
            <p className="text-lg text-grey-medium dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to build a verified, trustworthy career profile that employers trust
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="p-8">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-3">
                    {feature.title}
                  </h2>
                  <p className="text-grey-medium dark:text-gray-400">
                    {feature.description}
                  </p>
                </Card>
              )
            })}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Start building your verified career profile today. It's free to get started.
            </p>
            <a
              href="/auth/signup"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
