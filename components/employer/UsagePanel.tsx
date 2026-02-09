"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UsageData {
  planTier: string;
  limits: { reports: number; searches: number; seats: number; allowOverage?: boolean };
  reportsUsed: number;
  searchesUsed: number;
  seatsUsed: number;
  seatsAllowed: number;
  billingCycleStart: string | null;
  billingCycleEnd: string | null;
}

function ProgressBar({
  used,
  limit,
  label,
}: {
  used: number;
  limit: number;
  label: string;
}) {
  if (limit === -1) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-grey-medium dark:text-gray-400">{label}</span>
          <span className="font-medium text-grey-dark dark:text-gray-200">
            Unlimited
          </span>
        </div>
      </div>
    );
  }
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const color =
    pct >= 100
      ? "bg-red-500"
      : pct >= 80
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-grey-medium dark:text-gray-400">{label}</span>
        <span className="font-medium text-grey-dark dark:text-gray-200">
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-grey-background dark:bg-[#1A1F2B] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

interface UsagePanelProps {
  apiBaseUrl?: string;
  sandboxId?: string;
}

export function UsagePanel({ apiBaseUrl, sandboxId }: UsagePanelProps = {}) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const url = apiBaseUrl && sandboxId
    ? `${apiBaseUrl}/usage?sandboxId=${encodeURIComponent(sandboxId)}`
    : "/api/employer/usage";

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) return;
        setData({
          planTier: d.planTier || "starter",
          limits: d.limits || { reports: 10, searches: 15, seats: 1, allowOverage: false },
          reportsUsed: d.reportsUsed ?? 0,
          searchesUsed: d.searchesUsed ?? 0,
          seatsUsed: d.seatsUsed ?? 0,
          seatsAllowed: d.seatsAllowed ?? 1,
          billingCycleStart: d.billingCycleStart ?? null,
          billingCycleEnd: d.billingCycleEnd ?? null,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [url]);

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-grey-medium dark:text-gray-400">
          Loading usage...
        </p>
      </Card>
    );
  }

  if (!data) return null;

  const allowOverage = data.limits.allowOverage ?? false;
  const reportsLimit = data.limits.reports;
  const searchesLimit = data.limits.searches;
  const nearLimitStarter =
    !allowOverage &&
    ((reportsLimit !== -1 && data.reportsUsed >= reportsLimit * 0.8) ||
      (searchesLimit !== -1 && data.searchesUsed >= searchesLimit * 0.8));
  const overLimitOverage =
    allowOverage &&
    ((reportsLimit !== -1 && data.reportsUsed > reportsLimit) ||
      (searchesLimit !== -1 && data.searchesUsed > searchesLimit) ||
      data.seatsUsed > data.seatsAllowed);

  const planLabel =
    data.planTier === "custom"
      ? "Custom"
      : data.planTier === "pro"
        ? "Pro"
        : "Starter";

  return (
    <Card className="p-6">
      {nearLimitStarter && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          ⚠ You are approaching your monthly limit. Upgrade to avoid interruptions.
        </div>
      )}
      {overLimitOverage && (
        <div className="mb-4 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
          You&apos;ve exceeded your plan limit. Additional usage will be billed automatically.
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1 text-grey-dark dark:text-gray-200">
        This Month&apos;s Usage
      </h3>
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        Current Plan: <Badge variant="secondary">{planLabel}</Badge>
      </p>
      <div className="space-y-4">
        <ProgressBar
          used={data.reportsUsed}
          limit={data.limits.reports}
          label="Reports"
        />
        <ProgressBar
          used={data.searchesUsed}
          limit={data.limits.searches}
          label="Searches"
        />
        <ProgressBar
          used={data.seatsUsed}
          limit={data.seatsAllowed}
          label="Seats"
        />
      </div>
    </Card>
  );
}
