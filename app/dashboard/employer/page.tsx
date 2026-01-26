"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getSearchUsage, getReportUsage } from "@/lib/limits/search-limit";
import { getReportUsage as getReportUsageData } from "@/lib/limits/report-limit";

/**
 * Employer Dashboard
 * 
 * Features:
 * - Search workers
 * - Track new hires
 * - See analytics
 * - Export reports
 * - Usage tracking (searches/reports)
 * - CSV upload (Pro only)
 * - Subaccount management (Pro only)
 */
export default function EmployerDashboard() {
  const session = useSession();
  const user = session?.data?.user || null;
  const [employerAccount, setEmployerAccount] = useState<any>(null);
  const [searchUsage, setSearchUsage] = useState<any>(null);
  const [reportUsage, setReportUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // Fetch employer account
        const accountRes = await fetch("/api/employer/me");
        const accountData = await accountRes.json();
        setEmployerAccount(accountData.employer);

        if (accountData.employer) {
          // Fetch usage data
          const searchData = await getSearchUsage(
            accountData.employer.id,
            accountData.employer.planTier || "free"
          );
          setSearchUsage(searchData);

          const reportData = await getReportUsageData(
            accountData.employer.id,
            accountData.employer.planTier || "free"
          );
          setReportUsage(reportData);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const planTier = employerAccount?.planTier || "free";
  const isPro = planTier === "pro";
  const isTeam = planTier === "team" || isPro;
  const isSecurityBundle = planTier === "security-bundle";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Employer Dashboard
          </h1>
          <p className="text-gray-600">
            Search workers, track hires, and manage your team
          </p>
          {planTier && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan
            </span>
          )}
        </div>

        {/* Usage Cards */}
        {searchUsage && reportUsage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Search Usage */}
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
                    className="bg-blue-600 h-2 rounded-full"
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

            {/* Report Usage */}
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
                    className="bg-green-600 h-2 rounded-full"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/dashboard/employer/search"
            className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition text-center"
          >
            <h3 className="font-semibold mb-2">Search Workers</h3>
            <p className="text-sm text-blue-100">
              Find and verify worker profiles
            </p>
          </Link>

          <Link
            href="/dashboard/employer/reports"
            className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition text-center"
          >
            <h3 className="font-semibold mb-2">Verification Reports</h3>
            <p className="text-sm text-green-100">
              Generate and export reports
            </p>
          </Link>

          <Link
            href="/dashboard/employer/analytics"
            className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition text-center"
          >
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-purple-100">
              View hiring insights
            </p>
          </Link>

          {isTeam && (
            <Link
              href="/dashboard/employer/hires"
              className="bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition text-center"
            >
              <h3 className="font-semibold mb-2">Track New Hires</h3>
              <p className="text-sm text-orange-100">
                Monitor your hiring pipeline
              </p>
            </Link>
          )}
        </div>

        {/* Pro Features */}
        {isPro && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Pro Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/employer/bulk-import"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-2">Bulk Import</h3>
                <p className="text-sm text-gray-600">
                  Upload CSV to import multiple workers
                </p>
              </Link>

              <Link
                href="/dashboard/employer/subaccounts"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-2">Subaccounts</h3>
                <p className="text-sm text-gray-600">
                  Manage department subaccounts
                </p>
              </Link>

              <Link
                href="/dashboard/employer/comparison"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-2">Applicant Comparison</h3>
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
            <h2 className="text-xl font-semibold mb-4">Security Bundle Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/employer/licenses"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-2">License Management</h3>
                <p className="text-sm text-gray-600">
                  Upload and verify guard licenses
                </p>
              </Link>

              <Link
                href="/dashboard/employer/availability"
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-2">Guard Availability</h3>
                <p className="text-sm text-gray-600">
                  Manage shift preferences and availability
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Upgrade Prompt for Free Users */}
        {planTier === "free" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              Upgrade to Unlock Features
            </h3>
            <p className="text-yellow-700 mb-4">
              Choose a plan to start searching workers and generating verification reports.
            </p>
            <Link
              href="/pricing?userType=employer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
