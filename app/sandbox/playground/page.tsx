import { SandboxPlaygroundPanels } from "./SandboxPlaygroundPanels";

/**
 * Minimal, render-safe. No data fetching, no admin dependencies, no assumptions.
 * This page must render even if all APIs fail.
 */
export default function SandboxPlaygroundPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>🧪 Sandbox Playground</h1>
      <p>Sandbox is active. Admin shell is isolated.</p>
      <p>This page must render even if all APIs fail.</p>
      <SandboxPlaygroundPanels />
    </div>
  );
}
