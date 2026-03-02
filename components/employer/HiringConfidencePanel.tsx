"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

export type HiringConfidenceLevel = "high" | "medium" | "low";

export type HiringConfidenceData = {
  level: HiringConfidenceLevel;
  positives: string[];
  cautions: string[];
};

const LEVEL_CONFIG: Record<
  HiringConfidenceLevel,
  { label: string; Icon: React.ComponentType<{ className?: string }>; colorClass: string }
> = {
  high: {
    label: "🟢 High Confidence",
    Icon: ArrowTrendingUpIcon,
    colorClass: "text-emerald-600 dark:text-emerald-400",
  },
  medium: {
    label: "🟡 Medium Confidence",
    Icon: MinusIcon,
    colorClass: "text-blue-600 dark:text-blue-400",
  },
  low: {
    label: "🔴 Low Confidence",
    Icon: ExclamationTriangleIcon,
    colorClass: "text-amber-600 dark:text-amber-400",
  },
};

export function HiringConfidencePanel({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<HiringConfidenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/employer/candidate/${candidateId}/hiring-confidence`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: HiringConfidenceData) => {
        if (!cancelled) {
          setData({
            level: body.level ?? "medium",
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
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Hiring Confidence
        </h2>
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
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
        <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-2">
          Hiring Confidence
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400">
          {error ?? "Unable to load hiring confidence."}
        </p>
      </Card>
    );
  }

  const config = LEVEL_CONFIG[data.level];
  const Icon = config.Icon;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-grey-dark dark:text-gray-200 mb-4">
        Hiring Confidence
      </h2>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        Based on verification coverage, peer consistency, and dispute history.
      </p>

      <div className="flex items-center gap-2 mb-6">
        <Icon className={`h-6 w-6 flex-shrink-0 ${config.colorClass}`} aria-hidden />
        <span className={`font-semibold ${config.colorClass}`}>{config.label}</span>
      </div>

      {data.positives.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
            What Increases Confidence
          </h3>
          <ul className="space-y-1.5">
            {data.positives.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-grey-dark dark:text-gray-200"
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
          <h3 className="text-sm font-medium text-grey-dark dark:text-gray-200 mb-2">
            What to Double-Check
          </h3>
          <ul className="space-y-1.5">
            {data.cautions.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-grey-dark dark:text-gray-200"
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
