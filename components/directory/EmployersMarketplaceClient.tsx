"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { INDUSTRIES } from "@/lib/constants/industries";

interface EmployerRow {
  employer_id: string;
  company_name: string;
  industry_type: string | null;
  reputation_score: number;
  percentile_rank: number | null;
  industry_percentile_rank: number | null;
  last_calculated_at: string | null;
}

export function EmployersMarketplaceClient() {
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (industry) params.set("industry", industry);
    fetch(`/api/directory/employers?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.employers)) setEmployers(data.employers);
      })
      .catch(() => setEmployers([]))
      .finally(() => setLoading(false));
  }, [industry]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-3 border-b border-grey-background dark:border-[#374151] flex gap-2 items-center">
        <label className="text-sm text-grey-dark dark:text-gray-200">Industry:</label>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded border border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] px-2 py-1 text-sm text-grey-dark dark:text-gray-200 w-48"
        >
          <option value="">All industries</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-grey-background dark:border-[#374151] bg-grey-background/50 dark:bg-[#1A1F2B]">
            <tr>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Rank</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Company</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Industry</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Reputation</th>
              <th className="p-3 font-semibold text-grey-dark dark:text-gray-200">Percentile</th>
            </tr>
          </thead>
          <tbody>
            {employers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-grey-medium dark:text-gray-400">
                  No employers found
                </td>
              </tr>
            ) : (
              employers.map((e, i) => (
                <tr key={e.employer_id} className="border-b border-grey-background/50 dark:border-[#374151]/50">
                  <td className="p-3 text-grey-dark dark:text-gray-200">{i + 1}</td>
                  <td className="p-3 font-medium text-grey-dark dark:text-gray-200">{e.company_name}</td>
                  <td className="p-3 text-grey-medium dark:text-gray-400">{e.industry_type ?? "—"}</td>
                  <td className="p-3 text-primary dark:text-blue-400 font-semibold">{e.reputation_score.toFixed(1)}</td>
                  <td className="p-3 text-grey-medium dark:text-gray-400">
                    {e.percentile_rank != null ? `${e.percentile_rank.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
