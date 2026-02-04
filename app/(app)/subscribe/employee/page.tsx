"use client";

import Link from "next/link";
import { planFeatures } from "@/lib/stripePlans";

export default function EmployeeSubscribe() {
  const freePlan = planFeatures.workerFree;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
          WorkVouch for Workers
        </h1>
        <p className="text-3xl font-semibold text-green-600 dark:text-green-400 mb-2">
          Always Free. Forever.
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Build your verified work history, connect with coworkers, and stand out to employers—all completely free.
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl p-8 mb-8 border-2 border-green-200 dark:border-green-800">
        <div className="text-center mb-8">
          <div className="inline-block bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full mb-4">
            <span className="text-2xl font-bold text-green-700 dark:text-green-300">$0</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">/month</span>
          </div>
          <h2 className="text-2xl font-semibold mb-4">Free Worker Plan</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              What You Get
            </h3>
            <ul className="space-y-3">
              {freePlan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Why WorkVouch?
            </h3>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Verified work history that employers trust</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Peer references from real coworkers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Trust score based on verified experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Stand out in job applications</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Connect with coworkers from past jobs</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <Link href="/signup">
            <button className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 font-semibold text-lg shadow-lg">
              Sign Up Free
            </button>
          </Link>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            No credit card required. No hidden fees. No limits.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Is WorkVouch really free for workers?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Yes! WorkVouch is completely free for workers. You can create your profile, add job history, get verified, and connect with coworkers—all at no cost.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Will I ever be charged?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              No. Workers never pay for WorkVouch. Only employers pay for premium features like searching workers and viewing detailed reports.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              What if I&apos;m also an employer?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              If you&apos;re an employer looking to hire, you&apos;ll need a paid plan. But your worker profile remains free forever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
