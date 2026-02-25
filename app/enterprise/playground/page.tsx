"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  listScenarios,
  runScenario,
  addAIScenario,
} from "@/lib/sandbox/runtime";

import ScenarioTimeline from "@/components/playground/ScenarioTimeline";
import ScenarioResult from "@/components/playground/ScenarioResult";
import EmployerImpact from "@/components/playground/EmployerImpact";

export default function EnterprisePlayground() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [threshold, setThreshold] = useState(60);
  const [view, setView] = useState<"employer" | "candidate">("employer");

  useEffect(() => {
    setScenarios(listScenarios());
  }, []);

  useEffect(() => {
    const s = searchParams.get("scenario");
    const t = searchParams.get("threshold");
    const v = searchParams.get("view");
    if (s) setSelectedId(s);
    if (t) setThreshold(Number(t));
    if (v === "employer" || v === "candidate") setView(v);
  }, [searchParams]);

  function run() {
    if (!selectedId) return;
    const r = runScenario(selectedId, threshold);
    setResult(r);
    router.replace(
      `?scenario=${selectedId}&threshold=${threshold}&view=${view}`
    );
  }

  function generateAI() {
    const s = addAIScenario("enterprise demo scenario");
    setScenarios(listScenarios());
    setSelectedId(s.id);
  }

  function exportJSON() {
    const blob = new Blob(
      [JSON.stringify({ result, trustThreshold: threshold, view }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workvouch-simulation.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      <h1 className="text-3xl font-bold">Enterprise Playground</h1>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 items-end border p-4 rounded">
        <select
          className="border px-3 py-2 rounded"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Select scenario</option>
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <div>
          <label className="block text-sm font-medium">View</label>
          <select
            className="border rounded px-3 py-2"
            value={view}
            onChange={(e) => setView(e.target.value as "employer" | "candidate")}
          >
            <option value="employer">Employer View</option>
            <option value="candidate">Candidate View</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Trust Threshold: {threshold}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>

        <button onClick={run} className="bg-blue-600 text-white px-4 py-2 rounded">
          Run Simulation
        </button>

        <button
          onClick={generateAI}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Generate AI Scenario
        </button>

        {result && (
          <button
            onClick={exportJSON}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Export Scenario JSON
          </button>
        )}
      </div>

      {/* RESULTS */}
      {result && (
        <>
          <ScenarioResult result={result} />
          <ScenarioTimeline events={result.events} />
          <EmployerImpact
            result={result}
            threshold={threshold}
            view={view}
          />
        </>
      )}
    </div>
  );
}
