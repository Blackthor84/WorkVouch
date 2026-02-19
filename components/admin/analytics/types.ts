import type { RehireSlice } from "./RehirePieChart";

/** Aggregated rehire counts per playground scenario (e.g. from SQL group by scenario_id, would_rehire). */
export type ScenarioRehireRow = {
  playground_scenario_id: string;
  would_rehire: boolean;
  total: number;
};

/** Per-scenario, per-job stats: average rating and reference count (e.g. from SQL aggregation). */
export type ScenarioJobStatsRow = {
  playground_scenario_id: string;
  job_id: string;
  avg_rating: number;
  reference_count: number;
};

/**
 * Converts scenario rehire rows (for one scenario) into RehireSlice[] for RehirePieChart.
 * Rows with would_rehire true → "Rehire yes", false → "Rehire no".
 */
export function scenarioRehireRowsToSlices(rows: ScenarioRehireRow[]): RehireSlice[] {
  const yes = rows.filter((r) => r.would_rehire).reduce((s, r) => s + r.total, 0);
  const no = rows.filter((r) => !r.would_rehire).reduce((s, r) => s + r.total, 0);
  const out: RehireSlice[] = [];
  if (yes > 0) out.push({ label: "Rehire yes", value: yes });
  if (no > 0) out.push({ label: "Rehire no", value: no });
  return out;
}
