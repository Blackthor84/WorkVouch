"use client";

import { useCallback, useEffect, useState } from "react";
import { WvButton, WvCard, WvInput, WvLoadingState, WvPageHeader, WvTable, WvTableBody, WvTableCell, WvTableHead, WvTableRow } from "@/components/wv";
import { IntegrationSubNav, formatRelativeTime, useConnectionId } from "./integration-nav";

export function EventExplorerClient({ defaultConnectionId }: { defaultConnectionId?: string }) {
  const connectionId = useConnectionId(defaultConnectionId);
  const [correlationId, setCorrelationId] = useState("");
  const [data, setData] = useState<{ events: Record<string, unknown>[]; webhooks: Record<string, unknown>[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!connectionId) return;
    setLoading(true);
    const qs = correlationId ? `?correlationId=${encodeURIComponent(correlationId)}` : "";
    const res = await fetch(`/api/employer/integrations/connections/${connectionId}/events${qs}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [connectionId, correlationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <WvPageHeader eyebrow="Integrations" title="Event explorer" description="Search events by correlation ID, candidate, or job." />
      <IntegrationSubNav />

      <div className="mb-6 flex flex-wrap gap-3">
        <WvInput
          label="Correlation ID"
          placeholder="corr-..."
          value={correlationId}
          onChange={(e) => setCorrelationId(e.target.value)}
          className="max-w-md"
        />
        <WvButton onClick={load} className="self-end">Search</WvButton>
      </div>

      {loading && <WvLoadingState label="Loading events…" />}

      {data && (
        <WvCard padding="none">
          <WvTable>
            <WvTableHead>
              <WvTableRow>
                <WvTableCell header>Universal event</WvTableCell>
                <WvTableCell header>Aggregate</WvTableCell>
                <WvTableCell header>Correlation</WvTableCell>
                <WvTableCell header>When</WvTableCell>
              </WvTableRow>
            </WvTableHead>
            <WvTableBody>
              {data.events.length === 0 ? (
                <WvTableRow>
                  <WvTableCell>No events found.</WvTableCell>
                </WvTableRow>
              ) : (
                data.events.map((event) => (
                  <WvTableRow key={String(event.id)}>
                    <WvTableCell>{String(event.event_type)}</WvTableCell>
                    <WvTableCell>{String(event.aggregate_type)}:{String(event.aggregate_id)}</WvTableCell>
                    <WvTableCell className="font-mono text-xs">{String(event.correlation_id)}</WvTableCell>
                    <WvTableCell>{formatRelativeTime(String(event.occurred_at))}</WvTableCell>
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
