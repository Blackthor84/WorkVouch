"use client";

import { useCallback, useMemo, useState } from "react";
import {
  listScenarios,
  runScenario,
  generateAIScenario,
} from "@/lib/playground/runtime";
import type { PlaygroundScenarioResult } from "@/lib/playground/types";
import type { ExportPayload } from "@/lib/playground/types";
import ScenarioTimeline from "@/components/playground/ScenarioTimeline";
import ScenarioResult from "@/components/playground/ScenarioResult";
import EmployerImpact from "@/components/playground/EmployerImpact";
import TrustThresholdSimulator from "@/components/playground/TrustThresholdSimulator";
import ViewToggle, { type PlaygroundView } from "@/components/playground/ViewToggle";

const DEFAULT_THRESHOLD = 60;

export default function EnterprisePlaygroundPage() {
  const scenarios = useMemo(() => listScenarios(), []);
  const [scenarioId, setScenarioId] = useState<string>(scenarios[0]?.id ?? "");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [view, setView] = useState<PlaygroundView>("employer");
  const [result, setResult] = useState<PlaygroundScenarioResult | null>(() => {
    const firstId = scenarios[0]?.id;
    if (!firstId) return null;
    try {
      return runScenario(firstId, DEFAULT_THRESHOLD);
    } catch {
      return null;
    }
  });

  const runCurrentScenario = useCallback(() => {
    if (!scenarioId) return;
    const isListScenario = scenarios.some((s) => s.id === scenarioId);
    if (isListScenario) {
      try {
        setResult(runScenario(scenarioId, threshold));
      } catch {
        setResult(null);
      }
    }
  }, [scenarioId, threshold, scenarios]);

  const handleScenarioSelect = useCallback(
    (id: string) => {
      setScenarioId(id);
      try {
        setResult(runScenario(id, threshold));
      } catch {
        setResult(null);
      }
    },
    [threshold]
  );

  const handleGenerateAI = useCallback(() => {
    const aiResult = generateAIScenario();
    setScenarioId(aiResult.id);
    setResult(aiResult);
  }, []);

  const handleExport = useCallback(() => {
    if (!result) return;
    const payload: ExportPayload = {
      inputs: { scenarioId, trustThreshold: threshold },
      events: result.events,
      outputs: {
        before: result.before,
        after: result.after,
      },
      thresholdUsed: threshold,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground-scenario-${result.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, scenarioId, threshold]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Enterprise positioning */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <p className="font-semibold text-amber-800 dark:text-amber-200">
            Enterprise Playground — Simulation Only. No Production Data.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            This mirrors production logic for hiring trust signals. No real
            candidate data is used. Safe for demos and sales.
          </p>
        </div>

        {/* Hero */}
        <section>
          <h1 className="text-3xl font-bold tracking-tight">
            Hiring Simulation Engine
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            See how verification events change trust scores and employer impact.
          </p>
        </section>

        {/* Scenario Selector */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Scenario</h2>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleScenarioSelect(s.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  scenarioId === s.id
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {s.title}
              </button>
            ))}
            <button
              type="button"
              onClick={handleGenerateAI}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Generate AI Scenario
            </button>
          </div>
        </section>

        {/* Run + View Toggle + Export */}
        <section className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={runCurrentScenario}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Run Scenario
          </button>
          <ViewToggle value={view} onChange={setView} />
          <button
            type="button"
            onClick={handleExport}
            disabled={!result}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Scenario
          </button>
        </section>

        {/* Trust Threshold Simulator */}
        <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <TrustThresholdSimulator
            value={threshold}
            onChange={setThreshold}
          />
        </section>

        {/* Timeline */}
        {result && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <ScenarioTimeline events={result.events} />
            </div>
          </section>
        )}

        {/* Result (metrics) */}
        {result && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Result</h2>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <ScenarioResult result={result} />
            </div>
          </section>
        )}

        {/* Employer Impact */}
        {result && (
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Impact</h2>
            <EmployerImpact
              result={result}
              view={view}
              threshold={threshold}
            />
          </section>
        )}

        {!result && scenarioId && (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Click &quot;Run Scenario&quot; or select a scenario to see results.
          </p>
        )}
      </div>
    </div>
  );
}
