"use client";

import { useState } from "react";

type GodModeToggleProps = { initialEnabled: boolean };

/**
 * Toggle God Mode on/off. Only visible to Superadmin. Opt-in only.
 */
export function GodModeToggle({ initialEnabled }: GodModeToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/godmode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEnabled(Boolean(data.enabled));
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-amber-800">{enabled ? "ON" : "OFF"}</span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="px-3 py-1.5 rounded bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium text-sm disabled:opacity-50"
      >
        {loading ? "…" : enabled ? "Disable God Mode" : "Enable God Mode"}
      </button>
    </div>
  );
}
