"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  ArrowTrendingUpIcon,
  MinusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export type ForecastTrajectory = "improving" | "stable" | "at_risk";

type TrustForecastData = {
  trajectory: ForecastTrajectory;
  confidence: number;
  recentImpact: number;
  previousImpact: number;
};

const TOOLTIP =
  "Predicted trend based on recent verification activity, references, and dispute outcomes.";

const TRAJECTORY_CONFIG = {
  improving: {
    label: "Improving",
    icon: ArrowTrendingUpIcon,
    className: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  stable: {
    label: "Stable",
    icon: MinusIcon,
    className: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800/50",
  },
  at_risk: {
    label: "At Risk",
    icon: ExclamationTriangleIcon,
    className: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
};

interface TrustForecastCardProps {
  profileId?: string;
}

export function TrustForecastCard({ profileId: propProfileId }: TrustForecastCardProps) {
  const [profileId, setProfileId] = useState<string | null>(propProfileId ?? null);
  const [data, setData] = useState<TrustForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let id: string | null | undefined = propProfileId;
      if (!id) {
        const meRes = await fetch("/api/user/me", { credentials: "include" });
        if (!meRes.ok || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        const me = (await meRes.json()) as { user?: { id?: string } };
        id = me?.user?.id ?? null;
        if (!cancelled && id) setProfileId(id);
      }
      if (!id || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/trust/forecast/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const body: TrustForecastData = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError("Unable to load trust outlook.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [propProfileId]);

  if (loading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Trust Outlook
        </h2>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Outlook
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Outlook
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">No forecast data.</p>
      </Card>
    );
  }

  const config = TRAJECTORY_CONFIG[data.trajectory];
  const Icon = config.icon;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Trust Outlook
      </h2>
      <p
        className="text-sm text-slate-500 dark:text-slate-400 mb-4"
        title={TOOLTIP}
      >
        {TOOLTIP}
      </p>
      <div
        className={`flex items-center gap-3 rounded-lg p-3 ${config.bg}`}
        role="status"
        aria-label={`Trust outlook: ${config.label}`}
      >
        <Icon className={`h-6 w-6 shrink-0 ${config.className}`} />
        <div>
          <p className={`font-semibold ${config.className}`}>
            {data.trajectory === "improving" && "⬆ "}
            {data.trajectory === "stable" && "➡ "}
            {data.trajectory === "at_risk" && "⬇ "}
            {config.label}
          </p>
          {data.confidence < 1 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Confidence: {Math.round(data.confidence * 100)}%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
