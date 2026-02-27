"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { EmployeeInspector } from "./EmployeeInspector";
import { MassSimulationPanel } from "./MassSimulationPanel";
import { SimulationPanel } from "./SimulationPanel";
import { ExecDashboard } from "./ExecDashboard";
import { mockEmployees } from "@/lib/employees/mock";
import { loadScenarios } from "@/lib/scenarios/loadScenario";
import { exportCSV, scenarioReport } from "@/lib/client/exportCSV";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { useSimulation } from "@/lib/trust/useSimulation";
import { useMultiverse } from "@/lib/trust/useMultiverse";
import { isMultiverseMode } from "@/lib/trust/multiverse";
import { simulateTrust } from "@/lib/trust/simulator";
import { Toast } from "@/components/Toast";
import { ScenarioComparison } from "./ScenarioComparison";
import { TrustChart } from "./TrustChart";
import { ScenarioList } from "./ScenarioList";
import { ScenarioComparePanel } from "./ScenarioComparePanel";
import { ScenarioTimeline } from "./ScenarioTimeline";
import { Filters } from "./Filters";
import { TrustLabHelp } from "@/components/TrustLabHelp";
import { MultiverseHUD } from "./MultiverseHUD";
import { GodModeActions } from "./GodModeActions";
import { MultiverseGraph } from "./MultiverseGraph";
import { ChaosPresets } from "./ChaosPresets";
import { MultiverseLabPanel } from "./MultiverseLabPanel";
import {
  SCENARIO_CONTROLS,
  COMPLIANCE,
  FLAGSHIP_DEMO_SCENARIO_NAME,
  DEMO_SCRIPT,
} from "@/lib/playground/copy";
import type { Industry } from "@/lib/industries";
import { INDUSTRY_THRESHOLDS } from "@/lib/industries";
import type { SimulationDelta, Review } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";
import type { LabAuditEntry } from "./auditTypes";
import { AuditLogPanel } from "./AuditLogPanel";
import { LabDebugPanel } from "./LabDebugPanel";
import { SimulationDataBuilder } from "./SimulationDataBuilder";
import { PopulationSimulationTable, type PopulationEmployee } from "./PopulationSimulationTable";
import { GroupHiringSimulator } from "./GroupHiringSimulator";
import { DecisionTrainer } from "./DecisionTrainer";
import { SimulationCommandCenter, explainAction, engineDeltas } from "./SimulationCommandCenter";
import { CommandStrip } from "./CommandStrip";
import { CommandSummarySheet } from "./CommandSummarySheet";
import { ActionRail, type RailMode } from "./ActionRail";
import { ActionDock, type DockMode } from "./ActionDock";
import { MobileModeSheet } from "./MobileModeSheet";
import { DeepDiveDrawer } from "./DeepDiveDrawer";
import { DeepDiveSwipeSheet } from "./DeepDiveSwipeSheet";
import { LabCanvas } from "./LabCanvas";
import { useBreakpoint } from "@/lib/playground/useBreakpoint";
import { isEnterprise, canFork, canMerge, canDestroyUniverse, canTriggerGodMode, canFullGroupHiring } from "@/lib/playground/enterpriseGate";

