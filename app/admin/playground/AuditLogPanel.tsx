"use client";

import type { LabAuditEntry } from "./auditTypes";
import { AUDIT_LOG } from "@/lib/playground/copy";

type Props = {
  entries: LabAuditEntry[];
};

export function AuditLogPanel({ entries }: Props) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">{AUDIT_LOG.title}</h2>
      <p className="text-sm text-slate-600">{AUDIT_LOG.subtext}</p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
        All simulations are local-only. Real employee records are never altered. Exports are watermarked SIMULATION.
      </p>
      <div className="max-h-64 overflow-auto border border-slate-100 rounded">
        {entries.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">No actions recorded yet. Use any lab button to see entries here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {[...entries].reverse().map((e) => (
              <li key={e.id} className="p-2 text-xs font-mono flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-slate-500">{e.timestamp}</span>
                <span className="font-semibold text-slate-800">{e.action}</span>
                <span className="text-slate-600">actor: {e.actor}</span>
                {e.universeId != null && <span className="text-slate-500">universe: {e.universeId.slice(0, 8)}</span>}
                {e.beforeSnapshotId != null && <span className="text-slate-500">before: {e.beforeSnapshotId}</span>}
                {e.afterSnapshotId != null && <span className="text-slate-500">after: {e.afterSnapshotId}</span>}
                {e.notes && <span className="text-slate-500 truncate max-w-[200px]" title={e.notes}>{e.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
