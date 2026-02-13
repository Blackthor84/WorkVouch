"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScaleMetrics {
  limit_blocks_last_24h: number;
  abuse_flags_triggered_last_24h: number;
  orgs_at_limit_count: number;
  blocked_actions_by_plan: Record<string, number>;
  unique_orgs_blocked: number;
  unique_orgs_abuse_flag: number;
  enterprise_recommended_count?: number;
  enterprise_recommended_reason?: string | null;
}

export function ScaleMetricsClient() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ScaleMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgIdInput, setOrgIdInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/scale-metrics")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : "Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data.success && data.metrics) setMetrics(data.metrics);
        else if (!cancelled) setError("Invalid response");
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
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
      <div className="p-6 text-slate-500">Loading scale metrics…</div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }
  if (!metrics) {
    return (
      <div className="p-6 text-slate-500">No metrics data.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Orgs at limit</p>
          <p className="text-2xl font-semibold">{metrics.orgs_at_limit_count}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Limit blocks (24h)</p>
          <p className="text-2xl font-semibold">{metrics.limit_blocks_last_24h}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Abuse flags (24h)</p>
          <p className="text-2xl font-semibold">{metrics.abuse_flags_triggered_last_24h}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Unique orgs blocked</p>
          <p className="text-2xl font-semibold">{metrics.unique_orgs_blocked}</p>
        </Card>
        {metrics.enterprise_recommended_count != null && (
          <Card className="p-4">
            <p className="text-sm text-slate-500">Enterprise recommended (score ≥ 40)</p>
            <p className="text-2xl font-semibold">{metrics.enterprise_recommended_count}</p>
            {metrics.enterprise_recommended_reason && (
              <p className="text-xs text-amber-600 mt-1">{metrics.enterprise_recommended_reason}</p>
            )}
          </Card>
        )}
      </div>
      <Card className="p-4">
        <p className="text-sm text-slate-500 mb-2">Blocked actions by plan</p>
        <pre className="text-sm bg-slate-50 p-3 rounded overflow-auto">
          {JSON.stringify(metrics.blocked_actions_by_plan, null, 2)}
        </pre>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Org limit explainer (plan vs usage, abuse, recommendation)</p>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Organization ID"
            value={orgIdInput}
            onChange={(e) => setOrgIdInput(e.target.value)}
            className="max-w-xs"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const id = orgIdInput.trim();
              if (id) router.push(`/admin/orgs/${encodeURIComponent(id)}/limit-explainer`);
            }}
          >
            View limit explainer
          </Button>
        </div>
      </Card>
      <p className="text-xs text-slate-400">
        checks_per_minute requires time-bucketed logging (TODO).
      </p>
    </div>
  );
}
