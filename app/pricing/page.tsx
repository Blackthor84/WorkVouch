import React from 'react'
import Link from 'next/link'
import { NavbarServer } from '@/components/navbar-server'
import { CheckIcon } from '@heroicons/react/24/solid'

// Mark as dynamic to prevent build-time prerendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function PricingPage() {
  return (
    <>
      <NavbarServer />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 text-grey-dark dark:text-gray-200">
            WorkVouch Employer Plans
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
            Choose a plan that fits your hiring needs
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow p-8 flex flex-col border border-grey-background dark:border-[#374151]">
              <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">Basic Employer</h2>
              <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">Free</p>
              <ul className="text-left text-gray-700 dark:text-gray-300 space-y-3 flex-1 mb-6">
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Search workers by name</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>View public profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Submit basic verifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>10 verifications/month</span>
                </li>
              </ul>
              <Link 
                href="/dashboard" 
                className="mt-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white py-3 rounded-xl font-semibold transition-colors text-center block"
              >
                Continue
              </Link>
            </div>
            
            {/* Professional Plan */}
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow-lg border-4 border-blue-500 dark:border-blue-400 p-8 flex flex-col scale-105 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Popular
              </div>
              <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">Professional Employer</h2>
              <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">
                $49<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span>
              </p>
              <ul className="text-left text-gray-700 dark:text-gray-300 space-y-3 flex-1 mb-6">
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Unlimited verifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Rehire status unlock</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Trust score visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Worker analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Company badge</span>
                </li>
              </ul>
              <Link 
                href="/upgrade?plan=pro" 
                className="mt-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-3 rounded-xl font-semibold transition-colors text-center block"
              >
                Upgrade
              </Link>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-[#1A1F2B] rounded-2xl shadow p-8 flex flex-col border border-grey-background dark:border-[#374151]">
              <h2 className="text-2xl font-semibold mb-4 text-grey-dark dark:text-gray-200">Enterprise</h2>
              <p className="text-4xl font-bold mb-4 text-grey-dark dark:text-gray-200">
                $199<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span>
              </p>
              <ul className="text-left text-gray-700 dark:text-gray-300 space-y-3 flex-1 mb-6">
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Bulk verification tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Admin dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Exportable trust reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span>API access + priority support</span>
                </li>
              </ul>
              <Link 
                href="/upgrade?plan=enterprise" 
                className="mt-6 bg-black hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-colors text-center block"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
