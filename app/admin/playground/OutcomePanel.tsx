"use client";

import type { Snapshot } from "@/lib/trust/types";
import { INDUSTRY_THRESHOLDS } from "@/lib/industries";
import { industryLabel } from "@/lib/industries";
import type { Industry } from "@/lib/industries";

type Props = {
  snapshot: Snapshot;
  industry: Industry;
  /** Optional financial exposure (from ROI) when available. */
  financialExposure?: number | null;
  /** Optional last explanation (action summary or "Live from profile"). */
  lastExplanation?: string | null;
};

export function OutcomePanel({ snapshot, industry, financialExposure, lastExplanation }: Props) {
  const out = snapshot.engineOutputs;
  const threshold = INDUSTRY_THRESHOLDS[industry];
  const trustScore = out?.trustScore ?? snapshot.trustScore ?? 0;
  const confidenceScore = out?.confidenceScore ?? snapshot.confidenceScore ?? 0;
  const fragilityScore = out?.fragilityScore ?? 0;
  const trustDebt = out?.trustDebt ?? 0;
  const passesThreshold = trustScore >= threshold;
  const complianceLabel = passesThreshold ? "SAFE" : "AT RISK";
  const fragilityLabel = fragilityScore > 70 ? "HIGH" : fragilityScore > 40 ? "MEDIUM" : "LOW";
  const riskFlags: string[] = [];
  if (trustScore < threshold) riskFlags.push("Below hiring threshold");
  if (fragilityScore > 70) riskFlags.push("High fragility");
  if (trustDebt > 50) riskFlags.push("Elevated trust debt");
  if ((out?.riskScore ?? 0) > 60) riskFlags.push("Elevated risk score");
  const riskFlagsLabel = riskFlags.length === 0 ? "None" : riskFlags.join("; ");
  const exposureLabel = financialExposure != null && financialExposure > 0
    ? `$${financialExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "$0";

  return (
    <div className="sticky top-4 self-start rounded-xl border-2 border-slate-200 bg-slate-50/95 p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Outcome Panel</h2>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-amber-100 px-2 py-0.5 rounded">
          SIMULATED
        </span>
      </div>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Trust Score</dt>
          <dd className="font-bold tabular-nums text-slate-900">{trustScore}</dd>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Confidence</dt>
          <dd className="font-bold tabular-nums text-slate-900">{confidenceScore}</dd>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Compliance</dt>
          <dd className={`font-semibold ${passesThreshold ? "text-emerald-700" : "text-red-700"}`}>
            {complianceLabel}
          </dd>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Fragility</dt>
          <dd className={`font-semibold ${
            fragilityLabel === "HIGH" ? "text-amber-700" :
            fragilityLabel === "MEDIUM" ? "text-amber-600" : "text-slate-700"
          }`}>
            {fragilityLabel}
          </dd>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Trust Debt</dt>
          <dd className="font-bold tabular-nums text-slate-900">{trustDebt}</dd>
        </div>
        <div className="flex justify-between items-baseline gap-2">
          <dt className="text-slate-600">Risk Flags</dt>
          <dd className="text-slate-800 text-right max-w-[60%]">{riskFlagsLabel}</dd>
        </div>
        <div className="flex justify-between items-baseline gap-2 border-t border-slate-200 pt-2">
          <dt className="text-slate-600">Est. Exposure</dt>
          <dd className="font-bold tabular-nums text-slate-900">{exposureLabel}</dd>
        </div>
        {lastExplanation != null && lastExplanation !== "" && (
          <div className="border-t border-slate-200 pt-2">
            <dt className="text-slate-600 text-xs font-medium mb-0.5">Last explanation</dt>
            <dd className="text-slate-700 text-xs leading-snug">{lastExplanation}</dd>
          </div>
        )}
      </dl>

      <p className="text-xs text-slate-500">
        Threshold: {threshold} ({industryLabel(industry)}). Live from current profile.
      </p>
    </div>
  );
}
