"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserItem = { id: string; email?: string; full_name?: string };
type EmployerItem = { id: string; company_name?: string };

type DashboardData = {
  profile_strength: number;
  career_health: number;
  stability_score: number;
  reference_score: number;
  rehire_probability: number;
  dispute_score: number;
  network_density_score: number;
  fraud_confidence: number;
  overall_risk_score: number;
  hiring_confidence_score: number | null;
  team_fit_score: number | null;
  model_version: string;
  snapshot_row: Record<string, unknown> | null;
  risk_breakdown: Record<string, unknown> | null;
  network_overview: Record<string, unknown> | null;
  team_fit_row: Record<string, unknown> | null;
  hiring_confidence_row: Record<string, unknown> | null;
  last_calculated_at: string | null;
};

export function AdminIntelligenceDashboardClient({
  userList,
  employerList,
}: {
  userList: UserItem[];
  employerList: EmployerItem[];
}) {
  const [userId, setUserId] = useState("");
  const [employerId, setEmployerId] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ userId });
      if (employerId) params.set("employerId", employerId);
      const res = await fetch(`/api/admin/intelligence-dashboard?${params}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed to load");
        setData(null);
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Request failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-4 py-2 text-grey-dark dark:text-gray-200 min-w-[200px]"
        >
          <option value="">Select user</option>
          {userList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email || u.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <select
          value={employerId}
          onChange={(e) => setEmployerId(e.target.value)}
          className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-4 py-2 text-grey-dark dark:text-gray-200 min-w-[200px]"
        >
          <option value="">No employer (team fit off)</option>
          {employerList.map((e) => (
            <option key={e.id} value={e.id}>
              {e.company_name || e.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <Button onClick={load} disabled={!userId || loading}>
          {loading ? "Loading…" : "Load"}
        </Button>
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Canonical metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Model version: {data.model_version}</p>
              <p>Last calculated: {data.last_calculated_at ?? "—"}</p>
              <p>Profile strength: {data.profile_strength}</p>
              <p>Career health: {data.career_health}</p>
              <p>Stability: {data.stability_score} · Reference: {data.reference_score} · Rehire: {data.rehire_probability} · Dispute: {data.dispute_score}</p>
              <p>Network density: {data.network_density_score} · Fraud confidence: {data.fraud_confidence}</p>
              <p>Overall risk score: {data.overall_risk_score}</p>
              {data.team_fit_score != null && <p>Team fit score: {data.team_fit_score}</p>}
              {data.hiring_confidence_score != null && <p>Hiring confidence score: {data.hiring_confidence_score}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Full breakdown JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-[400px] bg-slate-100 dark:bg-slate-800 p-4 rounded">
                {JSON.stringify(
                  {
                    snapshot_row: data.snapshot_row,
                    risk_breakdown: data.risk_breakdown,
                    network_overview: data.network_overview,
                    team_fit_row: data.team_fit_row,
                    hiring_confidence_row: data.hiring_confidence_row,
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
