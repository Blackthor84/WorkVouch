"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowTrendingUpIcon,
  MinusIcon,
  ArrowTrendingDownIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

type TrustExplainPayload = {
  trustBandLabel: string;
  trustTrajectory: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel: string;
  trustTrajectoryTooltipFactors: string[];
  verifiedEmploymentCoveragePct: number | null;
};

const BAND_TOOLTIP =
  "Trust band is derived from your overall trust score: verification, references, and profile strength.";
const COVERAGE_TOOLTIP =
  "Percentage of your employment roles that have been independently verified. Higher coverage strengthens employer confidence.";

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1" title={text}>
      {children}
      <QuestionMarkCircleIcon className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" aria-hidden />
    </span>
  );
}

/**
 * Section 2 — Trust Snapshot: band, trajectory, verified employment coverage %.
 * Only shows when data exists; each metric has a tooltip.
 */
export function TrustSnapshotPanel() {
  const [data, setData] = useState<TrustExplainPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/explain", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((d: TrustExplainPayload) => {
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

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Trust Snapshot
        </h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const trajectoryIcon =
    data.trustTrajectory === "improving" ? (
      <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden />
    ) : data.trustTrajectory === "at_risk" ? (
      <ArrowTrendingDownIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
    ) : (
      <MinusIcon className="h-5 w-5 text-slate-500" aria-hidden />
    );

  const trajectoryTooltip =
    data.trustTrajectoryTooltipFactors.length > 0
      ? data.trustTrajectoryTooltipFactors.join(". ")
      : "Based on verification recency, references, and dispute status.";

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Trust Snapshot
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <Tooltip text={BAND_TOOLTIP}>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Trust Band
            </span>
          </Tooltip>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {data.trustBandLabel}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Tooltip text={trajectoryTooltip}>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Trust Trajectory
            </span>
          </Tooltip>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {trajectoryIcon}
            {data.trustTrajectoryLabel}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <Tooltip text={COVERAGE_TOOLTIP}>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Verified Employment Coverage
            </span>
          </Tooltip>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {data.verifiedEmploymentCoveragePct != null
              ? `${data.verifiedEmploymentCoveragePct}%`
              : "—"}
          </p>
        </div>
      </div>
    </Card>
  );
}
