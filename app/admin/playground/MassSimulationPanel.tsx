"use client";

import { simulateTrust } from "@/lib/trust/simulator";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { exportCSV, scenarioReport, scenarioReportWithROI } from "@/lib/client/exportCSV";
import { WORKFORCE_SIMULATION } from "@/lib/playground/copy";
import type { TrustSnapshot } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import type { ROIEngineResult, ROICounterfactualResult } from "@/lib/roi/ROICalculatorEngine";

type Employee = { id: string; name: string; trust: TrustSnapshot };

type Props = {
  employees: Employee[];
  onExportImpactReport?: () => void;
  /** When provided, Run and Policy Adjustment commit a snapshot so the timeline advances. */
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
  /** When provided, workforce export includes ROI appendix (watermarked SIMULATION + methodology). */
  roiResult?: ROIEngineResult | null;
  /** When provided, export includes counterfactual comparison and avoided loss. */
  roiComparison?: ROICounterfactualResult | null;
  /** Industry for ROI export context (when ROI included). */
  industry?: string;
  /** When true, ROI export includes enterprise pricing reference (gated). */
  includeEnterprisePricing?: boolean;
};

export function MassSimulationPanel({ employees, onExportImpactReport, execute, roiResult, roiComparison, industry, includeEnterprisePricing }: Props) {
  const results = employees.map((e) =>
    simulateTrust(e.trust, {
      addedReviews: [
        {
          id: "mass",
          source: "supervisor",
          weight: 1,
          timestamp: Date.now(),
        },
      ],
    })
  );

  const avgTrust =
    results.length === 0
      ? 0
      : results.reduce((s, r) => s + r.trustScore, 0) / results.length;

  const handleRun = () => {
    logPlaygroundAudit("mass_simulation_run", { employeeCount: employees.length });
    if (execute) execute({ type: "bulk_delta", delta: { timestamp: Date.now(), notes: "Workforce simulation run" } });
  };

  const handlePolicyAdjustment = () => {
    logPlaygroundAudit("policy_adjustment", { employeeCount: employees.length });
    if (execute) execute({ type: "bulk_delta", delta: { timestamp: Date.now(), notes: "Policy adjustment" } });
  };

  const handleExportImpact = () => {
    const reportResults = employees.map((e) => ({
      name: e.name,
      before: e.trust,
      after: simulateTrust(e.trust, {
        addedReviews: [
          { id: "workforce", source: "supervisor", weight: 1, timestamp: Date.now() },
        ],
      }),
    }));
    const rows = roiResult != null
      ? scenarioReportWithROI({ name: "workforce-impact" }, reportResults, roiResult, roiComparison ?? undefined, industry, includeEnterprisePricing)
      : (scenarioReport({ name: "workforce-impact" }, reportResults) as Record<string, unknown>[]);
    exportCSV(rows, "workforce-impact-report.csv");
    logPlaygroundAudit("export_generated", { format: "csv", type: "workforce_impact", rowCount: rows.length, includesROI: roiResult != null });
    onExportImpactReport?.();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{WORKFORCE_SIMULATION.title}</h2>
      <p className="text-sm text-slate-600 mb-3">{WORKFORCE_SIMULATION.subtext}</p>
      <p className="text-sm text-slate-600 mb-3">
        Average trust after change: <strong>{avgTrust.toFixed(1)}</strong>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRun}
          className="rounded bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-800"
        >
          {WORKFORCE_SIMULATION.runSimulation}
        </button>
        <button
          type="button"
          onClick={handlePolicyAdjustment}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          {WORKFORCE_SIMULATION.applyPolicyAdjustment}
        </button>
        <button
          type="button"
          onClick={handleExportImpact}
          className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          {WORKFORCE_SIMULATION.exportImpactReport}
        </button>
      </div>
    </div>
  );
}
