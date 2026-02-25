"use client";

import { useState } from "react";
import { generateAIScenario } from "@/lib/playground/runtime";
import type { PlaygroundScenarioResult } from "@/lib/playground/types";

type Props = {
  onGenerated?: (result: PlaygroundScenarioResult) => void;
};

export default function AIScenarioGenerator({ onGenerated }: Props) {
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    try {
      const result = generateAIScenario();
      onGenerated?.(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-indigo-50/50 dark:bg-indigo-900/10">
      <h3 className="font-semibold text-gray-900 dark:text-white">Generate AI Scenario</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Creates a plausible scenario using deterministic mock logic. No API calls. Safe for demos.
      </p>
      <button
        onClick={generate}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate AI Scenario"}
      </button>
    </div>
  );
}
