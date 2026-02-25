"use client";

import { useState } from "react";
import { listScenarios, runScenario, addAIScenario } from "@/lib/sandbox/runtime";

import ScenarioTimeline from "@/components/playground/ScenarioTimeline";
import ScenarioResult from "@/components/playground/ScenarioResult";
import EmployerImpact from "@/components/playground/EmployerImpact";

export default function EnterprisePlaygroundPage() {
  const [scenarios, setScenarios] = useState(listScenarios());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [trustThreshold, setTrustThreshold] = useState(60);

  function run() {
    if (!selectedId) return;
    const r = runScenario(selectedId, trustThreshold);
    setResult(r);
  }

  function generateAI() {
    const scenario = addAIScenario("simulate trust edge case");
    setScenarios(listScenarios());
    setSelectedId(scenario.id);
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-10">
      {/* HERO */}
      <section>
        <h1 className="text-3xl font-bold">Enterprise Hiring Simulation Playground</h1>
        <p className="text-gray-600 mt-2">
          Simulation-only environment. No production data.
        </p>
      </section>

      {/* CONTROLS */}
      <section className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Scenario</label>
          <select
            className="border rounded px-3 py-2"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">Select scenario</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Employer Trust Threshold: {trustThreshold}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={trustThreshold}
            onChange={(e) => setTrustThreshold(Number(e.target.value))}
          />
        </div>

        <button
          onClick={run}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Run Simulation
        </button>

        <button
          onClick={generateAI}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Generate AI Scenario
        </button>
      </section>

      {/* RESULTS */}
      {result && (
        <>
          <section>
            <ScenarioResult result={result} />
          </section>

          <section>
            <h3 className="font-semibold mb-2">Timeline</h3>
            <ScenarioTimeline events={result.events} />
          </section>

          <section>
            <EmployerImpact result={result} threshold={trustThreshold} />
          </section>
        </>
      )}
    </div>
  );
}
