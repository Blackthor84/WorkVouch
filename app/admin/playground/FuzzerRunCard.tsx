"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const ATTACK_TYPES = [
  { value: "boost_rings", label: "Boost rings" },
  { value: "retaliation", label: "Retaliation" },
  { value: "oscillation", label: "Oscillation" },
  { value: "impersonation_spam", label: "Impersonation spam" },
] as const;

type Props = {
  onRunComplete?: () => void;
};

export function FuzzerRunCard({ onRunComplete }: Props) {
  const [sandboxId, setSandboxId] = useState("");
  const [attackType, setAttackType] = useState<string>("boost_rings");
  const [actorResolutionJson, setActorResolutionJson] = useState(
    '{"employee_1": "<uuid>", "employee_2": "<uuid>", "admin": "<admin-uuid>"}'
  );
  const [mode, setMode] = useState<"safe" | "real">("safe");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleRun = async () => {
    if (!sandboxId.trim()) {
      setMessage("Enter Simulation ID (sandbox_id).");
      return;
    }
    let actor_resolution: Record<string, string>;
    try {
      actor_resolution = JSON.parse(actorResolutionJson) as Record<string, string>;
    } catch {
      setMessage("Invalid actor_resolution JSON.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sandbox/fuzzer/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sandbox_id: sandboxId.trim(),
          attack_type: attackType,
          actor_resolution,
          mode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage(`Run started: ${(data as { id?: string }).id ?? "ok"}. Refresh Trust Curve to see it.`);
        onRunComplete?.();
      } else {
        setMessage((data as { error?: string }).error ?? "Run failed");
      }
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Scenario Fuzzer</h2>
      <p className="text-sm text-slate-600 mb-4">
        Generate randomized DSL scenarios (boost rings, retaliation, oscillation, impersonation spam), run through the real runner, and capture per-step trust snapshots. All runs are logged to the system audit.
      </p>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Simulation ID (sandbox_id)</label>
          <input
            type="text"
            value={sandboxId}
            onChange={(e) => setSandboxId(e.target.value)}
            placeholder="e.g. from Generate Full Company"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Attack type</label>
          <select
            value={attackType}
            onChange={(e) => setAttackType(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {ATTACK_TYPES.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">actor_resolution (JSON)</label>
          <textarea
            value={actorResolutionJson}
            onChange={(e) => setActorResolutionJson(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-slate-500 mt-1">
            Map actor refs to sandbox user IDs. Include admin. Example: from Generate Full Company copy worker IDs as employee_1, employee_2, etc.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "safe"}
              onChange={() => setMode("safe")}
            />
            Safe mode
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={mode === "real"}
              onChange={() => setMode("real")}
            />
            Real mode
          </label>
        </div>
        <Button
          type="button"
          onClick={handleRun}
          disabled={loading}
          variant="default"
          size="sm"
        >
          {loading ? "Running…" : "Run Fuzzer"}
        </Button>
        {message && (
          <p className="text-sm text-slate-600">{message}</p>
        )}
      </div>
    </div>
  );
}
