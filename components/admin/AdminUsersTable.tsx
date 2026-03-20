"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  trust_score?: number | null;
  created_at?: string | null;
};

export function AdminUsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json().catch(() => []);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const patchRole = async (userId: string, role: string) => {
    setActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (res.ok) await load();
    } finally {
      setActing(null);
    }
  };

  if (loading && users.length === 0) {
    return <p className="text-slate-500 p-6">Loading members…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
        <Button variant="secondary" size="sm" type="button" onClick={() => load()}>
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Trust</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-4 font-medium text-slate-900">{u.full_name || "—"}</td>
                    <td className="p-4 text-slate-600">{u.email || "—"}</td>
                    <td className="p-4 text-slate-700">{u.role}</td>
                    <td className="p-4 tabular-nums text-slate-800">
                      {u.trust_score != null ? Math.round(Number(u.trust_score)) : "—"}
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${u.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={acting === u.id}
                          onClick={() => patchRole(u.id, "employer")}
                        >
                          Employer
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={acting === u.id}
                          onClick={() => patchRole(u.id, "admin")}
                        >
                          Admin
                        </Button>
                        <Button variant="ghost" size="sm" disabled title="Coming soon">
                          Suspend
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
