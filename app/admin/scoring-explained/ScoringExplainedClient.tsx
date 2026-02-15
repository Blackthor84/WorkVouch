"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Formula description (read-only). Matches lib/core/intelligence/v1. */
const FORMULA_SECTIONS = [
  { name: "Tenure", desc: "Log(total months + 1) × 10, capped at 30. Rewards career stability." },
  { name: "Review volume", desc: "Review count × 3, capped at 25. More verified peer reviews increase score." },
  { name: "Sentiment", desc: "Average sentiment × 20. Positive reviews contribute." },
  { name: "Rating", desc: "((avg rating − 3) / 2) × 15. Neutral 3; above/below shift score." },
  { name: "Fraud penalty", desc: "min(fraud_count × 5, 15). Penalties outweigh gains; no silent forgiveness." },
  { name: "Rehire multiplier", desc: "1.1 if rehire-eligible, else 0.9. Applied after raw sum." },
];

type Breakdown = {
  totalScore: number;
  components: {
    tenure: number;
    reviewVolume: number;
    sentiment: number;
    rating: number;
    fraudPenalty: number;
    rehireMultiplier: number;
  };
};

type HistoryRow = {
  id: string;
  previous_score: number | null;
  new_score: number | null;
  delta: number | null;
  reason: string | null;
  triggered_by: string | null;
  created_at: string;
};

export function ScoringExplainedClient() {
  const [userId, setUserId] = useState("");
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = async () => {
    const uid = userId.trim();
    if (!uid) return;
    setLoading(true);
    setError(null);
    setBreakdown(null);
    setHistory([]);
    try {
      const [breakdownRes, historyRes] = await Promise.all([
        fetch(`/api/admin/intelligence/breakdown?userId=${encodeURIComponent(uid)}`),
        fetch(`/api/admin/users/${encodeURIComponent(uid)}/score-history`),
      ]);
      if (!breakdownRes.ok) throw new Error(breakdownRes.status === 403 ? "Forbidden" : "Breakdown failed");
      if (!historyRes.ok) throw new Error(historyRes.status === 403 ? "Forbidden" : "History failed");
      const b = (await breakdownRes.json()) as Breakdown;
      const h = (await historyRes.json()) as HistoryRow[];
      setBreakdown(b);
      setHistory(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Scoring formula (read-only)</h2>
        <p className="text-sm text-slate-600 mb-4">
          Trust Score = (Tenure + Review volume + Sentiment + Rating − Fraud penalty) × Rehire multiplier. Clamped 0–100. Every change is audited with reason and before/after state.
        </p>
        <ul className="space-y-2 text-sm">
          {FORMULA_SECTIONS.map((s) => (
            <li key={s.name} className="flex gap-2">
              <span className="font-medium text-slate-700 w-36">{s.name}</span>
              <span className="text-slate-600">{s.desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Component breakdown by user</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="User ID (UUID)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm w-72 font-mono"
          />
          <Button type="button" size="sm" onClick={loadUser} disabled={loading || !userId.trim()}>
            {loading ? "Loading…" : "Load"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {breakdown && (
          <div className="grid gap-2 text-sm">
            <p className="font-medium text-slate-700">Total score: {breakdown.totalScore}</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
              <li>Tenure: {breakdown.components.tenure}</li>
              <li>Review volume: {breakdown.components.reviewVolume}</li>
              <li>Sentiment: {breakdown.components.sentiment}</li>
              <li>Rating: {breakdown.components.rating}</li>
              <li>Fraud penalty: {breakdown.components.fraudPenalty}</li>
              <li>Rehire multiplier: {breakdown.components.rehireMultiplier}</li>
            </ul>
          </div>
        )}
      </section>

      {breakdown && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Historical changes (audit-backed)</h2>
          <p className="text-xs text-slate-500 mb-2">Last 50 trust_score changes for this user. Reason and trigger required for every change.</p>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">No history records.</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="pb-2 pr-2">Previous</th>
                    <th className="pb-2 pr-2">New</th>
                    <th className="pb-2 pr-2">Delta</th>
                    <th className="pb-2 pr-2">Reason</th>
                    <th className="pb-2 pr-2">Triggered by</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2">{row.previous_score ?? "—"}</td>
                      <td className="py-1.5 pr-2">{row.new_score ?? "—"}</td>
                      <td className="py-1.5 pr-2">{row.delta ?? "—"}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs">{row.reason ?? "—"}</td>
                      <td className="py-1.5 pr-2 font-mono text-xs truncate max-w-[120px]">{row.triggered_by ?? "—"}</td>
                      <td className="py-1.5 text-slate-500">{new Date(row.created_at).toISOString().slice(0, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Manual admin adjustments</h2>
        <p className="text-sm text-slate-600 mb-2">
          All trust adjustments require a reason and are written to admin audit logs. Use the user detail page or API with reason. Sandbox parity: same actions available in sandbox and audited with is_sandbox.
        </p>
        <p className="text-sm text-slate-600">
          Flags / freezes / locks: see user detail and fraud workflow. Frozen scores do not change until admin resolution.
        </p>
      </section>
    </div>
  );
}
