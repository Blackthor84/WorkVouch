"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Row = {
  employerId: string;
  companyName: string;
  planTier: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  reportsUsed: number;
  searchesUsed: number;
  seatsUsed: number;
  seatsAllowed: number;
  limits: { reports: number; searches: number; seats: number } | null;
  overagesTriggered: boolean;
};

export function EmployerUsageClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideEmployerId, setOverrideEmployerId] = useState<string | null>(null);
  const [overrideReports, setOverrideReports] = useState("");
  const [overrideSearches, setOverrideSearches] = useState("");
  const [overrideSeats, setOverrideSeats] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/employer-usage")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const openOverride = (row: Row) => {
    setOverrideEmployerId(row.employerId);
    setOverrideReports(String(row.reportsUsed));
    setOverrideSearches(String(row.searchesUsed));
    setOverrideSeats(String(row.seatsUsed));
  };

  const saveOverride = async () => {
    if (!overrideEmployerId) return;
    setSaving(true);
    try {
      const body: { employerId: string; reports_used?: number; searches_used?: number; seats_used?: number } = {
        employerId: overrideEmployerId,
      };
      if (overrideReports !== "") body.reports_used = parseInt(overrideReports, 10);
      if (overrideSearches !== "") body.searches_used = parseInt(overrideSearches, 10);
      if (overrideSeats !== "") body.seats_used = parseInt(overrideSeats, 10);
      const res = await fetch("/api/admin/employer-usage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setOverrideEmployerId(null);
        const data = await fetch("/api/admin/employer-usage").then((r) => r.json());
        if (Array.isArray(data)) setRows(data);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-grey-medium dark:text-gray-400">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-grey-background dark:border-[#1A1F2B]">
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Company</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Plan</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Stripe Customer</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Subscription ID</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Reports</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Searches</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Seats</th>
              <th className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-medium">Overages</th>
              <th className="py-2 text-grey-medium dark:text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employerId} className="border-b border-grey-background dark:border-[#1A1F2B]">
                <td className="py-2 pr-4 font-medium text-grey-dark dark:text-gray-200">{row.companyName}</td>
                <td className="py-2 pr-4">
                  <Badge variant="secondary">{row.planTier}</Badge>
                </td>
                <td className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-mono text-xs truncate max-w-[140px]" title={row.stripeCustomerId ?? ""}>
                  {row.stripeCustomerId ?? "—"}
                </td>
                <td className="py-2 pr-4 text-grey-medium dark:text-gray-400 font-mono text-xs truncate max-w-[140px]" title={row.stripeSubscriptionId ?? ""}>
                  {row.stripeSubscriptionId ?? "—"}
                </td>
                <td className="py-2 pr-4 text-grey-dark dark:text-gray-200">
                  {row.reportsUsed}
                  {row.limits && row.limits.reports !== -1 && ` / ${row.limits.reports}`}
                </td>
                <td className="py-2 pr-4 text-grey-dark dark:text-gray-200">
                  {row.searchesUsed}
                  {row.limits && row.limits.searches !== -1 && ` / ${row.limits.searches}`}
                </td>
                <td className="py-2 pr-4 text-grey-dark dark:text-gray-200">{row.seatsUsed} / {row.seatsAllowed}</td>
                <td className="py-2 pr-4">
                  {row.overagesTriggered ? (
                    <Badge variant="destructive">Yes</Badge>
                  ) : (
                    <span className="text-grey-medium dark:text-gray-400">No</span>
                  )}
                </td>
                <td className="py-2">
                  <Button variant="secondary" size="sm" onClick={() => openOverride(row)}>
                    Override
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {overrideEmployerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-[#0D1117] border border-grey-background dark:border-[#1A1F2B] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-grey-dark dark:text-gray-200 mb-4">Manual override usage</h3>
            <div className="space-y-3">
              <label className="block text-sm text-grey-medium dark:text-gray-400">
                Reports used
                <input
                  type="number"
                  min={0}
                  className="mt-1 block w-full rounded border border-grey-background dark:border-[#1A1F2B] bg-background dark:bg-[#0D1117] px-3 py-2 text-grey-dark dark:text-gray-200"
                  value={overrideReports}
                  onChange={(e) => setOverrideReports(e.target.value)}
                />
              </label>
              <label className="block text-sm text-grey-medium dark:text-gray-400">
                Searches used
                <input
                  type="number"
                  min={0}
                  className="mt-1 block w-full rounded border border-grey-background dark:border-[#1A1F2B] bg-background dark:bg-[#0D1117] px-3 py-2 text-grey-dark dark:text-gray-200"
                  value={overrideSearches}
                  onChange={(e) => setOverrideSearches(e.target.value)}
                />
              </label>
              <label className="block text-sm text-grey-medium dark:text-gray-400">
                Seats used
                <input
                  type="number"
                  min={1}
                  className="mt-1 block w-full rounded border border-grey-background dark:border-[#1A1F2B] bg-background dark:bg-[#0D1117] px-3 py-2 text-grey-dark dark:text-gray-200"
                  value={overrideSeats}
                  onChange={(e) => setOverrideSeats(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={saveOverride} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button variant="secondary" onClick={() => setOverrideEmployerId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
