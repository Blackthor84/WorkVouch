"use client";

import { useCallback, useEffect, useState } from "react";
import { WvBadge, WvCard, WvLoadingState, WvPageHeader, WvStatCard } from "@/components/wv";
import { IntegrationSubNav, statusBadgeVariant, useConnectionId } from "./integration-nav";

export function HealthDashboardClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/health`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const report = data?.report as Record<string, unknown> | undefined;
  const components = (report?.components ?? []) as Array<Record<string, unknown>>;

  return (
    <>
      <WvPageHeader eyebrow="Integrations" title="Health dashboard" description="OAuth, provider API, webhooks, projections, and database health." />
      <IntegrationSubNav />

      {loading && <WvLoadingState label="Evaluating health…" />}

      {report && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WvStatCard label="Overall score" value={Number(report.overallScore ?? 0)} suffix="/100" accent="violet" />
            <WvStatCard label="Webhook success" value={Number((data?.webhookMetrics as Record<string, number>)?.deliverySuccess ?? 0)} accent="green" />
            <WvStatCard label="DLQ count" value={Number((data?.webhookMetrics as Record<string, number>)?.deadLetterCount ?? 0)} accent="amber" />
            <WvStatCard label="Avg latency" value={Number((data?.webhookMetrics as Record<string, number>)?.averageLatencyMs ?? 0)} suffix="ms" accent="blue" />
          </div>

          <WvCard padding="md">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="font-semibold">Components</h3>
              <WvBadge variant={statusBadgeVariant(String(report.overallStatus))}>{String(report.overallStatus)}</WvBadge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {components.map((c) => (
                <div key={String(c.name)} className="rounded-xl border border-wv-border bg-wv-surface/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{String(c.name)}</span>
                    <WvBadge variant={statusBadgeVariant(String(c.status))}>{String(c.status)}</WvBadge>
                  </div>
                  <p className="mt-1 text-sm text-wv-muted">{String(c.message)}</p>
                  {c.latencyMs != null && <p className="mt-1 text-xs text-wv-subtle">{String(c.latencyMs)}ms</p>}
                </div>
              ))}
            </div>
          </WvCard>
        </>
      )}
    </>
  );
}
