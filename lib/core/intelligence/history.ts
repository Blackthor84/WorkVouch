/**
 * Score diff logging and health events. Writes to intelligence_score_history and intelligence_health_events.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type ScoreHistoryEntity = "trust_score" | "sandbox";

export interface InsertScoreHistoryParams {
  entity_type: ScoreHistoryEntity;
  user_id?: string | null;
  sandbox_id?: string | null;
  employee_id?: string | null;
  previous_score: number | null;
  new_score: number;
  reason: string;
  triggered_by?: string | null;
}

export function scoreHistoryDelta(
  previous: number | null,
  newScore: number
): number | null {
  if (previous === null) return null;
  return Math.round((newScore - previous) * 100) / 100;
}

export async function insertScoreHistory(
  params: InsertScoreHistoryParams
): Promise<void> {
  const delta = scoreHistoryDelta(params.previous_score, params.new_score);
  const sb = getSupabaseServer();
  await sb.from("intelligence_score_history").insert({
    entity_type: params.entity_type,
    user_id: params.user_id ?? null,
    sandbox_id: params.sandbox_id ?? null,
    employee_id: params.employee_id ?? null,
    previous_score: params.previous_score,
    new_score: params.new_score,
    delta,
    reason: params.reason,
    triggered_by: params.triggered_by ?? null,
  });
}

export type HealthEventType =
  | "recalc_success"
  | "recalc_fail"
  | "fraud_block"
  | "overlap_failure";

export interface InsertHealthEventParams {
  event_type: HealthEventType;
  payload?: Record<string, unknown>;
}

export async function insertHealthEvent(
  params: InsertHealthEventParams
): Promise<void> {
  const sb = getSupabaseServer();
  await sb.from("intelligence_health_events").insert({
    event_type: params.event_type,
    payload: params.payload ?? {},
  });
}

/** Reason for trust score recalculation (intelligence_history.reason). */
export type IntelligenceHistoryReason =
  | "peer_review_added"
  | "employment_verified"
  | "dispute_resolved"
  | "cron_recalc"
  | "manual_admin";

export interface InsertIntelligenceHistoryParams {
  user_id: string;
  previous_score: number | null;
  new_score: number;
  version: string;
  reason: IntelligenceHistoryReason;
}

/** Insert one row into intelligence_history per recalculation. No silent failures. */
export async function insertIntelligenceHistory(
  params: InsertIntelligenceHistoryParams
): Promise<void> {
  const sb = getSupabaseServer();
  const { error } = await sb.from("intelligence_history").insert({
    user_id: params.user_id,
    previous_score: params.previous_score,
    new_score: params.new_score,
    version: params.version,
    reason: params.reason,
  });
  if (error) {
    throw new Error(`intelligence_history insert failed: ${error.message}`);
  }
}
