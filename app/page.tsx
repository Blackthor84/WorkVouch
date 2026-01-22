import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import HeroSection from "@/components/HeroSection";
import Image from "next/image";

// Ensure this page is statically generated and doesn't require env vars
export const dynamic = "force-static";
export const revalidate = false;

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center relative w-full flex flex-col items-center">
          {/* Hero Logo - 1 inch from navbar (py-4 = 1rem = ~1 inch) */}
          <div className="flex justify-center py-4">
            <Image
              src="/logo.png"
              alt="WorkVouch Logo"
              width={672}
              height={192}
              className="h-48 w-auto object-contain mix-blend-multiply dark:mix-blend-screen drop-shadow-md"
              priority
              unoptimized
            />
          </div>

          {/* Hero Section Component */}
          <HeroSection />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
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
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Verified References
              </h3>
              <p className="text-gray-600">
                Get verified by real coworkers who can vouch for your work
                experience and skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Build Your Profile</h3>
              <p className="text-gray-600">
                Showcase your work history, skills, and achievements in one
                professional profile.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust Score</h3>
              <p className="text-gray-600">
                Build credibility with a trust score based on verified
                references and work history.
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white mt-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-6 opacity-90">
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
          <div className="flex flex-wrap justify-center gap-6 text-gray-600 mt-12">
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
      </div>
    </div>
  );
}
