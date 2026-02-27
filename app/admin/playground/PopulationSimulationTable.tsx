"use client";

import { useMemo, useState } from "react";

export type PopulationEmployee = {
  id: string;
  name: string;
  role?: string;
  department?: string;
  trustScore: number;
  confidenceScore: number;
  reviewCount?: number;
};

type Props = {
  employees: PopulationEmployee[];
  /** When provided, show subset selector and compare. */
  onSelectSubset?: (ids: string[]) => void;
};

function histogram(data: number[], bins: number): { min: number; max: number; counts: number[] } {
  if (data.length === 0) return { min: 0, max: 100, counts: Array(bins).fill(0) };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  for (const v of data) {
    const idx = Math.min(Math.floor((v - min) / step), bins - 1);
    counts[idx]++;
  }
  return { min, max, counts };
}

export function PopulationSimulationTable({ employees, onSelectSubset }: Props) {
  const [subsetFilter, setSubsetFilter] = useState<"all" | "top10" | "bottom20" | "random">("all");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const trustScores = useMemo(() => employees.map((e) => e.trustScore), [employees]);
  const confidenceScores = useMemo(() => employees.map((e) => e.confidenceScore), [employees]);

  const trustHist = useMemo(() => histogram(trustScores, 10), [trustScores]);
  const confidenceHist = useMemo(() => histogram(confidenceScores, 10), [confidenceScores]);

  const filtered = useMemo(() => {
    if (employees.length === 0) return [];
    if (subsetFilter === "all") return employees;
    const sorted = [...employees].sort((a, b) => b.trustScore - a.trustScore);
    if (subsetFilter === "top10") {
      const n = Math.max(1, Math.floor(employees.length * 0.1));
      return sorted.slice(0, n);
    }
    if (subsetFilter === "bottom20") {
      const n = Math.max(1, Math.floor(employees.length * 0.2));
      return sorted.slice(-n);
    }
    const shuffled = [...employees].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(50, employees.length));
  }, [employees, subsetFilter]);

  const paged = useMemo(
    () => filtered.slice(page * pageSize, page * pageSize + pageSize),
    [filtered, page, pageSize]
  );

  const avgTrust = useMemo(
    () => (filtered.length ? filtered.reduce((s, e) => s + e.trustScore, 0) / filtered.length : 0),
    [filtered]
  );
  const avgConfidence = useMemo(
    () => (filtered.length ? filtered.reduce((s, e) => s + e.confidenceScore, 0) / filtered.length : 0),
    [filtered]
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Population simulation</h2>
      <p className="text-sm text-slate-600">
        Table of many employees (50–500). Distribution charts and subset selection for comparison.
      </p>

      {employees.length === 0 ? (
        <p className="text-sm text-slate-500">No employees to display. Add fake employees in Simulation Data Builder or use mock data.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-xs font-semibold text-slate-600 mb-1">Trust score distribution</h3>
              <div className="flex items-end gap-0.5 h-24">
                {trustHist.counts.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-slate-300 rounded-t min-h-[2px]"
                    style={{ height: `${Math.max(2, (c / Math.max(...trustHist.counts, 1)) * 100)}%` }}
                    title={`${trustHist.min + (i * (trustHist.max - trustHist.min)) / 10}-${trustHist.min + ((i + 1) * (trustHist.max - trustHist.min)) / 10}: ${c}`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">n={employees.length}</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <h3 className="text-xs font-semibold text-slate-600 mb-1">Confidence score distribution</h3>
              <div className="flex items-end gap-0.5 h-24">
                {confidenceHist.counts.map((c, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-sky-300 rounded-t min-h-[2px]"
                    style={{ height: `${Math.max(2, (c / Math.max(...confidenceHist.counts, 1)) * 100)}%` }}
                    title={`${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-slate-700">Subset:</span>
            {(["all", "top10", "bottom20", "random"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setSubsetFilter(f);
                  setPage(0);
                  if (onSelectSubset && f !== "all" && employees.length > 0) {
                    const sorted = [...employees].sort((a, b) => b.trustScore - a.trustScore);
                    const ids = f === "top10"
                      ? sorted.slice(0, Math.max(1, Math.floor(employees.length * 0.1))).map((e) => e.id)
                      : f === "bottom20"
                        ? sorted.slice(-Math.max(1, Math.floor(employees.length * 0.2))).map((e) => e.id)
                        : [...employees].sort(() => Math.random() - 0.5).slice(0, Math.min(50, employees.length)).map((e) => e.id);
                    onSelectSubset(ids);
                  }
                }}
                className={`rounded px-3 py-1.5 text-sm ${subsetFilter === f ? "bg-slate-700 text-white" : "border border-slate-300 bg-white hover:bg-slate-50"}`}
              >
                {f === "all" ? "All" : f === "top10" ? "Top 10%" : f === "bottom20" ? "Bottom 20%" : "Random 50"}
              </button>
            ))}
            <span className="text-sm text-slate-500 ml-2">Avg trust: {avgTrust.toFixed(1)} · Avg confidence: {avgConfidence.toFixed(1)}</span>
          </div>

          <div className="overflow-x-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Dept</th>
                  <th className="text-right p-2">Trust</th>
                  <th className="text-right p-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100">
                    <td className="p-2">{e.name}</td>
                    <td className="p-2">{e.role ?? "—"}</td>
                    <td className="p-2">{e.department ?? "—"}</td>
                    <td className="p-2 text-right font-mono">{e.trustScore}</td>
                    <td className="p-2 text-right font-mono">{e.confidenceScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > pageSize && (
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="py-1">Page {page + 1} of {Math.ceil(filtered.length / pageSize)}</span>
              <button
                type="button"
                disabled={page >= Math.ceil(filtered.length / pageSize) - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
