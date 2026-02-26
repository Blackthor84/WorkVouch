export function exportCSV(rows: Record<string, unknown>[], filename = "report.csv") {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => (v == null ? "" : String(v))).join(",")).join("\n");
  const blob = new Blob([headers + "\n" + body], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type ScenarioResultRow = {
  employee: string;
  trust_before: number;
  trust_after: number;
  delta: number;
};

export function scenarioReport(
  scenario: { name?: string },
  results: { name: string; before: { trustScore: number }; after: { trustScore: number } }[]
): ScenarioResultRow[] {
  return results.map((r) => ({
    employee: r.name,
    trust_before: r.before.trustScore,
    trust_after: r.after.trustScore,
    delta: r.after.trustScore - r.before.trustScore,
  }));
}
