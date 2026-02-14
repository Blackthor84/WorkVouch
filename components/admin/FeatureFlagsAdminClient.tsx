"use client";

import { useEffect, useState } from "react";

type Flag = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  is_globally_enabled: boolean;
  visibility_type: string;
};

export function FeatureFlagsAdminClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/feature-flags", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setFlags(data);
        else if (data?.flags) setFlags(data.flags);
        else setFlags([]);
      })
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[#64748B]">Loading feature flags...</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white dark:border-gray-700 dark:bg-gray-800">
      <table className="min-w-full divide-y divide-[#E2E8F0] dark:divide-gray-700">
        <thead className="bg-slate-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Key</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Global</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Visibility</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
          {flags.map((f) => (
            <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 text-sm font-mono text-[#334155] dark:text-gray-200">{f.key}</td>
              <td className="px-4 py-3 text-sm text-[#334155] dark:text-gray-200">{f.name}</td>
              <td className="px-4 py-3 text-sm text-[#334155] dark:text-gray-200">
                {f.is_globally_enabled ? "Yes" : "No"}
              </td>
              <td className="px-4 py-3 text-sm text-[#64748B] dark:text-gray-400">{f.visibility_type ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {flags.length === 0 && <p className="p-4 text-[#64748B]">No feature flags.</p>}
      {isSuperAdmin && (
        <p className="p-4 text-sm text-[#64748B]">
          Use API PATCH /api/admin/feature-flags/[id] to toggle global state. Per-org assignments via assignments API.
        </p>
      )}
    </div>
  );
}
