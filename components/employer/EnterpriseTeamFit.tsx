"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Breakdown = Record<string, number>;
type TeamFitRow = { alignment_score: number; breakdown?: Breakdown } | null;
type RiskRow = { overall_score: number; breakdown?: Breakdown } | null;
type NetworkRow = { density_score: number; fraud_confidence: number; breakdown?: Breakdown } | null;
type HiringRow = { composite_score: number; breakdown?: Breakdown } | null;

type TeamFitData = {
  teamFitSummary: TeamFitRow;
  riskBreakdown: RiskRow;
  networkOverview: NetworkRow;
  fraudIndicator: { fraudConfidence: number } | null;
  hiringConfidenceComposite: HiringRow;
};

interface EnterpriseTeamFitProps {
  candidateId: string;
  employerId?: string | null;
}

export function EnterpriseTeamFit({ candidateId, employerId }: EnterpriseTeamFitProps) {
  const [data, setData] = useState<TeamFitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    const params = new URLSearchParams({ candidateId });
    if (employerId) params.set("employerId", employerId);
    fetch(`/api/employer/team-fit?${params}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          setError("Unable to load team fit data");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        setData(json ?? null);
        setError(null);
      })
      .catch(() => setError("Request failed"))
      .finally(() => setLoading(false));
  }, [candidateId, employerId]);

  if (loading) return <div className="text-sm text-grey-medium dark:text-gray-400 animate-pulse">Loading team fit…</div>;
  if (error || !data) return <div className="text-sm text-grey-medium dark:text-gray-400">{error || "No team fit data available"}</div>;

  const teamFit = data.teamFitSummary;
  const risk = data.riskBreakdown;
  const network = data.networkOverview;
  const hiring = data.hiringConfidenceComposite;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Executive Summary</CardTitle></CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-grey-medium dark:text-gray-400">Alignment score</span>
              <p className="font-semibold text-grey-dark dark:text-gray-200">{teamFit?.alignment_score ?? "—"}</p>
            </div>
            <div>
              <span className="text-grey-medium dark:text-gray-400">Hiring confidence</span>
              <p className="font-semibold text-grey-dark dark:text-gray-200">{hiring?.composite_score ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Alignment Breakdown</CardTitle></CardHeader>
        <CardContent>
          {teamFit?.breakdown && Object.keys(teamFit.breakdown).length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(teamFit.breakdown).map(([key, value]) => (
                  <tr key={key} className="border-b border-grey-background dark:border-[#374151]">
                    <td className="py-2 text-grey-medium dark:text-gray-400">{key}</td>
                    <td className="py-2 font-medium text-grey-dark dark:text-gray-200 text-right">{typeof value === "number" ? value.toFixed(2) : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-grey-medium dark:text-gray-400 text-sm">No alignment breakdown</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Environment Compatibility</CardTitle></CardHeader>
        <CardContent className="text-sm text-grey-medium dark:text-gray-400">
          Based on team baseline and candidate metrics. Alignment score reflects fit vs current workforce profile.
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Risk Delta</CardTitle></CardHeader>
        <CardContent>
          {risk?.breakdown && Object.keys(risk.breakdown).length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-grey-background dark:border-[#374151]">
                  <td className="py-2 text-grey-medium dark:text-gray-400">Overall</td>
                  <td className="py-2 font-medium text-grey-dark dark:text-gray-200 text-right">{risk.overall_score}</td>
                </tr>
                {Object.entries(risk.breakdown).map(([key, value]) => (
                  <tr key={key} className="border-b border-grey-background dark:border-[#374151]">
                    <td className="py-2 text-grey-medium dark:text-gray-400">{key}</td>
                    <td className="py-2 font-medium text-grey-dark dark:text-gray-200 text-right">{typeof value === "number" ? value.toFixed(2) : String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-grey-medium dark:text-gray-400 text-sm">No risk breakdown</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Network Integrity</CardTitle></CardHeader>
        <CardContent>
          {network ? (
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-grey-medium dark:text-gray-400">Density score</span>
                <span className="font-medium text-grey-dark dark:text-gray-200">{network.density_score}</span>
              </div>
              {network.breakdown && Object.entries(network.breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between py-1">
                  <span className="text-grey-medium dark:text-gray-400">{key}</span>
                  <span className="font-medium text-grey-dark dark:text-gray-200">{typeof value === "number" ? value.toFixed(4) : String(value)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-grey-medium dark:text-gray-400 text-sm">No network data</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Hiring Confidence</CardTitle></CardHeader>
        <CardContent>
          {hiring ? (
            <div className="text-sm">
              <p className="font-semibold text-grey-dark dark:text-gray-200">Composite score: {hiring.composite_score}</p>
              {hiring.breakdown && Object.keys(hiring.breakdown).length > 0 && (
                <table className="w-full mt-2 text-sm">
                  <tbody>
                    {Object.entries(hiring.breakdown).map(([key, value]) => (
                      <tr key={key} className="border-b border-grey-background dark:border-[#374151]">
                        <td className="py-1 text-grey-medium dark:text-gray-400">{key}</td>
                        <td className="py-1 font-medium text-grey-dark dark:text-gray-200 text-right">{typeof value === "number" ? value.toFixed(2) : String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p className="text-grey-medium dark:text-gray-400 text-sm">No hiring confidence data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
