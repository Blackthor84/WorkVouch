"use client";

import { IdentitySimulatorPanel } from "./panels/IdentitySimulatorPanel";
import { ImpersonationPanel } from "./panels/ImpersonationPanel";
import { FlowTriggersPanel } from "./panels/FlowTriggersPanel";
import { HiddenSystemsObserverPanel } from "./panels/HiddenSystemsObserverPanel";

/**
 * Four panels; must not block render. Each panel catches its own errors.
 */
export function SandboxPlaygroundPanels() {
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
        <HiddenSystemsObserverPanel />
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
