"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WvBadge, WvButton, WvCard, WvEmptyState, WvLoadingState, WvPageHeader, WvStatCard } from "@/components/wv";
import { IntegrationSubNav, formatRelativeTime, statusBadgeVariant } from "./integration-nav";
import { Plug, RefreshCw, Users, Briefcase, Activity, Zap } from "lucide-react";

interface DashboardData {
  connectVersion: string;
  providers: Array<{
    provider: string;
    displayName: string;
    connectionId?: string;
    status: string;
    healthScore?: number;
    healthStatus?: string;
    providerAccountName?: string;
    lastSyncAt?: string;
    nextSyncAt?: string;
    connectVersion: string;
    providerVersion: string;
    stats?: {
      eventsProcessed: number;
      candidatesImported: number;
      jobsImported: number;
      applicationsImported: number;
      automationEnabled: boolean;
      automationTrigger?: string;
    };
  }>;
}

export function IntegrationsDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/integrations");
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runImport = async (connectionId: string) => {
    setImporting(connectionId);
    try {
      const res = await fetch(`/api/employer/integrations/connections/${connectionId}/import`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Import failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(null);
    }
  };

  const greenhouse = data?.providers.find((p) => p.provider === "greenhouse");
  const stats = greenhouse?.stats;

  return (
    <>
      <WvPageHeader
        eyebrow="Integrations"
        title="WorkVouch Connect"
        description="Connect your ATS, configure automation, and monitor sync health — no engineering required."
        action={
          <WvButton href="/employer/integrations/connect" variant="primary">
            Connect provider
          </WvButton>
        }
      />
      <IntegrationSubNav />

      {loading && <WvLoadingState label="Loading integrations…" />}
      {error && (
        <WvCard className="mb-6 border-red-500/30 bg-red-500/5 p-4 text-red-300">{error}</WvCard>
      )}

      {!loading && data && (
        <>
          {stats && greenhouse?.connectionId && (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <WvStatCard label="Events processed" value={stats.eventsProcessed} icon={Activity} accent="blue" />
              <WvStatCard label="Candidates imported" value={stats.candidatesImported} icon={Users} accent="violet" />
              <WvStatCard label="Jobs imported" value={stats.jobsImported} icon={Briefcase} accent="green" />
              <WvStatCard label="Applications" value={stats.applicationsImported} icon={Zap} accent="amber" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.providers.map((provider) => (
              <WvCard key={provider.provider} padding="md" hover className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Plug className="h-5 w-5 text-violet-400" aria-hidden />
                      <h3 className="text-lg font-semibold text-wv-foreground">{provider.displayName}</h3>
                    </div>
                    {provider.providerAccountName && (
                      <p className="mt-1 text-sm text-wv-muted">{provider.providerAccountName}</p>
                    )}
                  </div>
                  <WvBadge variant={statusBadgeVariant(provider.status)}>
                    {provider.status === "not_connected" ? "Not connected" : provider.status}
                  </WvBadge>
                </div>

                {provider.connectionId ? (
                  <>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-wv-subtle">Health</dt>
                        <dd className="font-medium text-wv-foreground">
                          {provider.healthScore ?? "—"}/100 ({provider.healthStatus ?? "unknown"})
                        </dd>
                      </div>
                      <div>
                        <dt className="text-wv-subtle">Last sync</dt>
                        <dd className="font-medium text-wv-foreground">{formatRelativeTime(provider.lastSyncAt)}</dd>
                      </div>
                      <div>
                        <dt className="text-wv-subtle">Platform</dt>
                        <dd className="font-medium text-wv-foreground">v{provider.connectVersion}</dd>
                      </div>
                      <div>
                        <dt className="text-wv-subtle">Automation</dt>
                        <dd className="font-medium text-wv-foreground">
                          {provider.stats?.automationEnabled ? provider.stats.automationTrigger ?? "On" : "Manual"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <WvButton
                        href={`/employer/integrations/greenhouse?connectionId=${provider.connectionId}`}
                        variant="outline"
                        size="sm"
                      >
                        Manage
                      </WvButton>
                      <WvButton
                        variant="ghost"
                        size="sm"
                        disabled={importing === provider.connectionId}
                        onClick={() => runImport(provider.connectionId!)}
                      >
                        <RefreshCw className={`mr-1 h-4 w-4 ${importing === provider.connectionId ? "animate-spin" : ""}`} />
                        Sync now
                      </WvButton>
                    </div>
                  </>
                ) : provider.provider === "greenhouse" ? (
                  <WvButton href="/employer/integrations/connect" variant="primary" size="sm">
                    Connect Greenhouse
                  </WvButton>
                ) : (
                  <p className="text-sm text-wv-muted">Coming soon</p>
                )}
              </WvCard>
            ))}
          </div>

          {!greenhouse?.connectionId && (
            <div className="mt-8">
              <WvEmptyState
                title="No ATS connected"
                description="Connect Greenhouse to automatically sync candidates and configure invitation workflows."
                action={<WvButton href="/employer/integrations/connect">Start connection wizard</WvButton>}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
