"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReferenceInsight } from "@/app/api/user/references-insights/route";

const RECENCY_COLOR: Record<string, string> = {
  Strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  Aging: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  Stale: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

const MAX_RECENT = 5;

export function RecentReferencesPanel() {
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
        if (!cancelled && Array.isArray(data.references)) {
          setRefs(data.references.slice(0, MAX_RECENT));
        }
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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Recent references
        </h2>
        <div className="space-y-3">
          <div className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Recent references
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Recent references
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Latest peer references used in your trust profile.
      </p>
      {refs.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No references yet. Request references from coworkers to strengthen your profile.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Recent references">
          {refs.map((ref) => (
            <li
              key={ref.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {ref.from_user?.full_name ?? "Reference"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {ref.job?.company_name ?? ""} {ref.job?.job_title ? " · " + ref.job.job_title : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {ref.rating}/5
                </span>
                <Badge variant="secondary" className={RECENCY_COLOR[ref.recency] ?? ""}>
                  {ref.recency}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
