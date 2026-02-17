"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  billing_tier: string;
  mode?: string | null;
  demo?: boolean | null;
  created_at: string;
  updated_at: string;
};

export function AdminOrganizationsClient() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : (data?.organizations ?? []));
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Search by name or slug"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] dark:border-gray-600 dark:bg-gray-800 dark:text-white w-64"
        />
        <Button variant="secondary" size="sm" onClick={fetchOrgs}>Refresh</Button>
      </div>
      {loading ? (
        <p className="text-[#64748B]">Loading organizations...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-[#E2E8F0] dark:divide-gray-700">
            <thead className="bg-slate-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Billing</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Mode</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#0F172A] dark:text-white uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-sm text-[#334155] dark:text-gray-200">{org.name}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B] dark:text-gray-400">{org.slug}</td>
                  <td className="px-4 py-3 text-sm text-[#334155] dark:text-gray-200">{org.billing_tier}</td>
                  <td className="px-4 py-3 text-sm text-[#334155] dark:text-gray-200">
                    {org.demo ? "demo" : org.mode ?? "production"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/admin/organization/${org.id}`}>View</a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && orgs.length === 0 && (
        <p className="text-[#64748B]">No organizations found.</p>
      )}
    </div>
  );
}
