"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Employer = { id: string; company_name: string | null };

export function AdminEmployersClient() {
  const [list, setList] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/employers-list")
      .then((r) => r.json())
      .then((data) => setList(data?.employers ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-8"><p className="text-slate-500">Loading…</p></div>;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Company</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {list.length === 0 ? (
            <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-500">No employers.</td></tr>
          ) : (
            list.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{e.company_name || e.id}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/organizations?search=${encodeURIComponent(e.company_name || "")}`} className="text-sm text-blue-600 hover:underline">View orgs</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
