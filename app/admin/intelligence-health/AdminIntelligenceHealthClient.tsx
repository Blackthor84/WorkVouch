"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HealthData {
  days: number;
  since: string;
  pctRecalculatedSuccessfully: number | null;
  recalcSuccess: number;
  recalcFail: number;
  totalRecalc: number;
  fraudBlocksPerDay: number;
  fraudBlocksTotal: number;
  overlapValidationFailures: number;
  overlapValidationFailuresPerDay: number;
  averageSentimentShift: number | null;
}

export function AdminIntelligenceHealthClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/intelligence-health?days=${days}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? res.statusText);
      }
      const j = await res.json();
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [days]);

  if (loading && !data) {
    return (
      <div className="text-grey-medium dark:text-gray-400">Loading…</div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-500/50">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button variant="ghost" className="mt-4" onClick={fetchHealth}>
          Retry
        </Button>
      </Card>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-grey-medium dark:text-gray-400">
          Window:
        </span>
        {[1, 7, 14, 30].map((n) => (
          <Button
            key={n}
            variant={days === n ? "primary" : "ghost"}
            size="sm"
            onClick={() => setDays(n)}
          >
            {n}d
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={fetchHealth}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400 mb-1">
            % Recalculated successfully
          </h3>
          <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            {d.pctRecalculatedSuccessfully != null
              ? `${d.pctRecalculatedSuccessfully}%`
              : "—"}
          </p>
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">
            {d.recalcSuccess} success / {d.recalcFail} fail (last {d.days}d)
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400 mb-1">
            Fraud blocks per day
          </h3>
          <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            {d.fraudBlocksPerDay}
          </p>
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">
            {d.fraudBlocksTotal} total (last {d.days}d)
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400 mb-1">
            Average sentiment shift
          </h3>
          <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            {d.averageSentimentShift != null
              ? d.averageSentimentShift.toFixed(2)
              : "—"}
          </p>
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">
            From recalc_success payloads when present
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-grey-medium dark:text-gray-400 mb-1">
            Overlap validation failures
          </h3>
          <p className="text-2xl font-bold text-grey-dark dark:text-gray-200">
            {d.overlapValidationFailures}
          </p>
          <p className="text-xs text-grey-medium dark:text-gray-400 mt-2">
            {d.overlapValidationFailuresPerDay}/day (last {d.days}d)
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
          Window
        </h3>
        <p className="text-sm text-grey-medium dark:text-gray-400">
          Since {new Date(d.since).toISOString().slice(0, 10)} (last {d.days}{" "}
          days).
        </p>
      </Card>
    </div>
  );
}
