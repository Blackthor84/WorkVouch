"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runPlaygroundScenario } from "@/lib/admin/runPlaygroundScenario";

type Props = { isAdmin?: boolean };

export function AdminPlaygroundClient({ isAdmin = true }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = async (label: string, path: string, body?: object) => {
    setLoading(label);
    setMessage(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMessage((data as { error?: string }).error ?? "Failed");
    } finally {
      setLoading(null);
    }
  };

  const runAbuse = async () => {
    if (!isAdmin) return;
    setLoading("Abuse");
    setMessage(null);
    try {
      const result = await runPlaygroundScenario({
        employer_name: "Evil Corp",
        employee_count: 1000,
        mass_rehire: false,
      });
      if (result.ok) {
        setMessage("Abuse simulation complete");
      } else {
        setMessage(result.error ?? "Failed");
      }
    } finally {
      setLoading(null);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={!!loading}
          onClick={() => run("Reset", "/api/admin/sandbox/reset")}
        >
          {loading === "Reset" ? "…" : "Reset playground"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!!loading}
          onClick={() => run("Toggle", "/api/admin/sandbox/toggle")}
        >
          {loading === "Toggle" ? "…" : "Toggle playground_mode"}
        </Button>
        <Button
          variant="danger"
          size="sm"
          disabled={!!loading}
          onClick={runAbuse}
        >
          {loading === "Abuse" ? "…" : "Simulate Mass Abuse"}
        </Button>
      </div>
      {message && (
        <p className={`text-sm ${message.startsWith("Abuse") ? "text-emerald-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
