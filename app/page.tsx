import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = 'force-static'
export const revalidate = false

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center">
            <div className="relative h-40 w-auto max-w-[560px]">
              <Image
                src="/logo.png"
                alt="WorkVouch Logo"
                width={560}
                height={160}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/pricing"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            Pricing
          </Link>
          <Link
            href="/auth/signin"
            className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            Sign Up
          </Link>
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-4">
          <Link
            href="/auth/signin"
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-[192px] pb-0">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Hero Logo - 8x bigger, 2 inches below navbar, 1 inch above text */}
          <div className="flex justify-center mb-[96px]">
            <div className="relative h-[1152px] w-auto max-w-[16128px]">
              <Image
                src="/logo.png"
                alt="WorkVouch Logo"
                width={16128}
                height={4608}
                className="h-full w-auto object-contain"
                priority
              />
            </div>
          </div>
          
          {/* Main Heading - 1 inch below hero logo */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient relative z-10">
            Verify Your Work History
            <br />
            Build Trust with Employers
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with coworkers, get verified references, and showcase your professional
            credibility. Trusted by job seekers and employers worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/auth/signup"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View Pricing
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified References</h3>
              <p className="text-gray-600">
                Get verified by real coworkers who can vouch for your work experience and skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Your Profile</h3>
              <p className="text-gray-600">
                Showcase your work history, skills, and achievements in one professional profile.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust Score</h3>
              <p className="text-gray-600">
                Build credibility with a trust score based on verified references and work history.
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of professionals building verified career profiles.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              <span>Create Your Profile</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-16 flex flex-wrap justify-center gap-6 text-gray-600">
            <Link
              href="/dashboard"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/pricing"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Pricing
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/auth/signin"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              Login
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/about"
              className="hover:text-blue-600 transition-colors font-medium"
            >
              About
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              © {new Date().getFullYear()} WorkVouch. All rights reserved.
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-blue-600 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
