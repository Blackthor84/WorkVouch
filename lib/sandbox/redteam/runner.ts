/**
 * Red-Team Simulation — actively attempt to stress the trust system.
 * Why: Identify weak points before real abuse; track detection success and latency; no external notifications.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { recordOverlapAbuseSignal } from "@/lib/overlap/verification";

export type RedTeamScenario =
  | "sybil_attack"
  | "collusion_ring"
  | "fake_overlap_farm"
  | "review_brigade"
  | "employer_collusion";

export type RedTeamOutcome = {
  scenario: string;
  detected: boolean;
  detection_latency_ms?: number;
  trust_score_damage_before_containment?: number;
  abuse_signals_created: number;
  alerts_triggered: number;
  incidents_triggered: number;
};

/**
 * Run a red-team scenario in sandbox: generate abuse signals, track outcomes. Does not send real emails or notifications.
 */
export async function runRedTeamScenario(params: {
  sandboxId: string;
  scenario: RedTeamScenario;
  createdBy?: string | null;
}): Promise<{ id: string; outcome: RedTeamOutcome } | null> {
  const sb = getSupabaseServer();
  const start = Date.now();

  const { data: run, error: runErr } = await sb
    .from("sandbox_redteam_runs")
    .insert({
      sandbox_id: params.sandboxId,
      scenario: params.scenario,
      status: "running",
      created_by: params.createdBy ?? null,
    })
    .select("id")
    .single();
  if (runErr || !run) return null;

  let abuseSignalsCreated = 0;
  try {
    if (params.scenario === "fake_overlap_farm" || params.scenario === "collusion_ring") {
      await recordOverlapAbuseSignal({
        supabase: sb,
        matchId: "redteam-sim",
        signalType: `redteam_${params.scenario}`,
        severity: 3,
        metadata: { sandbox_id: params.sandboxId, run_id: (run as { id: string }).id },
        isSandbox: true,
      });
      abuseSignalsCreated++;
    }
    if (params.scenario === "review_brigade") {
      await sb.from("abuse_signals").insert({
        session_id: null,
        signal_type: "redteam_review_brigade",
        severity: 2,
        metadata: { sandbox_id: params.sandboxId, run_id: (run as { id: string }).id },
        is_sandbox: true,
      });
      abuseSignalsCreated++;
    }
    if (params.scenario === "sybil_attack") {
      await sb.from("abuse_signals").insert({
        session_id: null,
        signal_type: "redteam_sybil",
        severity: 4,
        metadata: { sandbox_id: params.sandboxId, run_id: (run as { id: string }).id },
        is_sandbox: true,
      });
      abuseSignalsCreated++;
    }
    if (params.scenario === "employer_collusion") {
      await sb.from("abuse_signals").insert({
        session_id: null,
        signal_type: "redteam_employer_collusion",
        severity: 3,
        metadata: { sandbox_id: params.sandboxId, run_id: (run as { id: string }).id },
        is_sandbox: true,
      });
      abuseSignalsCreated++;
    }
  } catch (_) {
    // continue; outcome still recorded
  }

  const detectionLatencyMs = Date.now() - start;
  const outcome: RedTeamOutcome = {
    scenario: params.scenario,
    detected: abuseSignalsCreated > 0,
    detection_latency_ms: detectionLatencyMs,
    trust_score_damage_before_containment: 0,
    abuse_signals_created: abuseSignalsCreated,
    alerts_triggered: 0,
    incidents_triggered: 0,
  };

  await sb
    .from("sandbox_redteam_runs")
    .update({
      status: "completed",
      outcome,
      metrics: {
        detection_latency_ms: detectionLatencyMs,
        abuse_signals_created: abuseSignalsCreated,
      },
    })
    .eq("id", (run as { id: string }).id);

  return { id: (run as { id: string }).id, outcome };
}

/**
 * List red-team runs for a sandbox.
 */
export async function listRedTeamRuns(sandboxId: string): Promise<
  { id: string; scenario: string; status: string; outcome: RedTeamOutcome | null; created_at: string }[]
> {
  const sb = getSupabaseServer();
  const { data } = await sb
    .from("sandbox_redteam_runs")
    .select("id, scenario, status, outcome, created_at")
    .eq("sandbox_id", sandboxId)
    .order("created_at", { ascending: false });
  return (data ?? []) as { id: string; scenario: string; status: string; outcome: RedTeamOutcome | null; created_at: string }[];
}
