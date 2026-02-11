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
  behavioral_raw_scores?: Record<string, unknown>[];
  behavioral_vector?: Record<string, unknown> | null;
  behavioral_alignment_score?: number | null;
  risk_behavioral_contribution?: number | null;
  industry_baseline?: Record<string, unknown> | null;
  employer_baseline?: Record<string, unknown> | null;
  hybrid_baseline?: Record<string, unknown> | null;
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
  const [reprocessLoading, setReprocessLoading] = useState(false);

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

  async function reprocessBehavioral() {
    if (!userId) return;
    setReprocessLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reprocess-behavioral/${userId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Reprocess failed");
        return;
      }
      await load();
    } catch {
      setError("Reprocess request failed");
    } finally {
      setReprocessLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-xl border border-slate-600 bg-[#111827] px-4 py-2 text-slate-200 min-w-[200px]"
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
          className="rounded-xl border border-slate-600 bg-[#111827] px-4 py-2 text-slate-200 min-w-[200px]"
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
        {data && userId && (
          <Button variant="secondary" onClick={reprocessBehavioral} disabled={reprocessLoading}>
            {reprocessLoading ? "Reprocessing…" : "Reprocess behavioral"}
          </Button>
        )}
      </div>
      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
      {data && (
        <div className="grid gap-6">
          <Card className="bg-[#111827] border border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Canonical metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
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
          <Card className="bg-[#111827] border border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Behavioral Intelligence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              {data.behavioral_vector != null && (
                <div>
                  <p className="font-medium text-slate-200 mb-2">Aggregated vector</p>
                  <pre className="text-xs overflow-auto max-h-[200px] bg-[#1f2937] text-slate-300 p-3 rounded border border-slate-600">
                    {JSON.stringify(data.behavioral_vector, null, 2)}
                  </pre>
                </div>
              )}
              {data.behavioral_alignment_score != null && (
                <p>Behavioral alignment score: {data.behavioral_alignment_score}</p>
              )}
              {data.risk_behavioral_contribution != null && (
                <p>Risk behavioral contribution: {data.risk_behavioral_contribution}</p>
              )}
              {data.behavioral_raw_scores != null && data.behavioral_raw_scores.length > 0 && (
                <div>
                  <p className="font-medium text-slate-200 mb-2">
                    Raw extracted scores ({data.behavioral_raw_scores.length} reviews)
                  </p>
                  <pre className="text-xs overflow-auto max-h-[300px] bg-[#1f2937] text-slate-300 p-3 rounded border border-slate-600">
                    {JSON.stringify(data.behavioral_raw_scores, null, 2)}
                  </pre>
                </div>
              )}
              {!data.behavioral_vector && (!data.behavioral_raw_scores?.length) && (
                <p className="text-slate-300">No behavioral data for this user.</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Hybrid Behavioral Baseline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              {data.industry_baseline != null && (
                <div>
                  <p className="font-medium text-slate-200 mb-2">Industry baseline (sample_size: {(data.industry_baseline as { sample_size?: number }).sample_size ?? "—"})</p>
                  <pre className="text-xs overflow-auto max-h-[180px] bg-[#1f2937] text-slate-300 p-3 rounded border border-slate-600">
                    {JSON.stringify(data.industry_baseline, null, 2)}
                  </pre>
                </div>
              )}
              {data.employer_baseline != null && (
                <div>
                  <p className="font-medium text-slate-200 mb-2">Employer baseline (employee_sample_size: {(data.employer_baseline as { employee_sample_size?: number }).employee_sample_size ?? "—"})</p>
                  <pre className="text-xs overflow-auto max-h-[180px] bg-[#1f2937] text-slate-300 p-3 rounded border border-slate-600">
                    {JSON.stringify(data.employer_baseline, null, 2)}
                  </pre>
                </div>
              )}
              {data.hybrid_baseline != null && (
                <div>
                  <p className="font-medium text-slate-200 mb-2">Blended hybrid baseline (employer_weight / industry_weight)</p>
                  <pre className="text-xs overflow-auto max-h-[200px] bg-[#1f2937] text-slate-300 p-3 rounded border border-slate-600">
                    {JSON.stringify(data.hybrid_baseline, null, 2)}
                  </pre>
                </div>
              )}
              {data.behavioral_alignment_score != null && (
                <p>Behavioral alignment vs baseline: {data.behavioral_alignment_score}</p>
              )}
              {!data.industry_baseline && !data.employer_baseline && !data.hybrid_baseline && (
                <p className="text-slate-300">No hybrid baseline data (select employer for employer/hybrid).</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Full breakdown JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-[400px] bg-[#1f2937] text-slate-300 p-4 rounded border border-slate-600">
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
