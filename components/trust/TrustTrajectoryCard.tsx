"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { TrustTrajectoryBadge, type TrustTrajectoryValue } from "@/components/trust/TrustTrajectoryBadge";

type TrajectoryPayload = {
  trajectory: TrustTrajectoryValue;
  label: string;
  tooltipFactors: string[];
};

export function TrustTrajectoryCard() {
  const [data, setData] = useState<TrajectoryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/trajectory", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load trajectory");
        return res.json();
      })
      .then((body: TrajectoryPayload) => {
        if (!cancelled && body?.trajectory) {
          setData({
            trajectory: body.trajectory,
            label: body.label ?? body.trajectory,
            tooltipFactors: Array.isArray(body.tooltipFactors) ? body.tooltipFactors : [],
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load.");
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
          Trust trajectory
        </h2>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust trajectory
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "Unable to load."}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Trust trajectory
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        How your trust signals are trending based on verification and references.
      </p>
      <TrustTrajectoryBadge
        trajectory={data.trajectory}
        label={data.label}
        tooltipFactors={data.tooltipFactors}
        size="md"
      />
    </Card>
  );
}
