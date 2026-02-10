"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SIGNAL_LABELS: Record<string, string> = {
  self_review_blocked: "Self-review attempts (blocked)",
  duplicate_review: "Duplicate review attempts",
  overlap_failure: "Overlap failures",
  rapid_velocity: "Rapid review velocity",
  multi_account_same_ip: "Multi-account same IP",
  sentiment_spike: "Suspicious sentiment spikes",
  rehire_manipulation: "Rehire manipulation patterns",
  mass_negative: "Mass negative review patterns",
};

type Row = { id: string; user_id: string; signal_type: string; metadata: unknown; created_at: string };

export function FraudDashboardClient() {
  const [signals, setSignals] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const url = filter ? `/api/admin/fraud?type=${encodeURIComponent(filter)}` : "/api/admin/fraud";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setSignals(Array.isArray(d) ? d : []))
      .catch(() => setSignals([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const types = Array.from(new Set(signals.map((s) => s.signal_type)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-grey-medium dark:text-gray-400">Filter by type:</span>
        <Button variant={filter === "" ? "primary" : "secondary"} size="sm" onClick={() => setFilter("")}>
          All
        </Button>
        {types.map((t) => (
          <Button
            key={t}
            variant={filter === t ? "primary" : "secondary"}
            size="sm"
            onClick={() => setFilter(t)}
          >
            {SIGNAL_LABELS[t] ?? t}
          </Button>
        ))}
      </div>
      <div className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-grey-medium dark:text-gray-400">Loading...</div>
        ) : signals.length === 0 ? (
          <div className="p-8 text-center text-grey-medium dark:text-gray-400">No fraud signals. Table fraud_signals is populated by the system when events occur.</div>
        ) : (
          <table className="min-w-full divide-y divide-grey-background dark:divide-[#374151]">
            <thead className="bg-grey-background/50 dark:bg-[#1A1F2B]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grey-dark dark:text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grey-dark dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-grey-dark dark:text-gray-300 uppercase">Time</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-grey-dark dark:text-gray-300 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-background dark:divide-[#374151]">
              {signals.map((s) => (
                <tr key={s.id} className="hover:bg-grey-background/50 dark:hover:bg-[#1A1F2B]">
                  <td className="px-4 py-3 text-sm text-grey-dark dark:text-gray-200">{SIGNAL_LABELS[s.signal_type] ?? s.signal_type}</td>
                  <td className="px-4 py-3 text-sm font-mono text-grey-medium dark:text-gray-400">{s.user_id ? `${String(s.user_id).slice(0, 8)}…` : "—"}</td>
                  <td className="px-4 py-3 text-sm text-grey-medium dark:text-gray-400">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {s.user_id && (
                      <Button variant="ghost" size="sm" href={`/admin/users/${s.user_id}`}>
                        View user
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
