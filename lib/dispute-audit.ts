/**
 * Dispute audit logging and trust score hooks.
 * All changes logged to audit_logs. Trust score recalc server-side only.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { recalculateTrustScore } from "@/lib/trustScore";

export type AuditEntity =
  | "trust_score"
  | "fraud_flag"
  | "rehire_status"
  | "dispute"
  | "employment_record"
  | "reference";

export async function logAudit(params: {
  entityType: AuditEntity;
  entityId: string;
  changedBy: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  changeReason?: string;
}): Promise<void> {
  const sb = getSupabaseServer() as any;
  await sb.from("audit_logs").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    changed_by: params.changedBy,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    change_reason: params.changeReason ?? null,
  });
}

/**
 * After dispute resolution: recalc trust score when resolution affects
 * employment verification, reference removal, or fraud flag deletion.
 */
export async function onDisputeResolvedAffectsTrust(params: {
  userId: string;
  disputeType: string;
  adminId: string;
}): Promise<void> {
  const { userId, disputeType } = params;
  const affectsScore =
    disputeType === "employment" ||
    disputeType === "reference" ||
    disputeType === "fraud_flag" ||
    disputeType === "trust_score";
  if (affectsScore) {
    await recalculateTrustScore(userId);
  }
}

/**
 * Update profile transparency fields: active_dispute_count, trust_score_under_review.
 * Call when dispute opened/closed or status changes.
 */
export async function refreshUserDisputeTransparency(userId: string): Promise<void> {
  const sb = getSupabaseServer() as any;
  const { count: openCount } = await sb
    .from("disputes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["open", "under_review"]);
  const activeDisputeCount = openCount ?? 0;

  const { data: underReview } = await sb
    .from("disputes")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["open", "under_review"])
    .in("dispute_type", ["trust_score", "fraud_flag"])
    .limit(1)
    .maybeSingle();
  const trustScoreUnderReview = !!underReview;

  await sb
    .from("profiles")
    .update({
      active_dispute_count: activeDisputeCount,
      trust_score_under_review: trustScoreUnderReview,
    })
    .eq("id", userId);
}
