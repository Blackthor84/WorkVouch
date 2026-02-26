"use client";

import { simulateTrust } from "@/lib/trust/simulator";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { exportCSV, scenarioReport } from "@/lib/exports/exportCSV";
import { WORKFORCE_SIMULATION } from "@/lib/playground/copy";
import type { TrustSnapshot } from "@/lib/trust/types";

type Employee = { id: string; name: string; trust: TrustSnapshot };

type Props = {
  employees: Employee[];
  onExportImpactReport?: () => void;
};

export function MassSimulationPanel({ employees, onExportImpactReport }: Props) {
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
  };

  const handlePolicyAdjustment = () => {
    logPlaygroundAudit("policy_adjustment", { employeeCount: employees.length });
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
    const rows = scenarioReport({ name: "workforce-impact" }, reportResults);
    exportCSV(rows, "workforce-impact-report.csv");
    logPlaygroundAudit("export_generated", { format: "csv", type: "workforce_impact", rowCount: rows.length });
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
