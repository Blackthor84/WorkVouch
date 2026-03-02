"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrustTrajectoryBadge } from "@/components/trust/TrustTrajectoryBadge";

export type TrustExplainResponse = {
  trustScore: number;
  topFactors: string[];
  riskFactors: string[];
  confidence: number;
  confidenceLevel: number;
  trustBandLabel: string;
  explanation: string;
  trustTrajectory?: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel?: string;
  trustTrajectoryTooltipFactors?: string[];
  scoreHistory?: { event: string; impact: number | null; date: string }[];
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatImpact(impact: number | null): string {
  if (impact == null) return "—";
  const n = Number(impact);
  if (!Number.isFinite(n)) return "—";
  if (n > 0) return `+${n}`;
  return String(n);
}

export function TrustScoreExplainedSection() {
  const [data, setData] = useState<TrustExplainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/trust/explain", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: TrustExplainResponse) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load trust explanation.");
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
        <h2 className="text-xl font-semibold text-[#0F172A] dark:text-gray-200 mb-2">
          Your Trust Score Explained
        </h2>
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#0F172A] dark:text-gray-200 mb-2">
          Your Trust Score Explained
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error ?? "Unable to load."}
        </p>
      </Card>
    );
  }

  const history = data.scoreHistory ?? [];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-[#0F172A] dark:text-gray-200 mb-4">
        Your Trust Score Explained
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Current trust band
          </h3>
          <p className="text-grey-dark dark:text-gray-200 font-semibold">
            {data.trustBandLabel}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Trust trajectory
          </h3>
          <TrustTrajectoryBadge
            trajectory={data.trustTrajectory ?? "stable"}
            label={data.trustTrajectoryLabel}
            tooltipFactors={data.trustTrajectoryTooltipFactors}
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Explanation
          </h3>
          <p className="text-sm text-grey-dark dark:text-gray-200">
            {data.explanation}
          </p>
        </div>

        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Recent trust-affecting events
            </h3>
            <ul className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
              {history.map((item, i) => (
                <li key={i} className="text-sm">
                  <span className="text-grey-dark dark:text-gray-200">
                    {item.event}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 mx-2">
                    · impact {formatImpact(item.impact)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {formatDate(item.date)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
