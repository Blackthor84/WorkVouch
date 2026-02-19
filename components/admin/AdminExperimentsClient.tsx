"use client";

import { useEffect, useState } from "react";

type Flag = { id: string; key: string; name: string; is_globally_enabled: boolean };

export function AdminExperimentsClient() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => r.json())
      .then((data) => setFlags(Array.isArray(data) ? data : (data?.flags ?? [])))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, key: string, current: boolean) => {
    const res = await fetch(`/api/admin/feature-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_globally_enabled: !current }),
    });
    if (res.ok) setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, is_globally_enabled: !current } : f)));
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-8"><p className="text-slate-500">Loading…</p></div>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Flag</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Key</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Global</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {flags.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm font-medium text-slate-900">{f.name}</td>
              <td className="px-4 py-3 text-sm text-slate-600">{f.key}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggle(f.id, f.key, f.is_globally_enabled)}
                  className={`rounded px-2 py-1 text-xs font-medium ${f.is_globally_enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
                >
                  {f.is_globally_enabled ? "On" : "Off"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
