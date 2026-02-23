"use client";

import { useState, useEffect, useCallback } from "react";

/** Admin-only: "Enable enforcement" for shadow abuse signals. */
export function ShadowEnforcementToggle() {
  const [enforced, setEnforced] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/shadow-enforcement", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setEnforced((data as { enforced?: boolean }).enforced ?? false);
    } catch {
      setEnforced(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/shadow-enforcement", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enforced }),
      });
      if (res.ok) await fetchState();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Shadow mode enforcement</span>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
      >
        {enforced ? "Enforcement ON" : "Enable enforcement"}
      </button>
    </div>
  );
}
