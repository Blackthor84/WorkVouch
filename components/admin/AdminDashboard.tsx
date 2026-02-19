"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [godMode, setGodMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/godmode", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.enabled === "boolean") setGodMode(data.enabled);
      })
      .catch(() => {});
  }, []);

  const toggleGodMode = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/godmode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !godMode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.enabled === "boolean") {
        setGodMode(data.enabled);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const runScenario = async (fn: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/playground/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(data?.error ?? "Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>

      <div>
        <Button
          onClick={toggleGodMode}
          disabled={loading}
          variant={godMode ? "danger" : "secondary"}
          size="sm"
        >
          {godMode ? "Disable God Mode" : "Enable God Mode"}
        </Button>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-2">
        <h2 className="font-semibold text-slate-900">Playground Scenarios</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={loading} onClick={() => runScenario("playground_small")}>
            ▶ Small Demo
          </Button>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => runScenario("playground_medium")}>
            ▶ Medium Demo
          </Button>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => runScenario("playground_large")}>
            ▶ Large Demo
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={loading}
            onClick={() => {
              if (confirm("RESET ALL PLAYGROUND DATA?")) {
                runScenario("reset_playground");
              }
            }}
          >
            🗑 Reset Playground
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Working…</p>}
    </div>
  );
}
