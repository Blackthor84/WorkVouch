import Link from "next/link";
import { SandboxPlaygroundPanels } from "./SandboxPlaygroundPanels";
import { ImpersonationBanner } from "./ImpersonationBanner";

/**
 * Full sandbox simulator: generate company, run scenarios, observe. Render-safe; no blocking.
 */
export default function SandboxPlaygroundPage() {
  return (
    <div style={{ padding: 24 }}>
      <ImpersonationBanner />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>🧪 Sandbox Playground</h1>
          <p style={{ color: "#64748B", marginBottom: 0 }}>Generate a full fake company, run scenarios, and observe hidden systems. Admin-only; sandbox data only.</p>
        </div>
        <Link
          href="/admin/sandbox/monitor"
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #8B5CF6",
            background: "#F5F3FF",
            color: "#6D28D9",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          View Activity Monitor
        </Link>
      </div>
      <SandboxPlaygroundPanels />
    </div>
  );
}
