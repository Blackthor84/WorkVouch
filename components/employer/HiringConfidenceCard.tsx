"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export type HiringConfidenceCardData = {
  confidenceLevel: ConfidenceLevel;
  positives: string[];
  cautions: string[];
};

const LEVEL_CONFIG: Record<
  ConfidenceLevel,
  { label: string; Icon: React.ComponentType<{ className?: string }>; colorClass: string; bgClass: string }
> = {
  HIGH: {
    label: "High confidence",
    Icon: ArrowTrendingUpIcon,
    colorClass: "text-emerald-700 dark:text-emerald-400",
    bgClass: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
  },
  MEDIUM: {
    label: "Medium confidence",
    Icon: MinusIcon,
    colorClass: "text-blue-700 dark:text-blue-400",
    bgClass: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  },
  LOW: {
    label: "Low confidence",
    Icon: ExclamationTriangleIcon,
    colorClass: "text-amber-700 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
  },
};

export function HiringConfidenceCard({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<HiringConfidenceCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/employer/confidence/${encodeURIComponent(candidateId)}`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: HiringConfidenceCardData) => {
        if (!cancelled) {
          const level = (body.confidenceLevel ?? "MEDIUM") as ConfidenceLevel;
          setData({
            confidenceLevel: ["HIGH", "MEDIUM", "LOW"].includes(level) ? level : "MEDIUM",
            positives: Array.isArray(body.positives) ? body.positives : [],
            cautions: Array.isArray(body.cautions) ? body.cautions : [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load hiring confidence.");
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
          Hiring Confidence
        </h2>
        <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Hiring Confidence
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {error ?? "Unable to load hiring confidence."}
        </p>
      </Card>
    );
  }

  const config = LEVEL_CONFIG[data.confidenceLevel];
  const Icon = config.Icon;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Hiring Confidence
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Based on verification coverage, reference consistency, dispute status, and trust trajectory.
      </p>

      <div
        className={`flex items-center gap-2 mb-6 rounded-lg border p-3 ${config.bgClass}`}
      >
        <Icon className={`h-6 w-6 flex-shrink-0 ${config.colorClass}`} aria-hidden />
        <span className={`font-semibold ${config.colorClass}`}>{config.label}</span>
      </div>

      {data.positives.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Positives
          </h3>
          <ul className="space-y-1.5">
            {data.positives.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.cautions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Cautions
          </h3>
          <ul className="space-y-1.5">
            {data.cautions.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
