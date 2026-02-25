"use client";

import { useState } from "react";
import { listScenarios, runScenario, addAIScenario } from "@/lib/sandbox/runtime";

export default function AdminPlayground() {
  const [log, setLog] = useState<any[]>([]);
  const scenarios = listScenarios();

  function run(id: string) {
    const result = runScenario(id, 60);
    setLog((l) => [...l, result]);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Superadmin Playground</h1>
      <p className="text-gray-500">
        Raw internal sandbox. No UX polish. Full power.
      </p>

      <button
        onClick={() => addAIScenario("wild edge case")}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Inject AI Scenario
      </button>

      <div className="space-y-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => run(s.id)}
            className="block border px-3 py-2 rounded w-full text-left"
          >
            Run: {s.title}
          </button>
        ))}
      </div>

      <pre className="bg-gray-100 p-4 text-xs overflow-auto max-h-96">
        {JSON.stringify(log, null, 2)}
      </pre>
    </div>
  );
}
