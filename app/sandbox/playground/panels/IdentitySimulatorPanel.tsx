"use client";

import { useState, useCallback } from "react";

type SpawnType = "worker" | "employer" | "pair" | "team";

type IdentitySimulatorPanelProps = {
  onSpawnSuccess?: () => void;
};

export function IdentitySimulatorPanel({ onSpawnSuccess }: IdentitySimulatorPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const spawn = useCallback(
    async (type: SpawnType) => {
      setLoading(true);
      setError(undefined);
      setResult(undefined);
      try {
        const res = await fetch("/api/sandbox/spawn", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Spawn failed");
          return;
        }
        setResult(JSON.stringify(data, null, 2));
        onSpawnSuccess?.();
      } catch {
        setError("Request failed");
      } finally {
        setLoading(false);
      }
    },
    [onSpawnSuccess]
  );

  return (
    <div style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
        Creates real sandbox_employees / sandbox_employers. is_sandbox = true.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {(["worker", "employer", "pair", "team"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => spawn(t)}
            disabled={loading}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              background: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p style={{ margin: 0, color: "#DC2626" }}>{error}</p>}
      {result && (
        <pre style={{ margin: 0, fontSize: 12, overflow: "auto", maxHeight: 160 }}>{result}</pre>
      )}
    </div>
  );
}
