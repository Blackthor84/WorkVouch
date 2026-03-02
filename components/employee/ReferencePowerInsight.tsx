"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import type { ReferenceInsight } from "@/app/api/user/references-insights/route";

const BADGE_EXPLANATIONS: Record<string, string> = {
  "Direct Manager": "This reference is from your direct supervisor for this role.",
  "Repeated Coworker": "This person has given you more than one reference, showing ongoing professional support.",
  "Verified Match": "The job linked to this reference has been independently verified.",
};

const RECENCY_EXPLANATIONS: Record<string, string> = {
  Strong: "Reference is less than a year old; employers value recent feedback.",
  Aging: "Reference is 1-2 years old; consider adding newer references.",
  Stale: "Reference is over 2 years old; newer references can strengthen your profile.",
};

export function ReferencePowerInsight() {
  const [refs, setRefs] = useState<ReferenceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/references-insights", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load references");
        return res.json();
      })
      .then((data: { references?: ReferenceInsight[] }) => {
        if (!cancelled && Array.isArray(data.references)) setRefs(data.references);
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

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Reference insights</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Reference insights</h2>
        <p className="text-sm text-slate-500">{error}</p>
      </Card>
    );
  }

  if (refs.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Reference Power Insights</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">No references yet. Request references from coworkers to see badges and recency here.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Reference Power Insights</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Badges (Direct Manager, Repeated Coworker, Verified Match) and recency (Strong, Aging, Stale) reflect real logic.
      </p>
      <ul className="space-y-4">
        {refs.map((ref) => (
          <li key={ref.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {ref.from_user?.full_name ?? "Anonymous"}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${
                  ref.recency === "Strong"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : ref.recency === "Aging"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
                title={RECENCY_EXPLANATIONS[ref.recency]}
              >
                {ref.recency}
              </span>
            </div>
            {ref.job && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {ref.job.job_title ?? "Role"} at {ref.job.company_name ?? "Company"}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ref.is_direct_manager && (
                <span className="inline-flex items-center rounded bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200" title={BADGE_EXPLANATIONS["Direct Manager"]}>
                  Direct Manager
                </span>
              )}
              {ref.is_repeated_coworker && (
                <span className="inline-flex items-center rounded bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-200" title={BADGE_EXPLANATIONS["Repeated Coworker"]}>
                  Repeated Coworker
                </span>
              )}
              {ref.is_verified_match && (
                <span className="inline-flex items-center rounded bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200" title={BADGE_EXPLANATIONS["Verified Match"]}>
                  Verified Match
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIconSolid
                  key={i}
                  className={`h-4 w-4 ${i <= ref.rating ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                />
              ))}
              <span className="ml-1">{ref.rating}/5</span>
            </div>
            {ref.written_feedback && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 italic">&ldquo;{ref.written_feedback}&rdquo;</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
