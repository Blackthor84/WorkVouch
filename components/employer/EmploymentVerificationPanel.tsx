"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type EmploymentVerificationEntry = {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  verification_status: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

export function EmploymentVerificationPanel({ candidateId }: { candidateId: string }) {
  const [entries, setEntries] = useState<EmploymentVerificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employer/candidate/${encodeURIComponent(candidateId)}/employment-verification`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data: { entries?: EmploymentVerificationEntry[] }) => {
        if (!cancelled && Array.isArray(data.entries)) setEntries(data.entries);
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
          Employment verification
        </h2>
        <div className="space-y-3">
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
          Employment verification
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Employment verification
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Candidate roles and verification status.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No employment records.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-100">{entry.job_title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{entry.company_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(entry.start_date)}
                  {entry.end_date && !entry.is_current
                    ? " – " + formatDate(entry.end_date)
                    : entry.is_current
                      ? " – Present"
                      : ""}
                </p>
              </div>
              <Badge
                variant={entry.verification_status === "verified" ? "success" : "secondary"}
                className="flex-shrink-0"
              >
                {entry.verification_status === "verified" ? "Verified" : entry.verification_status ?? "Pending"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
