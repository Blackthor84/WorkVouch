"use client";

import { useState, useCallback, useEffect } from "react";

/** Read-only. No labels, no judgments, no permanent scores. Sandbox data only. */
export function HiddenSystemsObserverPanel() {
  const [data, setData] = useState<{
    trustDelta?: number;
    culture?: string[];
    signals?: string[];
    abuseRisk?: string;
  } | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchObserver = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/observer", { credentials: "include" });
      if (!res.ok) {
        setData(undefined);
        setLoading(false);
        return;
      }
      const json = await res.json().catch(() => ({}));
      setData({
        trustDelta: json.trustDelta,
        culture: Array.isArray(json.culture) ? json.culture : [],
        signals: Array.isArray(json.signals) ? json.signals : [],
        abuseRisk: json.abuseRisk,
      });
    } catch {
      setData(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObserver();
  }, [fetchObserver]);

  if (loading && data === undefined) return <p style={{ margin: 0, color: "#64748B" }}>Loading…</p>;
  if (data === undefined && !loading) return <p style={{ margin: 0, color: "#64748B" }}>No data</p>;

  return (
    <div style={{ fontSize: 13 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>Trust delta, culture aggregates, signals, abuse risk. Read-only.</p>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontWeight: 600, marginTop: 6 }}>Trust delta</dt>
        <dd style={{ margin: "2px 0 0 0" }}>{data.trustDelta ?? "—"}</dd>
        <dt style={{ fontWeight: 600, marginTop: 6 }}>Culture</dt>
        <dd style={{ margin: "2px 0 0 0" }}>{(data.culture ?? []).join(", ") || "—"}</dd>
        <dt style={{ fontWeight: 600, marginTop: 6 }}>Signals</dt>
        <dd style={{ margin: "2px 0 0 0" }}>{(data.signals ?? []).join(", ") || "—"}</dd>
        <dt style={{ fontWeight: 600, marginTop: 6 }}>Abuse risk</dt>
        <dd style={{ margin: "2px 0 0 0 0" }}>{data.abuseRisk ?? "—"}</dd>
      </dl>
      <button
        type="button"
        onClick={fetchObserver}
        disabled={loading}
        style={{ marginTop: 12, padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 12 }}
      >
        Refresh
      </button>
    </div>
  );
}
