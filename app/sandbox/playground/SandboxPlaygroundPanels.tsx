"use client";

import { useState, useCallback, useEffect } from "react";
import { IdentitySimulatorPanel } from "./panels/IdentitySimulatorPanel";
import { ImpersonationPanel } from "./panels/ImpersonationPanel";
import { FlowTriggersPanel } from "./panels/FlowTriggersPanel";
import { HiddenSystemsObserverPanel, type ObserverData } from "./panels/HiddenSystemsObserverPanel";

/**
 * Four panels; must not block render. Each panel catches its own errors.
 */
export function SandboxPlaygroundPanels() {
  const [observerData, setObserverData] = useState<ObserverData | undefined>(undefined);
  const [observerLoading, setObserverLoading] = useState(false);

  const fetchObserver = useCallback(async () => {
    setObserverLoading(true);
    try {
      const res = await fetch("/api/sandbox/observer", { credentials: "include" });
      if (!res.ok) {
        setObserverData(undefined);
        return;
      }
      const json = await res.json().catch(() => ({}));
      setObserverData({
        trustDelta: json.trustDelta,
        culture: Array.isArray(json.culture) ? json.culture : [],
        signals: Array.isArray(json.signals) ? json.signals : [],
        abuseRisk: typeof json.abuseRisk === "number" ? json.abuseRisk : undefined,
      });
    } catch {
      setObserverData(undefined);
    } finally {
      setObserverLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObserver();
  }, [fetchObserver]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
      <PanelCard title="Identity Simulator">
        <IdentitySimulatorPanel />
      </PanelCard>
      <PanelCard title="Impersonation Panel">
        <ImpersonationPanel />
      </PanelCard>
      <PanelCard title="Flow Triggers">
        <FlowTriggersPanel />
      </PanelCard>
      <PanelCard title="Hidden Systems Observer (read-only)">
        {observerLoading && !observerData ? (
          <p style={{ margin: 0, color: "#64748B" }}>Loading…</p>
        ) : (
          <>
            <HiddenSystemsObserverPanel data={observerData} />
            <button
              type="button"
              onClick={fetchObserver}
              disabled={observerLoading}
              style={{ marginTop: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: observerLoading ? "not-allowed" : "pointer", fontSize: 12 }}
            >
              Refresh
            </button>
          </>
        )}
      </PanelCard>
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: 16, background: "#F8FAFC" }}>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 600 }}>{title}</h2>
      {children}
    </div>
  );
}
