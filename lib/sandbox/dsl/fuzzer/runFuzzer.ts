/**
 * Scenario Fuzzer runner: generates scenario, runs through real Scenario Runner,
 * captures per-step trust snapshots, logs to sandbox_events, evaluates invariants.
 * Admin-only; simulation-safe; replayable.
 */

import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { runScenario } from "../runner";
import { generateScenario, type FuzzAttackType } from "./generators";
import { evaluateAllInvariants } from "./invariants";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";
import type { ScenarioDoc } from "../types";

export type RunFuzzerOptions = {
  sandbox_id: string;
  admin_user_id: string;
  /** Map actor ref (e.g. employee_1) to sandbox employee/employer id. Must include admin -> admin_user_id. */
  actor_resolution: Record<string, string>;
  attack_type: FuzzAttackType;
  /** Optional: seed for reproducible generation */
  seed?: number;
  mode?: "safe" | "real";
};

export type FuzzRunRecord = {
  id: string;
  scenario_id: string;
  scenario_name: string;
  attack_type: string;
  mode: string;
  sandbox_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  step_count: number | null;
  result_summary: Record<string, unknown> | null;
  invariant_results: unknown[] | null;
};

export async function runFuzzer(options: RunFuzzerOptions): Promise<FuzzRunRecord> {
  const supabase = getServiceRoleClient();
  const doc = generateScenario({
    attack_type: options.attack_type,
    seed: options.seed,
    scenario_id_prefix: "fuzz",
  });
  const mode = options.mode ?? "safe";
  const scenarioId = doc.id;
  const scenarioName = doc.name;

  const { data: runRow, error: insertErr } = await supabase
    .from("sandbox_fuzz_runs")
    .insert({
      scenario_id: scenarioId,
      scenario_name: scenarioName,
      attack_type: options.attack_type,
      mode,
      sandbox_id: options.sandbox_id,
      admin_user_id: options.admin_user_id,
      status: "running",
    })
    .select("id, scenario_id, scenario_name, attack_type, mode, sandbox_id, status, started_at, finished_at, step_count, result_summary, invariant_results")
    .single();

  if (insertErr || !runRow) {
    throw new Error(insertErr?.message ?? "Failed to create fuzz run");
  }
  const fuzzRunId = (runRow as { id: string }).id;

  await logSandboxEvent({
    type: "fuzz_run_started",
    message: `Fuzz run ${fuzzRunId}: ${options.attack_type}`,
    actor: options.admin_user_id,
    metadata: { fuzz_run_id: fuzzRunId, attack_type: options.attack_type },
    sandbox_id: options.sandbox_id,
    scenario_id: scenarioId,
  });

  const runDoc: ScenarioDoc = { ...doc, mode };
  let stepCount = 0;
  let resultSummary: Record<string, unknown> = { scenario_doc: runDoc };
  let invariantResults: unknown[] = [];

  try {
    const result = await runScenario(runDoc, {
      sandbox_id: options.sandbox_id,
      admin_user_id: options.admin_user_id,
      actor_resolution: options.actor_resolution,
      capture_state: true,
      onAfterStep: async (stepIndex, step, snapshots) => {
        stepCount = stepIndex + 1;
        for (const s of snapshots) {
          await supabase.from("sandbox_trust_snapshots").insert({
            fuzz_run_id: fuzzRunId,
            step_index: stepIndex,
            step_id: step.step_id,
            actor_ref: s.actor_ref,
            actor_id: s.actor_id,
            profile_strength: s.profile_strength,
          });
        }
      },
    });

    resultSummary = {
      passed: result.passed,
      steps_ok: result.steps.filter((s) => s.ok).length,
      steps_total: result.steps.length,
      duration_ms: result.duration_ms,
      scenario_doc: runDoc,
      actor_resolution: options.actor_resolution,
    };

    const { data: snapshotRows } = await supabase
      .from("sandbox_trust_snapshots")
      .select("step_index, step_id, actor_ref, actor_id, profile_strength")
      .eq("fuzz_run_id", fuzzRunId)
      .order("step_index");

    const snapshots = (snapshotRows ?? []).map((r) => ({
      step_index: (r as { step_index: number }).step_index,
      step_id: (r as { step_id: string }).step_id,
      actor_ref: (r as { actor_ref: string }).actor_ref,
      actor_id: (r as { actor_id: string }).actor_id,
      profile_strength: (r as { profile_strength: number | null }).profile_strength,
    }));
    const actorRefs = [...new Set(snapshots.map((s) => s.actor_ref))].filter((r) => r !== "admin");
    invariantResults = await evaluateAllInvariants(
      options.attack_type,
      scenarioId,
      fuzzRunId,
      snapshots,
      actorRefs
    );

    await supabase
      .from("sandbox_fuzz_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        step_count: result.steps.length,
        result_summary: resultSummary,
        invariant_results: invariantResults,
      })
      .eq("id", fuzzRunId);

    await logSandboxEvent({
      type: "fuzz_run_completed",
      message: `Fuzz run ${fuzzRunId} completed`,
      actor: options.admin_user_id,
      metadata: { fuzz_run_id: fuzzRunId, result_summary: resultSummary, invariant_results: invariantResults },
      sandbox_id: options.sandbox_id,
      scenario_id: scenarioId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("sandbox_fuzz_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        step_count: stepCount,
        result_summary: { error: msg },
        invariant_results: invariantResults,
      })
      .eq("id", fuzzRunId);

    await logSandboxEvent({
      type: "fuzz_run_failed",
      message: `Fuzz run ${fuzzRunId} failed: ${msg}`,
      actor: options.admin_user_id,
      metadata: { fuzz_run_id: fuzzRunId, error: msg },
      sandbox_id: options.sandbox_id,
      scenario_id: scenarioId,
    });
    throw err;
  }

  const { data: updated } = await supabase
    .from("sandbox_fuzz_runs")
    .select("id, scenario_id, scenario_name, attack_type, mode, sandbox_id, status, started_at, finished_at, step_count, result_summary, invariant_results")
    .eq("id", fuzzRunId)
    .single();

  return (updated ?? runRow) as FuzzRunRecord;
}

export async function listFuzzRuns(sandboxId?: string, limit = 50): Promise<FuzzRunRecord[]> {
  const supabase = getServiceRoleClient();
  let query = supabase
    .from("sandbox_fuzz_runs")
    .select("id, scenario_id, scenario_name, attack_type, mode, sandbox_id, status, started_at, finished_at, step_count, result_summary, invariant_results")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (sandboxId) query = query.eq("sandbox_id", sandboxId);
  const { data } = await query;
  return (data ?? []) as FuzzRunRecord[];
}

export async function getFuzzRun(id: string): Promise<FuzzRunRecord | null> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sandbox_fuzz_runs")
    .select("id, scenario_id, scenario_name, attack_type, mode, sandbox_id, status, started_at, finished_at, step_count, result_summary, invariant_results")
    .eq("id", id)
    .single();
  return data as FuzzRunRecord | null;
}

export async function getFuzzRunSnapshots(fuzzRunId: string): Promise<
  { step_index: number; step_id: string; actor_ref: string; actor_id: string; profile_strength: number | null }[]
> {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("sandbox_trust_snapshots")
    .select("step_index, step_id, actor_ref, actor_id, profile_strength")
    .eq("fuzz_run_id", fuzzRunId)
    .order("step_index");
  return (data ?? []) as { step_index: number; step_id: string; actor_ref: string; actor_id: string; profile_strength: number | null }[];
}
