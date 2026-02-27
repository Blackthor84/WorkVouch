"use client";

import { useState, useCallback } from "react";
import { EmployeeInspector } from "./EmployeeInspector";
import { MassSimulationPanel } from "./MassSimulationPanel";
import { SimulationPanel } from "./SimulationPanel";
import { ExecDashboard } from "./ExecDashboard";
import { mockEmployees } from "@/lib/employees/mock";
import { loadScenarios } from "@/lib/scenarios/loadScenario";
import { exportCSV, scenarioReport } from "@/lib/client/exportCSV";
import { exportPDF } from "@/lib/client/exportPDF";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { useSimulation } from "@/lib/trust/useSimulation";
import { simulateTrust } from "@/lib/trust/simulator";
import { Toast } from "@/components/Toast";
import { ScenarioComparison } from "./ScenarioComparison";
import { TrustChart } from "./TrustChart";
import { ScenarioList } from "./ScenarioList";
import { ScenarioComparePanel } from "./ScenarioComparePanel";
import { ScenarioTimeline } from "./ScenarioTimeline";
import { Filters } from "./Filters";
import { TrustLabHelp } from "@/components/TrustLabHelp";
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
  const [showHelp, setShowHelp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [industry, setIndustry] = useState<Industry>("healthcare");
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [compareLeftId, setCompareLeftId] = useState<string>("");
  const [compareRightId, setCompareRightId] = useState<string>("");
  const compareLeft = compareLeftId === "" ? null : compareLeftId === "__current__" ? sim.delta : (savedScenarios.find((s) => s.id === compareLeftId)?.simulation_delta ?? savedScenarios.find((s) => s.id === compareLeftId)?.delta ?? null);
  const compareRight = compareRightId === "" ? null : compareRightId === "__current__" ? sim.delta : (savedScenarios.find((s) => s.id === compareRightId)?.simulation_delta ?? savedScenarios.find((s) => s.id === compareRightId)?.delta ?? null);
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const threshold = INDUSTRY_THRESHOLDS[industry];

  const departments = [...new Set(mockEmployees.map((e: { department?: string }) => e.department).filter(Boolean))] as string[];
  const roles = [...new Set(mockEmployees.map((e: { role?: string }) => e.role).filter(Boolean))] as string[];
  const filteredEmployees = mockEmployees.filter(
    (e: { department?: string; role?: string }) =>
      (!filterDept || e.department === filterDept) && (!filterRole || e.role === filterRole)
  );

  const normalizeDelta = useCallback((d: any) => ({
    addedReviews: d?.addedReviews ?? [],
    removedReviewIds: d?.removedReviewIds ?? [],
    thresholdOverride: d?.thresholdOverride,
  }), []);

  const handleLoadScenarios = useCallback(async () => {
    try {
      const data = await loadScenarios();
      setSavedScenarios(data ?? []);
    } catch (e) {
      console.warn("Load scenarios failed", e);
    }
  }, []);

  const handleSaveScenario = useCallback(async () => {
    if (!scenarioName.trim()) return;
    setSaveError(null);
    try {
      const res = await fetch("/api/playground/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenarioName.trim(),
          tags: [],
          industry,
          employeeIds: mockEmployees.map((e) => e.id),
          delta: sim.delta,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Save failed");
      }
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

  const handleReplayScenario = useCallback(
    (delta: unknown) => {
      sim.setDelta(normalizeDelta(delta));
      setToast("Scenario replayed");
    },
    [sim, normalizeDelta]
  );

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
      {/* Page header */}
      <header className="border-b border-slate-200 pb-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="text-2xl font-bold text-slate-900">Trust Simulation Lab</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert("Playground is interactive.")}
              className="rounded border border-amber-400 bg-amber-50 px-3 py-2 text-sm hover:bg-amber-100"
            >
              Debug
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            >
              How to Use
            </button>
          </div>
        </div>
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
        <div className="space-y-4">
          <Filters departments={departments} roles={roles} onFilter={(key, value) => (key === "dept" ? setFilterDept(value) : setFilterRole(value))} />
          {filteredEmployees.map((e) => (
            <EmployeeInspector key={e.id} employee={e} sim={sim} />
          ))}
        </div>
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

      {savedScenarios.length > 0 && (
        <section>
          <ScenarioList scenarios={savedScenarios} onLoad={handleReplayScenario} />
        </section>
      )}

      <ScenarioComparePanel
        left={compareLeft}
        right={compareRight}
      />
      <section className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Compare scenarios</label>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={compareLeftId} onChange={(e) => setCompareLeftId(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">— Scenario A —</option>
            <option value="__current__">Current</option>
            {savedScenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={compareRightId} onChange={(e) => setCompareRightId(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">— Scenario B —</option>
            <option value="__current__">Current</option>
            {savedScenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </section>

      <ScenarioTimeline history={sim.history} onSelect={(snapshot) => sim.setDelta(normalizeDelta(snapshot))} />

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
        <SimulationPanel industry={industry} onIndustryChange={setIndustry} />
        <MassSimulationPanel employees={mockEmployees} />
      </section>

      {/* 4. Culture & Compliance */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Culture & Compliance</h2>
          <p className="text-sm text-slate-600">Risk exposure · Threshold impact</p>
        </div>
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
                }
              ]}),
            }))}
            threshold={threshold}
          />
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

      <TrustLabHelp open={showHelp} onClose={() => setShowHelp(false)} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
