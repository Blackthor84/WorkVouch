/**
 * Fraud Stress-Test Playbook — automated run with report. Exportable. Sandbox-only.
 * Why: Measure detection latency, trust inflation before containment, % auto-mitigated, manual intervention for audit.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { runRedTeamScenario } from "@/lib/sandbox/redteam/runner";

export type StressTestReport = {
  scenario: string;
  detection_latency_ms: number;
  trust_inflation_before_containment: number;
  pct_auto_mitigated: number;
  manual_intervention_count: number;
  abuse_signals_created: number;
  completed_at: string;
};

export type StressTestConfig = {
  scale?: number;
  duration_seconds?: number;
};

/**
 * Run playbook: select scenario, config scale/duration, run simulation, generate report.
 */
export async function runStressTestPlaybook(params: {
  sandboxId: string;
  scenario: string;
  config?: StressTestConfig;
  createdBy?: string | null;
}): Promise<{ id: string; report: StressTestReport } | null> {
  const sb = getSupabaseServer();
  const validScenarios = ["sybil_attack", "collusion_ring", "fake_overlap_farm", "review_brigade", "employer_collusion"];
  if (!validScenarios.includes(params.scenario)) return null;

  const { data: row, error: insertErr } = await sb
    .from("sandbox_stress_test_reports")
    .insert({
      sandbox_id: params.sandboxId,
      scenario: params.scenario,
      scale_config: params.config ?? {},
      duration_seconds: params.config?.duration_seconds ?? null,
      status: "running",
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (insertErr || !row) return null;

  const runResult = await runRedTeamScenario({
    sandboxId: params.sandboxId,
    scenario: params.scenario as "sybil_attack" | "collusion_ring" | "fake_overlap_farm" | "review_brigade" | "employer_collusion",
    createdBy: params.createdBy ?? null,
  });

  const report: StressTestReport = {
    scenario: params.scenario,
    detection_latency_ms: runResult?.outcome?.detection_latency_ms ?? 0,
    trust_inflation_before_containment: runResult?.outcome?.trust_score_damage_before_containment ?? 0,
    pct_auto_mitigated: runResult?.outcome?.detected ? 100 : 0,
    manual_intervention_count: 0,
    abuse_signals_created: runResult?.outcome?.abuse_signals_created ?? 0,
    completed_at: new Date().toISOString(),
  };

  await sb
    .from("sandbox_stress_test_reports")
    .update({ status: "completed", report })
    .eq("id", (row as { id: string }).id);

  return { id: (row as { id: string }).id, report };
}

export async function listStressTestReports(sandboxId: string): Promise<
  { id: string; scenario: string; status: string; report: StressTestReport | null; created_at: string }[]
> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from("sandbox_stress_test_reports")
    .select("id, scenario, status, report, created_at")
    .eq("sandbox_id", sandboxId)
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; scenario: string; status: string; report: StressTestReport | null; created_at: string }[];
}
