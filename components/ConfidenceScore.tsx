"use client";

import { useState, useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { TrustBadgeTier } from "@/components/TrustBadgeTier";

type ScoreResponse = {
  score: number;
  /** Confidence score in points (+20 job, +10 per verification, +5 bonus for 2+). */
  confidenceScore?: number;
  components?: {
    verifiedEmployments?: number;
    referenceCount?: number;
    [key: string]: number | undefined;
  };
};

function getBarColor(score: number) {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-blue-500";
  return "bg-green-500";
}

/**
 * Core product value: "Employment Trust Score".
 * Displays confidence score (0–100%), progress bar, and verification checkmarks.
 * Place prominently in dashboard center. Fetches from /api/trust/score.
 */
export default function ConfidenceScore() {
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/score", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body?.score != null) setData(body);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Confidence Score</h2>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded mt-4 animate-pulse" />
      </div>
    );
  }

  const score = data ? Math.max(0, Math.min(100, data.score)) : 0;
  const confidencePoints = Math.max(0, data?.confidenceScore ?? 0);
  const displayPercent = Math.min(100, confidencePoints);
  const comp = data?.components ?? {};
  const hasVerifiedCoworkers = (comp.referenceCount ?? 0) > 0;
  const hasVerifiedJobHistory = (comp.verifiedEmployments ?? 0) > 0;
  const hasResumeConsistency = score >= 30;

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-8 bg-white dark:bg-gray-900 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Confidence Score</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">A trust score for employment — how trustworthy your resume is.</p>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-4 rounded-full mt-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(displayPercent)}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{confidencePoints} pts</p>
        <TrustBadgeTier score={confidencePoints} />
      </div>
      {confidencePoints >= 100 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Max display 100%</p>}
      <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <li className="flex items-center gap-2">
          {hasVerifiedCoworkers ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
          )}
          <span>Verified Coworkers</span>
        </li>
        <li className="flex items-center gap-2">
          {hasVerifiedJobHistory ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
          )}
          <span>Verified Job History</span>
        </li>
        <li className="flex items-center gap-2">
          {hasResumeConsistency ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <span className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
          )}
          <span>Resume Consistency</span>
        </li>
      </ul>
    </div>
  );
}
