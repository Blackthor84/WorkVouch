"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CandidateItem = { id: string; email?: string; full_name?: string };

type TeamFitRow = { alignment_score: number; breakdown: unknown; model_version: string; updated_at: string } | null;
type RiskRow = { overall_score: number; breakdown: unknown; model_version: string; updated_at: string } | null;
type NetworkRow = { density_score: number; fraud_confidence: number; breakdown: unknown; model_version: string; updated_at: string } | null;
type HiringRow = { composite_score: number; breakdown: unknown; model_version: string; updated_at: string } | null;

type PreviewData = {
  teamFitSummary: TeamFitRow;
  riskBreakdown: RiskRow;
  networkOverview: NetworkRow;
  fraudIndicator: { fraudConfidence: number } | null;
  hiringConfidenceComposite: HiringRow;
};

export function AdminIntelligencePreviewClient({
  candidateList,
}: {
  candidateList: CandidateItem[];
}) {
  const [candidateId, setCandidateId] = useState<string>("");
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPreview() {
    if (!candidateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/intelligence-preview?candidateId=${encodeURIComponent(candidateId)}`, {
        credentials: "include",
      });
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
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          className="rounded-xl border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-4 py-2 text-grey-dark dark:text-gray-200 min-w-[200px]"
        >
          <option value="">Select candidate</option>
          {candidateList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name || p.email || p.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <Button onClick={loadPreview} disabled={!candidateId || loading}>
          {loading ? "Loading…" : "Load preview"}
        </Button>
      </div>
      {error && (
        <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
      )}
      {data && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Fit Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {data.teamFitSummary ? (
                <div className="text-sm">
                  <p className="font-semibold text-grey-dark dark:text-gray-200">
                    Alignment score: {data.teamFitSummary.alignment_score}
                  </p>
                  <p className="text-grey-medium dark:text-gray-400 mt-1">
                    Model v{data.teamFitSummary.model_version} · {new Date(data.teamFitSummary.updated_at).toLocaleString()}
                  </p>
                  {data.teamFitSummary.breakdown && typeof data.teamFitSummary.breakdown === "object" ? (
                    <pre className="mt-2 p-2 rounded bg-grey-background dark:bg-[#1A1F2B] text-xs overflow-auto max-h-32">
                      {JSON.stringify(data.teamFitSummary.breakdown as object, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : (
                <p className="text-grey-medium dark:text-gray-400">No team fit data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Modeling Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {data.riskBreakdown ? (
                <div className="text-sm">
                  <p className="font-semibold text-grey-dark dark:text-gray-200">
                    Overall score: {data.riskBreakdown.overall_score}
                  </p>
                  <p className="text-grey-medium dark:text-gray-400 mt-1">
                    Model v{data.riskBreakdown.model_version} · {new Date(data.riskBreakdown.updated_at).toLocaleString()}
                  </p>
                  {data.riskBreakdown.breakdown && typeof data.riskBreakdown.breakdown === "object" ? (
                    <pre className="mt-2 p-2 rounded bg-grey-background dark:bg-[#1A1F2B] text-xs overflow-auto max-h-32">
                      {JSON.stringify(data.riskBreakdown.breakdown as object, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : (
                <p className="text-grey-medium dark:text-gray-400">No risk model data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Density Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {data.networkOverview ? (
                <div className="text-sm">
                  <p className="font-semibold text-grey-dark dark:text-gray-200">
                    Density score: {data.networkOverview.density_score}
                  </p>
                  <p className="text-grey-medium dark:text-gray-400 mt-1">
                    Model v{data.networkOverview.model_version} · {new Date(data.networkOverview.updated_at).toLocaleString()}
                  </p>
                  {data.networkOverview.breakdown && typeof data.networkOverview.breakdown === "object" ? (
                    <pre className="mt-2 p-2 rounded bg-grey-background dark:bg-[#1A1F2B] text-xs overflow-auto max-h-32">
                      {JSON.stringify(data.networkOverview.breakdown as object, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : (
                <p className="text-grey-medium dark:text-gray-400">No network density data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fraud Probability Indicator</CardTitle>
            </CardHeader>
            <CardContent>
              {data.fraudIndicator ? (
                <p className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                  Fraud confidence: {data.fraudIndicator.fraudConfidence}
                </p>
              ) : (
                <p className="text-grey-medium dark:text-gray-400">No fraud indicator data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hiring Confidence Composite</CardTitle>
            </CardHeader>
            <CardContent>
              {data.hiringConfidenceComposite ? (
                <div className="text-sm">
                  <p className="font-semibold text-grey-dark dark:text-gray-200">
                    Composite score: {data.hiringConfidenceComposite.composite_score}
                  </p>
                  <p className="text-grey-medium dark:text-gray-400 mt-1">
                    Model v{data.hiringConfidenceComposite.model_version} · {new Date(data.hiringConfidenceComposite.updated_at).toLocaleString()}
                  </p>
                  {data.hiringConfidenceComposite.breakdown && typeof data.hiringConfidenceComposite.breakdown === "object" ? (
                    <pre className="mt-2 p-2 rounded bg-grey-background dark:bg-[#1A1F2B] text-xs overflow-auto max-h-32">
                      {JSON.stringify(data.hiringConfidenceComposite.breakdown as object, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ) : (
                <p className="text-grey-medium dark:text-gray-400">No hiring confidence data</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
