"use client";

import { useCallback, useEffect, useState } from "react";
import { WvCard, WvLoadingState, WvPageHeader, WvTable, WvTableBody, WvTableCell, WvTableHead, WvTableRow } from "@/components/wv";
import { IntegrationSubNav, formatRelativeTime, useConnectionId } from "./integration-nav";

export function SyncHistoryClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [data, setData] = useState<{ syncLogs: Record<string, unknown>[]; checkpoints: Record<string, unknown>[]; cursor: Record<string, unknown> | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/sync-history`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [connectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <WvPageHeader eyebrow="Integrations" title="Sync history" description="Import runs, incremental syncs, and cursor position." />
      <IntegrationSubNav />

      {loading && <WvLoadingState label="Loading sync history…" />}

      {data?.cursor && (
        <WvCard padding="md" className="mb-6">
          <h3 className="font-semibold">Cursor position</h3>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-wv-subtle">Last successful sync</dt><dd>{String(data.cursor.lastSuccessfulSync ?? "—")}</dd></div>
            <div><dt className="text-wv-subtle">Mode</dt><dd>{String(data.cursor.lastSyncMode ?? "—")}</dd></div>
            <div><dt className="text-wv-subtle">Next scheduled</dt><dd>{formatRelativeTime(data.cursor.nextScheduledSync as string)}</dd></div>
          </dl>
        </WvCard>
      )}

      {data && (
        <WvCard padding="none">
          <WvTable>
            <WvTableHead>
              <WvTableRow>
                <WvTableCell header>Type</WvTableCell>
                <WvTableCell header>Status</WvTableCell>
                <WvTableCell header>Duration</WvTableCell>
                <WvTableCell header>When</WvTableCell>
              </WvTableRow>
            </WvTableHead>
            <WvTableBody>
              {data.syncLogs.length === 0 && data.checkpoints.length === 0 ? (
                <WvTableRow>
                  <WvTableCell>No sync history yet. Run an import from the dashboard.</WvTableCell>
                </WvTableRow>
              ) : (
                [...data.syncLogs, ...data.checkpoints].slice(0, 50).map((row, i) => (
                  <WvTableRow key={String(row.id ?? i)}>
                    <WvTableCell>{String(row.sync_type ?? row.checkpoint_type ?? "sync")}</WvTableCell>
                    <WvTableCell>{String(row.status ?? "completed")}</WvTableCell>
                    <WvTableCell>{row.duration_ms ? `${row.duration_ms}ms` : "—"}</WvTableCell>
                    <WvTableCell>{formatRelativeTime(String(row.created_at))}</WvTableCell>
                  </WvTableRow>
                ))
              )}
            </WvTableBody>
          </WvTable>
        </WvCard>
      )}
    </>
  );
}
