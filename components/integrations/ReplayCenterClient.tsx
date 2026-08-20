"use client";

import { useCallback, useEffect, useState } from "react";
import { WvBadge, WvButton, WvCard, WvLoadingState, WvPageHeader, WvTable, WvTableBody, WvTableCell, WvTableHead, WvTableRow } from "@/components/wv";
import { IntegrationSubNav, formatRelativeTime, useConnectionId } from "./integration-nav";

export function ReplayCenterClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [failures, setFailures] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/replay`);
    if (res.ok) {
      const json = await res.json();
      setFailures(json.failures ?? []);
    }
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const replay = async (webhookLogId: string, mode: "simulation" | "live") => {
    setReplaying(webhookLogId);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/replay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookLogId, mode }),
    });
    setLastResult(await res.json());
    setReplaying(null);
    if (mode === "live") void load();
  };

  return (
    <>
      <WvPageHeader eyebrow="Integrations" title="Replay center" description="Replay failed webhooks and events in simulation or live mode." />
      <IntegrationSubNav />

      {loading && <WvLoadingState label="Loading failures…" />}

      {lastResult && (
        <WvCard padding="md" className="mb-6 border-emerald-500/30 bg-emerald-500/5">
          <p className="text-sm text-emerald-300">Replay result: {JSON.stringify(lastResult).slice(0, 200)}…</p>
        </WvCard>
      )}

      <WvCard padding="none">
        <WvTable>
          <WvTableHead>
            <WvTableRow>
              <WvTableCell header>Provider event</WvTableCell>
              <WvTableCell header>Status</WvTableCell>
              <WvTableCell header>When</WvTableCell>
              <WvTableCell header>Actions</WvTableCell>
            </WvTableRow>
          </WvTableHead>
          <WvTableBody>
            {failures.length === 0 ? (
              <WvTableRow>
                <WvTableCell>No failed webhooks. All events processing normally.</WvTableCell>
              </WvTableRow>
            ) : (
              failures.map((row) => (
                <WvTableRow key={String(row.id)}>
                  <WvTableCell>{String(row.provider_event ?? row.universal_event ?? "—")}</WvTableCell>
                  <WvTableCell><WvBadge variant="danger">{String(row.status)}</WvBadge></WvTableCell>
                  <WvTableCell>{formatRelativeTime(String(row.created_at))}</WvTableCell>
                  <WvTableCell>
                    <div className="flex gap-2">
                      <WvButton size="sm" variant="outline" disabled={replaying === String(row.id)} onClick={() => replay(String(row.id), "simulation")}>
                        Simulate
                      </WvButton>
                      <WvButton size="sm" variant="primary" disabled={replaying === String(row.id)} onClick={() => replay(String(row.id), "live")}>
                        Replay live
                      </WvButton>
                    </div>
                  </WvTableCell>
                </WvTableRow>
              ))
            )}
          </WvTableBody>
        </WvTable>
      </WvCard>
    </>
  );
}
