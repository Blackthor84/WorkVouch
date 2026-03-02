"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

type CoachingResponse = {
  suggestions: string[];
  trajectoryInput?: {
    verifiedEmploymentCount: number;
    referenceCount: number;
    hasOpenDispute: boolean;
    daysSinceLastVerification: number | null;
    daysSinceLastReference: number | null;
  };
};

export function TrustTrajectoryCoaching() {
  const [data, setData] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/trust-coaching", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d: CoachingResponse) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = data?.suggestions ?? [];
  const hasSuggestions = suggestions.length > 0;

  if (loading || error || !hasSuggestions) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">How to Strengthen Your Trust</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Actionable steps based on your current profile. No generic advice.
      </p>
      <ul className="space-y-3">
        {suggestions.map((text, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-amber-500 shrink-0 mt-0.5">•</span>
            <span className="text-sm text-slate-700 dark:text-slate-300">{text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/my-jobs" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Job History
        </Link>
        <Link href="/coworker-matches" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Request references
        </Link>
      </div>
    </Card>
  );
}
