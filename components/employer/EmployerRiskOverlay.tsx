"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePreview } from "@/lib/preview-context";
import { applyRiskOverride } from "@/lib/risk-engine";
import type { EmployerCandidateRiskResponse } from "@/app/api/employer/candidate-risk/route";

const CAREER_SECTIONS: {
  key: keyof EmployerCandidateRiskResponse;
  title: string;
  explanation: string;
}[] = [
  { key: "employmentStability", title: "Employment Stability", explanation: "Based on average tenure length." },
  { key: "referenceStrength", title: "Reference Strength", explanation: "Based on reference response rate." },
  { key: "documentationCompleteness", title: "Documentation Completeness", explanation: "Verified positions vs total." },
  { key: "credentialValidation", title: "Credential Validation", explanation: "Verified certifications on file." },
  { key: "disputeResolutionHistory", title: "Dispute Resolution History", explanation: "Resolved vs unresolved disputes." },
];

const EMPLOYER_ONLY_SECTIONS: {
  key: keyof EmployerCandidateRiskResponse;
  title: string;
  explanation: string;
}[] = [
  { key: "rehireLikelihoodIndex", title: "Rehire Likelihood Index", explanation: "Indication of rehire eligibility." },
  { key: "referenceVelocityMetric", title: "Reference Velocity", explanation: "Pace of reference responses." },
  { key: "riskFlagIndicator", title: "Data Integrity Check", explanation: "Composite integrity indicator (higher = stronger)." },
  { key: "networkDensityScore", title: "Network Density Score", explanation: "Reference network coverage." },
];

function barColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-slate-400 dark:bg-slate-500";
  return "bg-slate-300 dark:bg-slate-600";
}

export function EmployerRiskOverlay({ candidateId }: { candidateId: string }) {
  const [data, setData] = useState<EmployerCandidateRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { preview } = usePreview();

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/employer/candidate-risk?candidateId=${encodeURIComponent(candidateId)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: EmployerCandidateRiskResponse) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [candidateId]);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Risk &amp; Verification Overview</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Profile Strength &amp; Data Integrity</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error ? "Unable to load metrics. Try again later." : "No metrics available for this candidate."}
        </p>
      </div>
    );
  }

  const riskOverride = preview?.previewSimulationData?.riskOverride;
  const riskFlagDisplay =
    typeof riskOverride === "number" && Number.isFinite(riskOverride)
      ? applyRiskOverride(data.riskFlagIndicator, riskOverride)
      : data.riskFlagIndicator;

  const renderRow = (key: keyof EmployerCandidateRiskResponse, title: string, explanation: string, value: number) => (
    <li key={key} className="border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 dark:text-slate-200">{title}</span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{value}/100</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", barColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{explanation}</p>
    </li>
  );

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Profile Strength &amp; Data Integrity</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Employer-only metrics. Not visible to the candidate.
        </p>

      <h3 className="mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Career Health</h3>
      <ul className="mt-3 space-y-4">
        {CAREER_SECTIONS.map(({ key, title, explanation }) =>
          renderRow(key, title, explanation, data[key] as number)
        )}
      </ul>

      <h3 className="mt-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Employer Intelligence</h3>
      <ul className="mt-3 space-y-4">
        {EMPLOYER_ONLY_SECTIONS.map(({ key, title, explanation }) => {
          const value = key === "riskFlagIndicator" ? riskFlagDisplay : (data[key] as number);
          return renderRow(key, title, explanation, value);
        })}
      </ul>

      {/* Fraud cluster: hidden label, numeric only - show as neutral "Verification confidence" */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Verification confidence</span>
          <span className="text-sm tabular-nums text-slate-700 dark:text-slate-300">{data.fraudClusterConfidence}</span>
        </div>
      </div>
    </div>
  );
}

export default EmployerRiskOverlay;
