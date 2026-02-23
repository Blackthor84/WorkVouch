"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { ActorType } from "@/lib/impersonation-simulation/context";
import {
  EMPLOYEE_SCENARIO_KEYS,
  EMPLOYER_SCENARIO_KEYS,
} from "@/lib/impersonation-simulation/scenarioResolver";

type SimulationContext = {
  actorType: ActorType;
  scenario: string;
  impersonating: boolean;
} | null;

export function SimulationScenarioControls() {
  const [actorType, setActorType] = useState<ActorType>("employee");
  const [scenario, setScenario] = useState<string>("employee_01");
  const [context, setContext] = useState<SimulationContext>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const scenarioKeys = actorType === "employee" ? EMPLOYEE_SCENARIO_KEYS : EMPLOYER_SCENARIO_KEYS;

  const fetchContext = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate/simulation", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setContext((data as { context?: SimulationContext }).context ?? null);
    } catch {
      setContext(null);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  useEffect(() => {
    const first = actorType === "employee" ? "employee_01" : "employer_01";
    if (!scenarioKeys.includes(scenario as never)) setScenario(first);
  }, [actorType]);

  const start = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/impersonate/simulation", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorType, scenario, impersonating: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage((data as { error?: string }).error ?? "Failed");
        return;
      }
      await fetchContext();
      setMessage("Simulation started");
      window.location.reload();
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const clear = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await fetch("/api/admin/impersonate/simulation", { method: "DELETE", credentials: "include" });
      await fetchContext();
      setMessage("Simulation cleared");
      window.location.reload();
    } catch {
      setMessage("Clear failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Simulation scenario</h2>
      <p className="text-sm text-slate-600">
        Impersonate actor type and scenario (employee_01–15 / employer_01–15). Applies in-memory overlays for demos.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Actor type</label>
          <select
            value={actorType}
            onChange={(e) => {
              const next = e.target.value as ActorType;
              setActorType(next);
              setScenario(next === "employee" ? "employee_01" : "employer_01");
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="employee">Employee</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {scenarioKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" disabled={loading} onClick={start}>
          {loading ? "…" : "Start"}
        </Button>
        <Button variant="ghost" size="sm" disabled={loading} onClick={clear}>
          Clear
        </Button>
      </div>
      {context?.impersonating && (
        <p className="text-sm text-amber-700">
          <span className="font-medium">IMPERSONATION MODE</span> — {context.actorType} / {context.scenario}
        </p>
      )}
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
