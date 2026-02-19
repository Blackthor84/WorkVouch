"use client";

import { useState } from "react";

type GodModeBannerProps = { environment: string };

/**
 * Persistent God Mode banner. Shown when Superadmin has God Mode enabled.
 * Cannot be hidden. All actions are logged.
 */
export function GodModeBanner({ environment }: GodModeBannerProps) {
  const [disabling, setDisabling] = useState(false);

  async function handleDisable() {
    setDisabling(true);
    try {
      const res = await fetch("/api/admin/godmode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
        credentials: "include",
      });
      if (res.ok) window.location.reload();
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div
      role="alert"
      className="sticky top-0 z-[70] w-full bg-red-600 text-white text-center py-2 px-4 text-sm font-medium shadow-md flex items-center justify-center gap-4 flex-wrap"
    >
      <span>⚠️ GOD MODE ENABLED — LIVE DATA ACCESS</span>
      <span className="opacity-90">({environment})</span>
      <button
        type="button"
        onClick={handleDisable}
        disabled={disabling}
        className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded font-medium disabled:opacity-50"
      >
        {disabling ? "Disabling…" : "Disable God Mode"}
      </button>
    </div>
  );
}
