"use client";

/**
 * Client-only: triggers a CSV download using document/URL/Blob.
 * Do not import from server components or RSC.
 */
export function exportCSV(rows: Record<string, unknown>[], filename = "report.csv") {
  if (typeof document === "undefined" || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => (v == null ? "" : String(v))).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type { ScenarioResultRow } from "@/lib/exports/exportCSV";
export { scenarioReport } from "@/lib/exports/exportCSV";
