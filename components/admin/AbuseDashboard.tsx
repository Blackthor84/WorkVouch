"use client";

import type { AbuseSignal } from "@/lib/admin/abuseSignals";

type AbuseDashboardProps = {
  signals: AbuseSignal[];
};

/** Admin view of abuse signals (rejected coworker attempts, duplicate references, rings, etc.). */
export function AbuseDashboard({ signals }: AbuseDashboardProps) {
  return (
    <div>
      <h2 className="text-xl font-bold">Abuse Signals</h2>
      <ul className="divide-y divide-slate-200">
        {signals.map((s, i) => (
          <li key={`${s.userId}-${s.signal}-${i}`} className="border-b border-slate-200 py-2">
            <strong>{s.signal}</strong> — {s.severity}
          </li>
        ))}
      </ul>
    </div>
  );
}
