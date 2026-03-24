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
      <Card>
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
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
      <Card>
        <h2 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
          Your Trust Score Explained
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error ?? "Unable to load."}
        </p>
      </Card>
    );
  }

  const history = data.scoreHistory ?? [];

  return (
    <Card>
      <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
        Your Trust Score Explained
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Current trust band
          </h3>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {data.trustBandLabel}
          </p>
        </div>

        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Trust trajectory
          </h3>
          <TrustTrajectoryBadge
            trajectory={data.trustTrajectory ?? "stable"}
            label={data.trustTrajectoryLabel}
            tooltipFactors={data.trustTrajectoryTooltipFactors}
          />
        </div>

        <div>
          <h3 className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Explanation
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.explanation}
          </p>
        </div>

        {history.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Recent trust-affecting events
            </h3>
            <ul className="space-y-2 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
              {history.map((item, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-gray-900 dark:text-gray-100">
                    {item.event}
                  </span>
                  <span className="mx-2 text-xs text-gray-500 dark:text-gray-400">
                    · impact {formatImpact(item.impact)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
