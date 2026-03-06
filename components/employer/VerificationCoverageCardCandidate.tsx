"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

type CoverageData = {
  coveragePercent: number;
  verifiedRoles: number;
  totalRoles: number;
};

export function VerificationCoverageCardCandidate({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = "/api/employer/candidate/" + encodeURIComponent(candidateId) + "/coverage";
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: CoverageData) => {
        if (!cancelled) {
          setData({
            coveragePercent: typeof body.coveragePercent === "number" ? body.coveragePercent : 0,
            verifiedRoles: typeof body.verifiedRoles === "number" ? body.verifiedRoles : 0,
            totalRoles: typeof body.totalRoles === "number" ? body.totalRoles : 0,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load verification coverage.");
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
          Verification coverage
        </h2>
        <div className="h-12 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Verification coverage
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "Unable to load."}</p>
      </Card>
    );
  }

  const { coveragePercent, verifiedRoles, totalRoles } = data;
  const hasRoles = totalRoles > 0;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Verification coverage
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Share of candidate roles that are independently verified.
      </p>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckBadgeIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {hasRoles ? coveragePercent + "%" : "—"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {hasRoles
              ? verifiedRoles + " of " + totalRoles + " role(s) verified"
              : "No employment roles"}
          </p>
        </div>
      </div>
      {hasRoles && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-emerald-500 dark:bg-emerald-600 transition-all"
            style={{ width: Math.min(100, coveragePercent) + "%" }}
            role="progressbar"
            aria-valuenow={coveragePercent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}
    </Card>
  );
}
