"use client";

import { useState } from "react";

type Props = {
  onGenerated?: () => void;
};

export default function AIScenarioGenerator({ onGenerated }: Props) {
  const [loading, setLoading] = useState(false);

  function generate() {
    setLoading(true);
    fetch("/api/sandbox/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Generate a plausible trust scenario" }),
    })
      .then(() => onGenerated?.())
      .finally(() => setLoading(false));
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
