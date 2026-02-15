"use client";

/**
 * Shown on all trust simulator pages. Sandbox-only; no production data; no external notifications.
 */

export function SandboxSimulatorBanner() {
  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900"
      role="status"
      aria-label="Sandbox mode"
    >
      <span className="font-semibold">SANDBOX ONLY</span>
      <span className="text-amber-700">
        — Trust simulator. No production data. No external notifications. All actions auditable.
      </span>
    </div>
  );
}
