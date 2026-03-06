"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReferenceConsistencyResponse } from "@/app/api/employer/candidate/[id]/reference-consistency/route";

const STATUS_STYLE: Record<string, string> = {
  consistent: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  review_recommended: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  no_references: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export function ReferenceConsistencyPanel({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<ReferenceConsistencyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employer/candidate/${encodeURIComponent(candidateId)}/reference-consistency`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: ReferenceConsistencyResponse) => {
        if (!cancelled) setData(body);
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
  }, [candidateId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Reference consistency
        </h2>
        <div className="h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Reference consistency
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "Unable to load."}</p>
      </Card>
    );
  }

  const statusLabel =
    data.status === "consistent"
      ? "Consistent"
      : data.status === "review_recommended"
        ? "Review recommended"
        : "No references";

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Reference consistency
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Summary of reference alignment and ratings.
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="secondary" className={STATUS_STYLE[data.status] ?? ""}>
          {statusLabel}
        </Badge>
        {data.referenceCount > 0 && (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {data.referenceCount} reference{data.referenceCount !== 1 ? "s" : ""}
            {data.averageRating > 0 && ` · ${data.averageRating}/5 avg`}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{data.summary}</p>
    </Card>
  );
}
