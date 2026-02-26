"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTrustEngine } from "@/lib/trust/useTrustEngine";
import type { ActorMode } from "@/lib/trust/types";
import ScenarioTimeline from "@/components/playground/ScenarioTimeline";
import ScenarioResult from "@/components/playground/ScenarioResult";
import EmployerImpact from "@/components/playground/EmployerImpact";

type ScenarioItem = { id: string; title: string };

export default function EnterprisePlayground() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, engineAction } = useTrustEngine();

  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const result = state.lastRunResult;

  const fetchScenarios = useCallback(async () => {
    const res = await fetch("/api/sandbox/list");
    if (!res.ok) return;
    const data = await res.json();
    setScenarios(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  useEffect(() => {
    const s = searchParams.get("scenario");
    const t = searchParams.get("threshold");
    const v = searchParams.get("view");
    if (s) setSelectedId(s);
    if (t != null) engineAction({ type: "setThreshold", value: Number(t) });
    if (v === "employer" || v === "candidate") engineAction({ type: "setView", view: v });
  }, [searchParams, engineAction]);

  function run() {
    if (!selectedId) return;
    setLoading(true);
    fetch("/api/sandbox/run-scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId: selectedId }),
    })
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.error) return;
        engineAction({ type: "runScenario", payload });
        router.replace(
          `?scenario=${selectedId}&threshold=${state.threshold}&view=${state.view}`
        );
      })
      .finally(() => setLoading(false));
  }

  function generateAI() {
    fetch("/api/sandbox/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "enterprise demo scenario" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) setSelectedId(data.id);
        return fetchScenarios();
      });
  }

  function exportJSON() {
    const blob = new Blob(
      [JSON.stringify({ result, trustThreshold: state.threshold, view: state.view }, null, 2)],
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

      <div className="flex flex-wrap gap-4 items-end border p-4 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Acting As</label>
          <select
            value={state.actorMode}
            onChange={(e) =>
              engineAction({ type: "setActorMode", actor: e.target.value as ActorMode })
            }
            className="border rounded px-3 py-2"
          >
            <option value="employer">Employer</option>
          </select>
        </div>
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
            value={state.view}
            onChange={(e) => engineAction({ type: "setView", view: e.target.value as "employer" | "candidate" })}
          >
            <option value="employer">Employer View</option>
            <option value="candidate">Candidate View</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Trust Threshold: {state.threshold}</label>
          <input
            type="range"
            min={0}
            max={100}
            value={state.threshold}
            onChange={(e) => engineAction({ type: "setThreshold", value: Number(e.target.value) })}
          />
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
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

      {state.actorMode === "employer" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900 mb-3">Employer Actions</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-green-600 text-white px-3 py-2 text-sm hover:bg-green-700"
              onClick={() => {
                const reason = window.prompt("Reason for positive review (optional):") ?? "";
                engineAction({ type: "employerReview", kind: "positive", reason });
              }}
            >
              Add Positive Employer Review
            </button>
            <button
              type="button"
              className="rounded bg-amber-600 text-white px-3 py-2 text-sm hover:bg-amber-700"
              onClick={() => {
                const reason = window.prompt("Reason for negative review:") ?? "";
                engineAction({ type: "employerReview", kind: "negative", reason });
              }}
            >
              Add Negative Employer Review
            </button>
            <button
              type="button"
              className="rounded bg-orange-600 text-white px-3 py-2 text-sm hover:bg-orange-700"
              onClick={() => {
                const reason = window.prompt("Describe inconsistency:") ?? "";
                engineAction({ type: "flagInconsistency", reason });
              }}
            >
              Flag Inconsistency
            </button>
            <button
              type="button"
              className="rounded bg-slate-600 text-white px-3 py-2 text-sm hover:bg-slate-700"
              onClick={() => engineAction({ type: "retractEmployerReview" })}
            >
              Retract Employer Review
            </button>
            <select
              className="border rounded px-3 py-2 text-sm"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value as "low" | "medium" | "high" | "";
                if (v) engineAction({ type: "employerAbusePattern", severity: v });
                e.target.value = "";
              }}
            >
              <option value="">Report abuse pattern…</option>
              <option value="low">Abuse: Low</option>
              <option value="medium">Abuse: Medium</option>
              <option value="high">Abuse: High</option>
            </select>
          </div>
        </div>
      )}

      {result && (
        <>
          <ScenarioResult result={result} />
          <ScenarioTimeline events={state.events} />
          <EmployerImpact
            result={result}
            threshold={state.threshold}
            view={state.view}
          />
        </>
      )}
    </div>
  );
}
