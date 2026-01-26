"use client";

import React from "react";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface VerificationLimitWarningProps {
  limit: number;
  used: number;
}

export default function VerificationLimitWarning({
  limit,
  used,
}: VerificationLimitWarningProps) {
  // Only show warning if limit is reached or close to being reached
  if (used < limit - 1) return null;

  const percentage = (used / limit) * 100;
  const isAtLimit = used >= limit;

  return (
    <div
      className={`border-l-4 rounded-xl p-4 my-4 ${
        isAtLimit
          ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400"
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-700 dark:text-yellow-400"
      }`}
    >
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold mb-1">
            {isAtLimit
              ? `You have reached your monthly verification limit (${limit})`
              : `You are close to your monthly verification limit (${used}/${limit})`}
          </p>
          <p className="text-sm mb-3">
            {isAtLimit
              ? "Upgrade to Professional to unlock unlimited verifications and access Pro features."
              : "Upgrade to Professional for unlimited verifications."}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? "bg-red-500" : "bg-yellow-500"
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <Link
            href="/pricing"
            className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
