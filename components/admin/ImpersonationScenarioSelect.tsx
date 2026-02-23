"use client";

import { useState } from "react";

const SCENARIO_OPTIONS = [
  { value: "employee_perfect_candidate", label: "Perfect Employee", actorType: "employee" as const },
  { value: "employee_conflicting_dates", label: "Conflicting Dates", actorType: "employee" as const },
  { value: "employer_sales_demo_mode", label: "Employer Demo", actorType: "employer" as const },
];

export function ImpersonationScenarioSelect() {
  const [actorType, setActorType] = useState<"employee" | "employer">("employee");
  const [scenario, setScenario] = useState("employee_perfect_candidate");
  const [loading, setLoading] = useState(false);

  const optionsForActor = SCENARIO_OPTIONS.filter((o) => o.actorType === actorType);
  const currentScenario = optionsForActor.some((o) => o.value === scenario)
    ? scenario
    : optionsForActor[0]?.value ?? scenario;

  const impersonate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorType, scenario: currentScenario }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={actorType}
        onChange={(e) => {
          const next = e.target.value as "employee" | "employer";
          setActorType(next);
          const first = SCENARIO_OPTIONS.find((o) => o.actorType === next);
          if (first) setScenario(first.value);
        }}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
      >
        <option value="employee">Employee</option>
        <option value="employer">Employer</option>
      </select>

      <select
        value={currentScenario}
        onChange={(e) => setScenario(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
      >
        {optionsForActor.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={impersonate}
        disabled={loading}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "…" : "Impersonate"}
      </button>
    </div>
  );
}
