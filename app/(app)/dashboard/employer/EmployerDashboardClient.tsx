"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

/**
 * Employer Dashboard
 * 
 * Clean, organized dashboard with clear sections:
 * - Usage tracking
 * - Quick actions
 * - Pro features (if applicable)
 * - Security Bundle features (if applicable)
 */
export default function EmployerDashboard() {
  const sessionObj = useSession();
  const session = sessionObj?.data ?? null;
  const user = session?.user ?? null;
  const [employerAccount, setEmployerAccount] = useState<any>(null);
  const [searchUsage, setSearchUsage] = useState<any>(null);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const accountRes = await fetch("/api/employer/me");
        const accountData = await accountRes.json();
        setEmployerAccount(accountData.employer);

        if (accountData.employer) {
          const usageRes = await fetch("/api/employer/usage");
          if (usageRes.ok) {
            const usageData = await usageRes.json();
            setSearchUsage(usageData.searchUsage);
            setReportUsage(usageData.reportUsage);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A73E8]"></div>
      </div>
    );
  }

  const planTier = employerAccount?.planTier || "free";
  const isPro = planTier === "pro";
  const isTeam = planTier === "team" || isPro;
  const isSecurityBundle = planTier === "security-bundle";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employer Dashboard
          </h1>
          <p className="text-gray-600 mb-4">
            Search workers, track hires, and manage your team
          </p>
          {planTier && planTier !== "free" && (
            <span className="inline-block px-3 py-1 bg-[#1A73E8] text-white rounded-full text-sm font-semibold">
              {planTier.charAt(0).toUpperCase() + planTier.slice(1).replace("-", " ")} Plan
            </span>
          )}
        </div>

        {/* Usage Cards - Only show if user has subscription */}
        {planTier !== "free" && searchUsage && reportUsage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Profile Searches
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {searchUsage.currentMonth}
                </span>
                <span className="text-sm text-gray-500">
                  / {searchUsage.limit === Infinity ? "∞" : searchUsage.limit}
                </span>
              </div>
              {searchUsage.limit !== Infinity && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#1A73E8] h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (searchUsage.currentMonth / searchUsage.limit) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Resets on {new Date(searchUsage.resetDate).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Verification Reports
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  {reportUsage.currentMonth}
                </span>
                <span className="text-sm text-gray-500">
                  / {reportUsage.limit === Infinity ? "∞" : reportUsage.limit}
                </span>
              </div>
              {reportUsage.limit !== Infinity && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (reportUsage.currentMonth / reportUsage.limit) * 100,
                        100
                      )}%`,
                    }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Resets on {new Date(reportUsage.resetDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/dashboard/employer/search"
            className="bg-[#1A73E8] text-white rounded-lg p-6 hover:bg-blue-700 transition shadow-md hover:shadow-lg flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
          >
            <MagnifyingGlassIcon className="h-8 w-8 mb-2" aria-hidden="true" />
            <h3 className="font-semibold mb-1">Search Workers</h3>
            <p className="text-sm text-blue-100">
              Find and verify worker profiles
            </p>
          </Link>

          <Link
            href="/dashboard/employer/reports"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition shadow-md hover:shadow-lg flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            <DocumentTextIcon className="h-8 w-8 mb-2" aria-hidden="true" />
            <h3 className="font-semibold mb-1">Verification Reports</h3>
            <p className="text-sm text-green-100">
              Generate and export reports
            </p>
          </Link>

          <Link
            href="/dashboard/employer/analytics"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition shadow-md hover:shadow-lg flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            <ChartBarIcon className="h-8 w-8 mb-2" aria-hidden="true" />
            <h3 className="font-semibold mb-1">Analytics</h3>
            <p className="text-sm text-purple-100">
              View hiring insights
            </p>
          </Link>

          {isTeam ? (
            <Link
              href="/dashboard/employer/hires"
              className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition shadow-md hover:shadow-lg flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2"
            >
              <UserGroupIcon className="h-8 w-8 mb-2" aria-hidden="true" />
              <h3 className="font-semibold mb-1">Track New Hires</h3>
              <p className="text-sm text-orange-100">
                Monitor your hiring pipeline
              </p>
            </Link>
          ) : (
            <Link
              href="/dashboard/employer/settings"
              className="bg-gray-600 text-white rounded-lg p-6 hover:bg-gray-700 transition shadow-md hover:shadow-lg flex flex-col items-center text-center focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
            >
              <Cog6ToothIcon className="h-8 w-8 mb-2" aria-hidden="true" />
              <h3 className="font-semibold mb-1">Settings</h3>
              <p className="text-sm text-gray-100">
                Manage your account
              </p>
            </Link>
          )}
        </div>

        {/* Pro Features Section */}
        {isPro && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Pro Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/employer/bulk-import"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
              >
                <h3 className="font-semibold mb-2 text-gray-900">Bulk Import</h3>
                <p className="text-sm text-gray-600">
                  Upload CSV to import multiple workers
                </p>
              </Link>

              <Link
                href="/dashboard/employer/subaccounts"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
              >
                <h3 className="font-semibold mb-2 text-gray-900">Subaccounts</h3>
                <p className="text-sm text-gray-600">
                  Manage department subaccounts
                </p>
              </Link>

              <Link
                href="/dashboard/employer/comparison"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
              >
                <h3 className="font-semibold mb-2 text-gray-900">Applicant Comparison</h3>
                <p className="text-sm text-gray-600">
                  Compare multiple candidates
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Security Bundle Features */}
        {isSecurityBundle && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Security Bundle Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/employer/licenses"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
              >
                <h3 className="font-semibold mb-2 text-gray-900">License Management</h3>
                <p className="text-sm text-gray-600">
                  Upload and verify guard licenses
                </p>
              </Link>

              <Link
                href="/dashboard/employer/availability"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
              >
                <h3 className="font-semibold mb-2 text-gray-900">Guard Availability</h3>
                <p className="text-sm text-gray-600">
                  Manage shift preferences and availability
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Billing & Settings Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/pricing?userType=employer"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
          >
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-[#1A73E8] mr-4" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-gray-900">Billing & Subscription</h3>
                <p className="text-sm text-gray-600">Manage your plan and payment</p>
              </div>
            </div>
            <span className="text-[#1A73E8]">→</span>
          </Link>

          <Link
            href="/dashboard/employer/settings"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:ring-offset-2"
          >
            <div className="flex items-center">
              <Cog6ToothIcon className="h-8 w-8 text-[#1A73E8] mr-4" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-gray-900">Profile & Settings</h3>
                <p className="text-sm text-gray-600">Update your company information</p>
              </div>
            </div>
            <span className="text-[#1A73E8]">→</span>
          </Link>
        </div>

        {/* Upgrade Prompt for Free Users */}
        {planTier === "free" && (
          <div className="bg-gradient-to-r from-[#1A73E8] to-blue-600 rounded-lg p-8 text-white text-center">
            <h3 className="text-2xl font-semibold mb-2">
              Unlock Full Features
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Choose a plan to start searching workers and generating verification reports.
            </p>
            <Link
              href="/pricing?userType=employer"
              className="inline-block bg-white text-[#1A73E8] font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#1A73E8]"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
