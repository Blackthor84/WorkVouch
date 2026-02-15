import { SandboxPlaygroundPanels } from "./SandboxPlaygroundPanels";
import { ImpersonationBanner } from "./ImpersonationBanner";

/**
 * Full sandbox simulator: generate company, run scenarios, observe. Render-safe; no blocking.
 */
export default function SandboxPlaygroundPage() {
  return (
    <div style={{ padding: 24 }}>
      <ImpersonationBanner />
      <h1>🧪 Sandbox Playground</h1>
      <p style={{ color: "#64748B", marginBottom: 0 }}>Generate a full fake company, run scenarios, and observe hidden systems. Admin-only; sandbox data only.</p>
      <SandboxPlaygroundPanels />
    </div>
  );
}
