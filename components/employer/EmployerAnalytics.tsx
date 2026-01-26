"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import UpgradeModal from "@/components/UpgradeModal";
import { useState } from "react";

interface RehireData {
  workerEmail: string;
  rehireCount: number;
  lastHired: string;
}

interface TrustScore {
  workerEmail: string;
  score: number;
}

interface EmployerAnalyticsProps {
  rehireData: RehireData[];
  trustScores: TrustScore[];
  userRole: string;
  planTier?: string;
}

export default function EmployerAnalytics({
  rehireData,
  trustScores,
  userRole,
  planTier,
}: EmployerAnalyticsProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user has access (Pro plan or higher)
  const isBasicPlan =
    planTier === "free" ||
    planTier === "basic" ||
    planTier === "starter" ||
    planTier === "team" ||
    !planTier ||
    userRole === "employer_basic";

  if (isBasicPlan) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
            Rehire Status & Trust Analytics
          </h2>
          <p className="text-grey-medium dark:text-gray-400 mb-6">
            Upgrade to Professional to access Rehire Status and
            Trust Analytics.
          </p>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-2 px-6 rounded-lg font-semibold transition-colors"
          >
            Upgrade Now
          </button>
        </div>
        {showUpgradeModal && (
          <UpgradeModal
            feature="Rehire Status & Trust Analytics"
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rehire Status Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
          Rehire Status
        </h2>
        {rehireData.length === 0 ? (
          <p className="text-grey-medium dark:text-gray-400">
            No rehire data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-[#1A1F2B] rounded-xl shadow overflow-hidden">
              <thead className="bg-gray-100 dark:bg-[#0D1117]">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Worker Email
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Rehire Count
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Last Hired
                  </th>
                </tr>
              </thead>
              <tbody>
                {rehireData.map((r, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-grey-background dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                      {r.workerEmail}
                    </td>
                    <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                      {r.rehireCount}
                    </td>
                    <td className="py-3 px-4 text-sm text-grey-medium dark:text-gray-400">
                      {new Date(r.lastHired).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trust Analytics Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-grey-dark dark:text-gray-200">
          Trust Analytics
        </h2>
        {trustScores.length === 0 ? (
          <p className="text-grey-medium dark:text-gray-400">
            No trust score data available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-[#1A1F2B] rounded-xl shadow overflow-hidden">
              <thead className="bg-gray-100 dark:bg-[#0D1117]">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Worker Email
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-grey-dark dark:text-gray-200">
                    Trust Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {trustScores.map((t, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-grey-background dark:border-[#374151] hover:bg-gray-50 dark:hover:bg-[#0D1117] transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-grey-dark dark:text-gray-200">
                      {t.workerEmail}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`font-semibold ${
                          t.score >= 80
                            ? "text-green-600 dark:text-green-400"
                            : t.score >= 60
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {t.score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
