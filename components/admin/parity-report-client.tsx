"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

export function ParityReportClient() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ drift?: string[]; versionMismatch?: boolean; summary?: string } | null>(null);

  const runCheck = () => {
    setLoading(true);
    setReport(null);
    // Placeholder: in production this would call an API that runs sandbox vs production scoring on a sample and compares.
    setTimeout(() => {
      setReport({
        summary: "Parity check not yet implemented. Wire /api/admin/system/parity to run sandbox and production scoring on the same input and compare outputs.",
        drift: [],
        versionMismatch: false,
      });
      setLoading(false);
    }, 500);
  };

  return (
    <Card className="p-6">
      <p className="text-sm text-grey-medium dark:text-gray-400 mb-4">
        Sandbox scoring vs production scoring; version mismatch detection; report drift.
      </p>
      <button
        type="button"
        onClick={runCheck}
        disabled={loading}
        className="px-5 py-2.5 font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Running…" : "Run parity check"}
      </button>
      {report && (
        <div className="mt-4 p-4 rounded-lg bg-grey-background/50 dark:bg-[#1A1F2B] text-sm">
          <p className="text-grey-dark dark:text-gray-200">{report.summary}</p>
          {report.versionMismatch && <p className="text-amber-600 dark:text-amber-400 mt-2">Version mismatch detected.</p>}
          {report.drift && report.drift.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-grey-medium dark:text-gray-400">
              {report.drift.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
