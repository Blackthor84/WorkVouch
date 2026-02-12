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
  /** Optional component breakdown for graphs and transparency. */
  breakdown_json?: Record<string, unknown> | null;
  /** Optional org context for cross-location intelligence. */
  organization_id?: string | null;
}

/** Insert one row into intelligence_history per recalculation. No silent failures. [INTEL_SUCCESS] */
export async function insertIntelligenceHistory(
  params: InsertIntelligenceHistoryParams
): Promise<void> {
  const sb = getSupabaseServer();
  const { error } = await (sb as any).from("intelligence_history").insert({
    user_id: params.user_id,
    previous_score: params.previous_score,
    new_score: params.new_score,
    version: params.version,
    reason: params.reason,
    breakdown_json: params.breakdown_json ?? null,
    organization_id: params.organization_id ?? null,
  });
  if (error) {
    throw new Error(`intelligence_history insert failed: ${error.message}`);
  }
}

export interface OrganizationIntelligenceMetrics {
  avg_hiring_confidence?: number | null;
  fraud_density?: number | null;
  dispute_rate?: number | null;
  rehire_rate?: number | null;
}

/** Upsert organization_intelligence for an org. Pass metrics or leave null to compute avg from recent intelligence_history. */
export async function upsertOrganizationIntelligence(
  organizationId: string,
  metrics?: OrganizationIntelligenceMetrics
): Promise<void> {
  const sb = getSupabaseServer();
  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };
  if (metrics) {
    if (metrics.avg_hiring_confidence != null) payload.avg_hiring_confidence = metrics.avg_hiring_confidence;
    if (metrics.fraud_density != null) payload.fraud_density = metrics.fraud_density;
    if (metrics.dispute_rate != null) payload.dispute_rate = metrics.dispute_rate;
    if (metrics.rehire_rate != null) payload.rehire_rate = metrics.rehire_rate;
  }
  const { data: recent } = await (sb as any)
    .from("intelligence_history")
    .select("new_score")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (Array.isArray(recent) && recent.length > 0 && (payload.avg_hiring_confidence === undefined || payload.avg_hiring_confidence === null)) {
    const sum = (recent as { new_score: number }[]).reduce((a, r) => a + Number(r.new_score), 0);
    payload.avg_hiring_confidence = Math.round((sum / recent.length) * 100) / 100;
  }
  await (sb as any)
    .from("organization_intelligence")
    .upsert(payload, { onConflict: "organization_id" });
}
