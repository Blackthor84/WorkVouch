"use client";

import { useState, useEffect } from "react";
import {
  computeROI,
  getDefaultAssumptions,
  type ROIEngineInputs,
  type ROIAssumptions,
  type ROIEngineResult,
  type ROICounterfactualResult,
} from "@/lib/roi/ROICalculatorEngine";
import type { Snapshot } from "@/lib/trust/types";

function ResultBlock({
  title,
  result,
  highlight,
}: {
  title: string;
  result: ROIEngineResult;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">{title}</div>
      <div className="text-lg font-bold text-slate-900 tabular-nums">
        ${result.totalEstimatedExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      {result.populationAffected != null && (
        <div className="text-xs text-slate-600 mt-0.5">Population affected: {result.populationAffected}</div>
      )}
      {result.breakdown.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {result.breakdown.map((item) => (
            <li key={item.category}>
              <div className="flex justify-between">
                <span className="text-slate-600">{item.category}</span>
                <span className="font-mono tabular-nums">${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              {item.triggerDescription && (
                <div className="text-slate-500 mt-0.5">Trigger: {item.triggerDescription}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Props = {
  snapshot: Snapshot;
  inputs: ROIEngineInputs;
  assumptions: ROIAssumptions;
  canEdit: boolean;
  onAssumptionsChange?: (assumptions: ROIAssumptions) => void;
  /** When provided, show side-by-side With/Without WorkVouch and avoided loss. */
  comparison?: ROICounterfactualResult | null;
};

export function ROIPanel({ snapshot, inputs, assumptions, canEdit, onAssumptionsChange, comparison }: Props) {
  const [localAssumptions, setLocalAssumptions] = useState<ROIAssumptions>(assumptions);
  useEffect(() => setLocalAssumptions(assumptions), [assumptions]);
  const effectiveAssumptions = canEdit ? localAssumptions : assumptions;
  const outputs = snapshot.engineOutputs
    ? {
        trustScore: snapshot.trustScore ?? snapshot.engineOutputs.trustScore,
        complianceScore: snapshot.engineOutputs.complianceScore,
        fragilityScore: snapshot.engineOutputs.fragilityScore,
        trustDebt: snapshot.engineOutputs.trustDebt,
      }
    : null;

  const withResult = comparison ? comparison.withWorkVouch : computeROI(inputs, effectiveAssumptions, outputs);
  const showCounterfactual = comparison != null;

  const handleChange = (updates: Partial<ROIAssumptions>) => {
    const next = { ...localAssumptions, ...updates };
    setLocalAssumptions(next);
    onAssumptionsChange?.(next);
  };

  const noMaterialRisk = !withResult.hasMaterialRisk && (!comparison || !comparison.withoutWorkVouch.hasMaterialRisk);

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-4"
      aria-label="ROI — estimated financial impact and counterfactual comparison"
    >
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Financial impact (ROI)</h3>
      <p className="text-xs text-slate-600 mb-3">
        Estimates based on simulation outputs. Not a guarantee of actual loss. All figures watermarked SIMULATION.
      </p>

      {noMaterialRisk ? (
        <p className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
          No significant financial exposure detected
        </p>
      ) : showCounterfactual && comparison ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <ResultBlock title="With WorkVouch" result={comparison.withWorkVouch} highlight />
            <ResultBlock title="Without WorkVouch" result={comparison.withoutWorkVouch} />
          </div>
          <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3 mb-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Avoided loss</div>
            <div className="text-xl font-bold text-emerald-900 tabular-nums">
              ${comparison.avoidedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-emerald-800 mt-2">
              This scenario shows an estimated ${comparison.avoidedLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} in avoided loss due to earlier detection, rewind, and intent modeling.
            </p>
            {(comparison.collapseDetectedWithAtStep != null || comparison.collapseDetectedWithoutAtStep != null) && (
              <p className="text-xs text-slate-600 mt-1">
                Collapse avoided at step {comparison.collapseDetectedWithAtStep ?? "—"} with WorkVouch; without WorkVouch, detected at step {comparison.collapseDetectedWithoutAtStep ?? "—"}. Population affected: {comparison.populationWith} vs {comparison.populationWithout}.
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="rounded-lg bg-slate-100 border border-slate-200 p-3 mb-3">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Total estimated exposure</div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              ${withResult.totalEstimatedExposure.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              Confidence band: <span className="font-medium">{withResult.confidence}</span> (low / expected / high) — expected value only
            </div>
          </div>
          <div className="space-y-3 mb-3">
            <h4 className="text-xs font-semibold text-slate-700">Line items (each tied to simulation)</h4>
            {withResult.breakdown.map((item) => (
              <div key={item.category} className="rounded border border-slate-200 bg-white p-3 text-sm">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-medium text-slate-800">{item.category}</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  <span className="font-medium">Formula:</span> {item.assumption}
                </div>
                {item.triggerDescription && (
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="font-medium">Trigger:</span> {item.triggerDescription}
                  </div>
                )}
                <div className="mt-1 text-xs">
                  <span className="text-slate-500">Confidence:</span>{" "}
                  <span className={item.confidence === "high" ? "text-emerald-600" : item.confidence === "medium" ? "text-amber-600" : "text-slate-600"}>
                    {item.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            No cost appears without a triggering simulation event. All figures are expected values; industry assumptions apply.
          </p>
        </>
      )}

      {canEdit && onAssumptionsChange && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Override assumptions (Enterprise)</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col">
              <span className="text-slate-600">Salary ($)</span>
              <input
                type="number"
                min={20000}
                max={500000}
                step={5000}
                value={effectiveAssumptions.salary}
                onChange={(e) => handleChange({ salary: Number(e.target.value) || effectiveAssumptions.salary })}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-600">Bad hire multiplier</span>
              <input
                type="number"
                min={0.3}
                max={2}
                step={0.1}
                value={effectiveAssumptions.badHireMultiplier}
                onChange={(e) => handleChange({ badHireMultiplier: Number(e.target.value) || effectiveAssumptions.badHireMultiplier })}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-600">Compliance probability</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={effectiveAssumptions.complianceProbability}
                onChange={(e) => handleChange({ complianceProbability: Number(e.target.value) || 0 })}
                className="border rounded px-2 py-1"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-slate-600">Duration (months)</span>
              <input
                type="number"
                min={1}
                max={24}
                value={effectiveAssumptions.durationMonths}
                onChange={(e) => handleChange({ durationMonths: Number(e.target.value) || 1 })}
                className="border rounded px-2 py-1"
              />
            </label>
          </div>
        </div>
      )}

      <details className="mt-3 text-xs text-slate-600" open>
        <summary className="cursor-pointer font-medium text-slate-700">Assumptions &amp; methodology</summary>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li><strong>Bad hire:</strong> count × salary × badHireMultiplier (trigger: force hire, trust collapse, or material risk)</li>
          <li><strong>Turnover:</strong> affected employees × salary × turnoverMultiplier (trigger: trust collapse elevates rate)</li>
          <li><strong>Compliance / regulatory risk:</strong> P × averageCompliancePenalty; P scaled by trust collapse, fragility, trust debt, overrides, population</li>
          <li><strong>Productivity loss:</strong> team size × salary × productivityLossRate × (durationMonths/12)</li>
          <li><strong>Reputation risk:</strong> expected value from industry low–high range when material risk present</li>
        </ul>
        <p className="mt-2">
          <strong>Confidence bands:</strong> low = wider range; medium = moderate certainty; high = tighter estimate. All outputs are watermarked SIMULATION. Conservative, documented defaults per industry.
        </p>
      </details>
    </section>
  );
}