export default function PlaygroundClient() {
  const { role } = useAuth();
  const multiverseMode = isMultiverseMode(role);
  const simBase = useSimulation();
  const multiverse = useMultiverse();
  const sim = multiverseMode ? multiverse : simBase;
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isDesktop = breakpoint === "desktop";
  const enterprise = isEnterprise(role);

  const [showHelp, setShowHelp] = useState(false);
  const [railMode, setRailMode] = useState<RailMode>("reality");
  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [dockMode, setDockMode] = useState<DockMode | null>(null);
  const [lastActionPulse, setLastActionPulse] = useState(false);
  const [godModeUsed, setGodModeUsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<LabAuditEntry[]>([]);
  const [lastAction, setLastAction] = useState<SimulationAction | null>(null);
  const [lastDelta, setLastDelta] = useState<SimulationDelta | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setToast((e as CustomEvent).detail ?? "Done");
    window.addEventListener("playground-toast", handler);
    return () => window.removeEventListener("playground-toast", handler);
  }, []);

  useEffect(() => {
    if (lastAction) {
      setLastActionPulse(true);
      const t = setTimeout(() => setLastActionPulse(false), 700);
      return () => clearTimeout(t);
    }
  }, [lastAction?.type]);

  useEffect(() => {
    if (lastAction && isMobile && dockMode) setDockMode(null);
  }, [lastAction, isMobile, dockMode]);
  const [industry, setIndustry] = useState<Industry>("healthcare");
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<{ id: string; name: string; delta?: unknown; simulation_delta?: unknown; tags?: string[] }[]>([]);
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

  const normalizeDelta = useCallback((d: unknown): SimulationDelta => {
    const x = d as Record<string, unknown> | null | undefined;
    return {
      addedReviews: (Array.isArray(x?.addedReviews) ? x.addedReviews : []) as Review[],
      removedReviewIds: Array.isArray(x?.removedReviewIds) ? (x.removedReviewIds as string[]) : [],
      thresholdOverride: typeof x?.thresholdOverride === "number" ? x.thresholdOverride : undefined,
    };
  }, []);

  const executeWithAudit = useCallback(
    (action: SimulationAction): boolean | { ok: boolean } => {
      const beforeSnapshotId = `${sim.snapshot.timestamp}-${sim.snapshot.reviews.length}`;
      const result = executeAction(sim, action);
      if (result.ok) {
        setLastAction(action);
        if (result.delta) setLastDelta(result.delta);
        const afterSnapshotId = result.delta
          ? `${result.delta.timestamp ?? Date.now()}-${sim.snapshot.reviews.length + (result.delta.addedReviews?.length ?? 0) - (result.delta.removedReviewIds?.length ?? 0)}`
          : undefined;
        setAuditEntries((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            action: action.type,
            actor: "user",
            timestamp: new Date().toISOString(),
            universeId: multiverseMode && (multiverse as { activeUniverseId?: string | null }).activeUniverseId != null ? (multiverse as { activeUniverseId: string | null }).activeUniverseId : null,
            beforeSnapshotId,
            afterSnapshotId,
            notes: result.delta?.metadata?.notes ?? ("notes" in action ? (action as { notes?: string }).notes : undefined),
          },
        ]);
      }
      return result;
    },
    [sim, multiverseMode, multiverse]
  );

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
      executeWithAudit({ type: "replay_scenario", delta: normalizeDelta(delta) });
      setToast("Scenario replayed");
    },
    [executeWithAudit, normalizeDelta]
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

  const godMode = role === "superadmin";

  const currentStep = multiverseMode
    ? (multiverse as { timelineStepIndex?: number }).timelineStepIndex ?? 0
    : (simBase as { currentIndex?: number }).currentIndex ?? 0;

  const universeContext = multiverseMode && "activeUniverse" in multiverse && (multiverse as { activeUniverse?: { name: string; id: string; meta?: { divergenceFromRoot?: number; instability?: number } } }).activeUniverse
    ? {
        name: (multiverse as { activeUniverse: { name: string } }).activeUniverse.name,
        id: (multiverse as { activeUniverseId: string | null }).activeUniverseId,
        divergencePercent: (multiverse as { activeUniverse: { meta?: { divergenceFromRoot?: number } } }).activeUniverse.meta?.divergenceFromRoot ?? null,
        instability: (multiverse as { activeUniverse: { meta?: { instability?: number } } }).activeUniverse.meta?.instability ?? null,
      }
    : null;

  const noEffectReason =
    lastDelta?.metadata?.notes?.startsWith("No effect") === true ? lastDelta.metadata.notes : null;

  const populationImpact =
    filteredEmployees.length > 1
      ? (() => {
          const results = filteredEmployees.map((e) =>
            simulateTrust(e.trust, sim.delta ?? undefined)
          );
          const avgTrust = results.length
            ? results.reduce((s, r) => s + r.trustScore, 0) / results.length
            : 0;
          return { avgTrust: Math.round(avgTrust * 10) / 10, riskDelta: 0, fragility: sim.snapshot?.engineOutputs?.fragilityScore ?? 0 };
        })()
      : null;

  const lastActionLabel = lastAction
    ? (() => {
        const t = lastAction.type;
        if (t === "save_snapshot") return "Save snapshot";
        if (t === "replay_scenario") return "Replay scenario";
        if (t === "add_review" || t === "add_signal") return "Add signal";
        if (t === "reset") return "Reset";
        return t.replace(/_/g, " ");
      })()
    : "—";

  const prevSnapshot = currentStep > 0 ? sim.history[currentStep - 1] : undefined;
  const prevOutputs = prevSnapshot?.engineOutputs;
  const currOutputs = sim.snapshot.engineOutputs;
  const summaryExplanation = noEffectReason ?? explainAction(lastAction, lastDelta, prevOutputs, currOutputs ?? undefined);
  const summaryDeltas = currOutputs && prevOutputs ? engineDeltas(prevOutputs, currOutputs) : [];

  const universeIdForDrawer =
    multiverseMode && "activeUniverseId" in multiverse
      ? (multiverse as { activeUniverseId: string | null }).activeUniverseId ?? null
      : null;

  const sccProps = {
    snapshot: sim.snapshot,
    history: sim.history,
    currentStep,
    onTimelineStep: sim.setTimelineStep,
    lastAction,
    lastDelta,
    universeContext,
    multiverseMode,
    populationImpact,
    noEffectReason,
  };

  const railModeContent: Record<RailMode, React.ReactNode> = {
    reality: (
      <div className="space-y-3">
        <p className="text-xs text-slate-600">Filter employees by department and role.</p>
        <Filters
          departments={departments}
          roles={roles}
          onFilter={(key, value) => (key === "dept" ? setFilterDept(value) : setFilterRole(value))}
          selectedDept={filterDept}
          selectedRole={filterRole}
        />
      </div>
    ),
    decisions: (
      <div className="space-y-3">
        {(multiverseMode || godMode) ? (
          <DecisionTrainer sim={sim} execute={executeWithAudit} />
        ) : (
          <p className="text-sm text-slate-600">Enable multiverse or god mode for Decision Trainer.</p>
        )}
      </div>
    ),
    signals: (
      <div className="space-y-3">
        <SimulationPanel industry={industry} onIndustryChange={setIndustry} />
        <SimulationDataBuilder />
      </div>
    ),
    scenarios: (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Scenario name</label>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder={FLAGSHIP_DEMO_SCENARIO_NAME}
          className="border rounded px-3 py-2 text-sm w-full"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              executeWithAudit({ type: "save_snapshot" });
              setToast("Simulation snapshot saved");
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Save Snapshot
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
            Reset
          </button>
          <button type="button" onClick={handleCompareToCurrent} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            {SCENARIO_CONTROLS.compareToCurrent}
          </button>
          <button type="button" onClick={handleExportScenarioReport} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
            {SCENARIO_CONTROLS.exportReport}
          </button>
        </div>
        <button type="button" onClick={handleLoadScenarios} className="text-sm text-slate-600 underline hover:text-slate-800">
          Load scenarios
        </button>
        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {savedScenarios.length > 0 && (
          <ScenarioList scenarios={savedScenarios} onLoad={handleReplayScenario} />
        )}
        <details className="rounded border border-slate-200 p-2">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Flagship demo: {FLAGSHIP_DEMO_SCENARIO_NAME}</summary>
          <p className="text-xs text-slate-600 mt-2">{DEMO_SCRIPT.setup}</p>
          <ul className="mt-1 text-xs text-slate-600 list-disc list-inside">
            <li>{DEMO_SCRIPT.step1KeyLine}</li>
            <li>{DEMO_SCRIPT.step4Closer}</li>
            <li>{DEMO_SCRIPT.step5Close}</li>
          </ul>
        </details>
        <div className="space-y-2 pt-2">
          <label className="block text-sm font-medium text-slate-700">Compare</label>
          <select value={compareLeftId} onChange={(e) => setCompareLeftId(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full">
            <option value="">— A —</option>
            <option value="__current__">Current</option>
            {savedScenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={compareRightId} onChange={(e) => setCompareRightId(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full">
            <option value="">— B —</option>
            <option value="__current__">Current</option>
            {savedScenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    ),
    populations: (
      <div className="space-y-3">
        <SimulationPanel industry={industry} onIndustryChange={setIndustry} />
        <MassSimulationPanel employees={mockEmployees} execute={executeWithAudit} />
        {(multiverseMode || godMode) && (
          <>
            {canFullGroupHiring(role) ? (
              <GroupHiringSimulator sim={sim} execute={executeWithAudit} />
            ) : (
              <p className="text-xs text-slate-600 rounded bg-slate-50 p-2">Group hiring — preview. Full control is an Enterprise feature.</p>
            )}
          </>
        )}
      </div>
    ),
    adversarial: (
      <div className="space-y-3">
        {multiverseMode ? (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Universe</label>
              <select
                value={multiverse.activeUniverseId ?? ""}
                onChange={(e) => multiverse.setActiveUniverseId(e.target.value || null)}
                className="border rounded px-2 py-1.5 text-sm w-full"
              >
                {multiverse.universes.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-600">Compare alternate realities — Enterprise for Fork/Merge/Destroy.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={multiverse.fork} disabled={!canFork(role)} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed" title={!canFork(role) ? "Enterprise feature" : undefined}>Fork</button>
              <select
                className="border rounded px-2 py-1.5 text-sm"
                defaultValue=""
                disabled={!canMerge(role)}
                onChange={(e) => {
                  const fromId = e.target.value;
                  e.target.value = "";
                  if (fromId && multiverse.activeUniverseId && confirm("Merge will replace the current universe timeline. Continue?")) {
                    multiverse.merge(multiverse.activeUniverseId, fromId);
                  }
                }}
              >
                <option value="">Merge from…</option>
                {multiverse.universes.filter((u) => u.id !== multiverse.activeUniverseId).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => multiverse.universes.length > 1 && multiverse.destroy(multiverse.activeUniverseId!)} disabled={multiverse.universes.length <= 1 || !canDestroyUniverse(role)} className="rounded border border-red-200 px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed" title={!canDestroyUniverse(role) ? "Enterprise feature" : undefined}>Destroy current</button>
            </div>
            {canTriggerGodMode(role) ? (
              <>
                <GodModeActions sim={multiverse} onAction={() => setGodModeUsed(true)} execute={executeWithAudit} />
                <ChaosPresets sim={multiverse} onOutcome={(name, msg) => { setGodModeUsed(true); setToast(`${name}: ${msg}`); }} execute={executeWithAudit} />
              </>
            ) : (
              <p className="text-xs text-slate-600 rounded bg-amber-50 border border-amber-200 p-2">What would happen if… — view outcomes. Triggering is an Enterprise feature.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">Enable multiverse for adversarial controls.</p>
        )}
      </div>
    ),
  };

  const complianceSection = (
    <details className="rounded-lg border border-slate-200 bg-white p-3 mt-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900">Compliance & positioning</summary>
      <ul className="space-y-2 text-xs text-slate-700 mt-2">
        <li><strong>Core:</strong> {COMPLIANCE.coreStatement}</li>
        <li><strong>Data integrity:</strong> {COMPLIANCE.dataIntegrity}</li>
        <li><strong>Auditability:</strong> {COMPLIANCE.auditability}</li>
        <li><strong>Bias & fairness:</strong> {COMPLIANCE.biasFairness}</li>
        <li><strong>Regulatory:</strong> {COMPLIANCE.regulatoryPositioning}</li>
      </ul>
    </details>
  );

  const populationEmployees: PopulationEmployee[] = mockEmployees.map(
    (e: { id: string; name: string; department?: string; role?: string; trust: { trustScore: number; confidenceScore: number; reviews?: unknown[] } }) => ({
      id: e.id,
      name: e.name,
      role: e.role,
      department: e.department,
      trustScore: e.trust.trustScore,
      confidenceScore: e.trust.confidenceScore,
      reviewCount: Array.isArray(e.trust.reviews) ? e.trust.reviews.length : 0,
    })
  );

  const canvasModeContent: Record<RailMode, React.ReactNode> = {
    reality: (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">Employee Trust Profile</h3>
        <p className="text-xs text-slate-600">Real trust state · Simulated changes · Outcome delta</p>
        <div className="space-y-4">
          {filteredEmployees.map((e) => (
            <EmployeeInspector key={e.id} employee={e} sim={sim} execute={executeWithAudit} />
          ))}
        </div>
      </div>
    ),
    decisions: (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Use the Decision Trainer in the rail. Outcomes appear in the Command Center above.</p>
      </div>
    ),
    signals: (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Add signals and build data in the rail. Results update in the Command Center above.</p>
      </div>
    ),
    scenarios: (
      <div className="space-y-4">
        <ScenarioComparePanel left={compareLeft} right={compareRight} />
        <ScenarioTimeline history={sim.history} onSelect={(snapshot) => sim.setSnapshot(snapshot)} />
        <ScenarioComparison history={sim.history} />
        {multiverseMode ? (
          <MultiverseGraph
            universes={multiverse.universes}
            activeUniverseId={multiverse.activeUniverseId}
            onSelectUniverse={multiverse.setActiveUniverseId}
            onScrubTimeline={multiverse.setTimelineStep != null ? (_id, step) => multiverse.setTimelineStep(step) : undefined}
            history={sim.history}
            hasDistortion={godModeUsed}
          />
        ) : (
          <TrustChart history={sim.history} />
        )}
      </div>
    ),
    populations: (
      <div className="space-y-4">
        <PopulationSimulationTable employees={populationEmployees} />
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Culture & Compliance</h3>
          <p className="text-xs text-slate-600 mb-2">Risk exposure · Threshold impact</p>
          <ExecDashboard
            employees={mockEmployees.map((e) => ({
              before: e.trust,
              after: simulateTrust(e.trust, {
                addedReviews: [{ id: "team", source: "supervisor" as const, weight: 1, timestamp: Date.now() }],
              }),
            }))}
            threshold={threshold}
          />
        </div>
      </div>
    ),
    adversarial: (
      <div className="space-y-4">
        {multiverseMode ? (
          <MultiverseGraph
            universes={multiverse.universes}
            activeUniverseId={multiverse.activeUniverseId}
            onSelectUniverse={multiverse.setActiveUniverseId}
            onScrubTimeline={multiverse.setTimelineStep != null ? (_id, step) => multiverse.setTimelineStep(step) : undefined}
            history={sim.history}
            hasDistortion={godModeUsed}
          />
        ) : (
          <p className="text-sm text-slate-600">Enable multiverse to see the graph.</p>
        )}
      </div>
    ),
  };

  const dockSheetContent: Record<DockMode, React.ReactNode> = {
    reality: railModeContent.reality,
    decide: railModeContent.decisions,
    signals: railModeContent.signals,
    scenarios: railModeContent.scenarios,
    more: (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Populations</h3>
          {railModeContent.populations}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Adversarial</h3>
          {railModeContent.adversarial}
        </div>
      </div>
    ),
  };

  const dockTitles: Record<DockMode, string> = {
    reality: "Reality",
    decide: "Decide",
    signals: "Signals",
    scenarios: "Scenarios",
    more: "More",
  };

  return (
    <div className={multiverseMode || godMode ? "pt-12" : ""}>
      {multiverseMode && <MultiverseHUD />}
      {godMode && <MultiverseLabPanel role={role} />}

      {/* Mobile: strip (fixed) + full-screen canvas + bottom dock; tap strip → Command Summary Sheet */}
      {isMobile && (
        <>
          <CommandStrip
            snapshot={sim.snapshot}
            currentStep={currentStep}
            historyLength={sim.history.length}
            lastActionLabel={lastActionLabel}
            universeContext={universeContext}
            multiverseMode={multiverseMode}
            variant="mobile"
            onTap={() => setShowSummarySheet(true)}
            lastActionPulse={lastActionPulse}
          />
          <main className="flex flex-col flex-1 min-h-0 pt-12 pb-20 overflow-auto">
            <div className="flex flex-col gap-4 p-4">
              <SimulationCommandCenter {...sccProps} showDeltaInspector={false} />
            </div>
          </main>
          <ActionDock activeMode={dockMode} onModeOpen={setDockMode} onModeClose={() => setDockMode(null)} />
          {dockMode && (
            <MobileModeSheet
              mode={dockMode}
              title={dockTitles[dockMode]}
              onClose={() => setDockMode(null)}
            >
              {dockSheetContent[dockMode]}
            </MobileModeSheet>
          )}
          {showSummarySheet && (
            <CommandSummarySheet
              snapshot={sim.snapshot}
              lastActionLabel={lastActionLabel}
              explanation={summaryExplanation}
              engineDeltas={summaryDeltas}
              universeContext={universeContext}
              currentStep={currentStep}
              historyLength={sim.history.length}
              onClose={() => setShowSummarySheet(false)}
            />
          )}
          <DeepDiveSwipeSheet
            lastAction={lastAction}
            lastDelta={lastDelta}
            lastEngineOutputs={sim.snapshot?.engineOutputs}
            snapshotCount={sim.history.length}
            universeId={universeIdForDrawer}
            auditEntries={auditEntries}
          />
        </>
      )}

      {/* Tablet: strip + rail (icon-first) + canvas; max 2 panes; deep drawer collapsed */}
      {isTablet && (
        <div className="flex flex-col h-[calc(100vh-3rem)] min-h-[600px]">
          <CommandStrip
            snapshot={sim.snapshot}
            currentStep={currentStep}
            historyLength={sim.history.length}
            lastActionLabel={lastActionLabel}
            universeContext={universeContext}
            multiverseMode={multiverseMode}
            lastActionPulse={lastActionPulse}
          />
          <div className="flex flex-1 min-h-0">
            <ActionRail activeMode={railMode} onModeChange={setRailMode} modeContent={railModeContent} compact={isTablet} />
            <LabCanvas sccProps={sccProps} activeMode={railMode} modeContent={canvasModeContent} footer={complianceSection} />
            <DeepDiveDrawer
              lastAction={lastAction}
              lastDelta={lastDelta}
              lastEngineOutputs={sim.snapshot?.engineOutputs}
              snapshotCount={sim.history.length}
              universeId={universeIdForDrawer}
              auditEntries={auditEntries}
              defaultCollapsed={true}
            />
          </div>
        </div>
      )}

      {/* Desktop: full layout */}
      {isDesktop && (
        <div className="flex flex-col h-[calc(100vh-3rem)] min-h-[600px]">
          <CommandStrip
            snapshot={sim.snapshot}
            currentStep={currentStep}
            historyLength={sim.history.length}
            lastActionLabel={lastActionLabel}
            universeContext={universeContext}
            multiverseMode={multiverseMode}
            lastActionPulse={lastActionPulse}
          />
          <div className="flex flex-1 min-h-0">
            <ActionRail activeMode={railMode} onModeChange={setRailMode} modeContent={railModeContent} compact={isTablet} />
            <LabCanvas sccProps={sccProps} activeMode={railMode} modeContent={canvasModeContent} footer={complianceSection} />
            <DeepDiveDrawer
              lastAction={lastAction}
              lastDelta={lastDelta}
              lastEngineOutputs={sim.snapshot?.engineOutputs}
              snapshotCount={sim.history.length}
              universeId={universeIdForDrawer}
              auditEntries={auditEntries}
              defaultCollapsed={true}
            />
          </div>
        </div>
      )}

      <div className="fixed top-4 right-4 z-50 hidden md:block">
        <button
          type="button"
          onClick={() => setShowHelp(true)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow hover:bg-slate-50"
        >
          How to Use
        </button>
      </div>
      <TrustLabHelp open={showHelp} onClose={() => setShowHelp(false)} />
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
