"use client";

import { useState, useCallback } from "react";
import { PermissionGate } from "@/components/PermissionGate";
import { EmployeeInspector } from "./EmployeeInspector";
import { MassSimulationPanel } from "./MassSimulationPanel";
import { SimulationPanel } from "./SimulationPanel";
import { ExecDashboard } from "./ExecDashboard";
import { mockEmployees } from "@/lib/employees/mock";
import { saveScenario } from "@/lib/scenarios/saveScenario";
import { loadScenarios } from "@/lib/scenarios/loadScenario";
import { exportCSV, scenarioReport } from "@/lib/exports/exportCSV";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { useSimulation } from "@/lib/trust/useSimulation";
import { simulateTrust } from "@/lib/trust/simulator";
import { Toast } from "@/components/Toast";
import { ScenarioComparison } from "./ScenarioComparison";
import { TrustChart } from "./TrustChart";
import {
  PAGE,
  SCENARIO_CONTROLS,
  AUDIT_LOG,
  COMPLIANCE,
  FLAGSHIP_DEMO_SCENARIO_NAME,
  DEMO_SCRIPT,
} from "@/lib/playground/copy";
import type { Industry } from "@/lib/industries";
import { INDUSTRY_THRESHOLDS } from "@/lib/industries";

export default function PlaygroundClient() {
  const sim = useSimulation();
  const [toast, setToast] = useState<string | null>(null);
  const [industry, setIndustry] = useState<Industry>("healthcare");
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<{ id: string; name: string }[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const threshold = INDUSTRY_THRESHOLDS[industry];

  const handleLoadScenarios = useCallback(async () => {
    try {
      const data = await loadScenarios();
      setSavedScenarios(
        (data ?? []).map((s: { id: string; name?: string }) => ({
          id: s.id,
          name: s.name ?? "Unnamed",
        }))
      );
    } catch (e) {
      console.warn("Load scenarios failed", e);
    }
  }, []);

  const handleSaveScenario = useCallback(async () => {
    if (!scenarioName.trim()) return;
    setSaveError(null);
    try {
      await saveScenario({
        name: scenarioName.trim(),
        industry,
        employeeIds: mockEmployees.map((e) => e.id),
        delta: sim.delta,
      });
      await logPlaygroundAudit("scenario_saved", {
        name: scenarioName.trim(),
        industry,
        employeeCount: mockEmployees.length,
      });
      setScenarioName("");
      handleLoadScenarios();
      setToast("Scenario persisted successfully");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    }
  }, [scenarioName, industry, sim.delta, handleLoadScenarios]);

  const handleCompareToCurrent = useCallback(() => {
    logPlaygroundAudit("compare_to_current", { scenarioName: scenarioName || null });
  }, [scenarioName]);

  const handleExportScenarioReport = useCallback(() => {
    const results = mockEmployees.map((e) => ({
      name: e.name,
      before: e.trust,
      after: simulateTrust(e.trust, {
        addedReviews: [
          { id: "export", source: "supervisor" as const, weight: 1, timestamp: Date.now() },
        ],
      }),
    }));
    const rows = scenarioReport({ name: scenarioName || "export" }, results);
    exportCSV(rows, "scenario-report.csv");
    logPlaygroundAudit("export_generated", { format: "csv", rowCount: rows.length });
  }, [scenarioName]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-8">
      {/* Page header — verbatim */}
      <header className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{PAGE.title}</h1>
        <p className="text-slate-600 mt-1">{PAGE.subtitle}</p>
        <p className="text-sm text-slate-500 mt-2">{PAGE.helperText}</p>
      </header>

      {/* 1. Employee Trust Profile */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Employee Trust Profile</h2>
          <p className="text-sm text-slate-600">
            Real trust state · Simulated changes · Outcome delta
          </p>
        </div>
        <PermissionGate perm="read">
          <div className="space-y-4">
            {mockEmployees.map((e) => (
              <EmployeeInspector key={e.id} employee={e} sim={sim} />
            ))}
          </div>
        </PermissionGate>
      </section>

      {/* 2. Scenario Controls */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{SCENARIO_CONTROLS.title}</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scenario name</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder={FLAGSHIP_DEMO_SCENARIO_NAME}
                className="border rounded px-3 py-2 text-sm w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                sim.saveSnapshot();
                setToast("Simulation snapshot saved");
              }}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Save Scenario Snapshot
            </button>
            <button
              type="button"
              onClick={handleSaveScenario}
              disabled={!scenarioName.trim()}
              className="rounded bg-slate-700 text-white px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {SCENARIO_CONTROLS.saveScenario}
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!scenarioName.trim()) return;
                setSaveError(null);
                try {
                  await saveScenario({
                    name: scenarioName.trim(),
                    industry,
                    employeeIds: mockEmployees.map((e) => e.id),
                    delta: sim.delta,
                  });
                  await logPlaygroundAudit("scenario_saved", {
                    name: scenarioName.trim(),
                    industry,
                    employeeCount: mockEmployees.length,
                  });
                  setScenarioName("");
                  handleLoadScenarios();
                  setToast("Scenario persisted successfully");
                } catch (e) {
                  setSaveError(e instanceof Error ? e.message : "Save failed");
                }
              }}
              disabled={!scenarioName.trim()}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Persist Scenario
            </button>
            <button
              type="button"
              onClick={() => {
                sim.reset();
                setToast("Simulation reset");
              }}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Reset Simulation
            </button>
            <button
              type="button"
              onClick={handleCompareToCurrent}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {SCENARIO_CONTROLS.compareToCurrent}
            </button>
            <button
              type="button"
              onClick={handleExportScenarioReport}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              {SCENARIO_CONTROLS.exportReport}
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-3">{SCENARIO_CONTROLS.helperText}</p>
          {saveError && <p className="text-sm text-red-600 mt-2">{saveError}</p>}
          {savedScenarios.length > 0 && (
            <ul className="mt-3 text-sm text-slate-600 list-disc list-inside">
              {savedScenarios.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleLoadScenarios}
              className="text-sm text-slate-600 underline hover:text-slate-800"
            >
              Load scenarios
            </button>
          </div>
        </div>
      </section>

      <ScenarioComparison history={sim.history} />
      <TrustChart history={sim.history} />

      {/* 3. Workforce Simulation */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Workforce Simulation</h2>
          <p className="text-sm text-slate-600">
            Department / role / org · Policy-level effects
          </p>
        </div>
        <PermissionGate perm="simulate">
          <SimulationPanel industry={industry} onIndustryChange={setIndustry} />
        </PermissionGate>
        <PermissionGate perm="mass_simulate">
          <MassSimulationPanel employees={mockEmployees} />
        </PermissionGate>
      </section>

      {/* 4. Culture & Compliance */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Culture & Compliance</h2>
          <p className="text-sm text-slate-600">Risk exposure · Threshold impact</p>
        </div>
        <PermissionGate perm="export">
          <ExecDashboard
            employees={mockEmployees.map((e) => ({
              before: e.trust,
              after: simulateTrust(e.trust, {
                addedReviews: [
                  {
                    id: "team",
                    source: "supervisor" as const,
                    weight: 1,
                    timestamp: Date.now(),
                  },
                ],
              }),
            }))}
            threshold={threshold}
          />
        </PermissionGate>
      </section>

      {/* 5. Audit Log */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">{AUDIT_LOG.title}</h2>
        <p className="text-sm text-slate-600">{AUDIT_LOG.subtext}</p>
      </section>

      {/* 6. Flagship demo (Healthcare Hiring Risk Simulation) */}
      <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Flagship demo: {FLAGSHIP_DEMO_SCENARIO_NAME}
        </summary>
        <p className="text-sm text-slate-600 mt-2">{DEMO_SCRIPT.setup}</p>
        <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
          <li>Step 1: &ldquo;{DEMO_SCRIPT.step1KeyLine}&rdquo;</li>
          <li>Step 4: &ldquo;{DEMO_SCRIPT.step4Closer}&rdquo;</li>
          <li>Step 5: &ldquo;{DEMO_SCRIPT.step5Close}&rdquo;</li>
        </ul>
      </details>

      {/* 7. Compliance messaging */}
      <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Compliance & positioning</h2>
        <ul className="space-y-3 text-sm text-slate-700">
          <li>
            <strong className="text-slate-900">Core:</strong> {COMPLIANCE.coreStatement}
          </li>
          <li>
            <strong className="text-slate-900">Data integrity:</strong> {COMPLIANCE.dataIntegrity}
          </li>
          <li>
            <strong className="text-slate-900">Auditability:</strong> {COMPLIANCE.auditability}
          </li>
          <li>
            <strong className="text-slate-900">Bias & fairness:</strong> {COMPLIANCE.biasFairness}
          </li>
          <li>
            <strong className="text-slate-900">Regulatory:</strong> {COMPLIANCE.regulatoryPositioning}
          </li>
        </ul>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
