"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type ScoreResponse = {
  score: number;
  components: {
    verifiedEmployments: number;
    referenceCount: number;
    [key: string]: number;
  };
};

function getBarColor(score: number) {
  if (score < 40) return "bg-red-500";
  if (score < 60) return "bg-amber-500";
  if (score < 80) return "bg-blue-500";
  return "bg-green-500";
}

export function ConfidenceScoreMeter() {
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
      <Card>
        <CardHeader>
          <CardTitle>Confidence Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const score = data ? Math.max(0, Math.min(100, data.score)) : 0;
  const comp = data?.components ?? { verifiedEmployments: 0, referenceCount: 0 };
  const hasVerifiedCoworkers = (comp.referenceCount ?? 0) > 0;
  const hasVerifiedJobHistory = (comp.verifiedEmployments ?? 0) > 0;
  const hasResumeConsistency = score >= 30;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {Math.round(score)}%
          </span>
          <div className="w-full max-w-[180px] h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
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
      </CardContent>
    </Card>
  );
}
