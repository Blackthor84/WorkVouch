/**
 * Pure helpers for CSV report data. No browser APIs.
 * For triggering downloads (document/Blob/URL), use @/lib/client/exportCSV.
 */

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
