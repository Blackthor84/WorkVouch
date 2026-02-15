/**
 * Overlap verification — collusion-resistant rules.
 * See docs/schema/trust_schema.md. No trust signal without verification.
 *
 * Rules enforced:
 * - User cannot verify themselves (DB CHECK + submitReview).
 * - User cannot verify someone who verified them (reciprocal disallowed in submitReview).
 * - Verification weight may depend on verifier trust score (low-trust = reduced power).
 * - Overlap stages: claimed → pending → independently verified → flagged.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Logical stage for overlap; derived from match_status and fraud/abuse signals. */
export type OverlapStage =
  | "claimed"             // Record exists; no match or unconfirmed
  | "pending"             // Match exists, status pending
  | "independently_verified" // Match confirmed; references count toward trust
  | "flagged";            // Fraud/abuse; freeze and audit

/**
 * Record an abuse signal for overlap fraud (e.g. repeated same-group overlaps, fake windows).
 * Call from admin or automated checks. Does not freeze trust by itself; admin or incident flow should.
 */
export async function recordOverlapAbuseSignal(params: {
  supabase?: SupabaseClient;
  matchId: string;
  signalType: string;
  severity: number;
  metadata?: Record<string, unknown>;
  isSandbox?: boolean;
}): Promise<void> {
  const sb = params.supabase ?? getSupabaseServer();
  await sb.from("abuse_signals").insert({
    session_id: null,
    signal_type: params.signalType,
    severity: Math.max(1, Math.min(5, params.severity)),
    metadata: { match_id: params.matchId, ...(params.metadata ?? {}) },
    is_sandbox: params.isSandbox ?? false,
  });
}

/**
 * Check whether a verifier is allowed to contribute (e.g. low-trust users have reduced verification power).
 * Returns a weight in [0, 1]. Caller can multiply contribution by this weight.
 */
export async function getVerifierTrustWeight(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("trust_scores")
    .select("score")
    .eq("user_id", userId)
    .maybeSingle();
  const score = (data as { score?: number } | null)?.score;
  if (score == null || score < 0) return 0;
  if (score >= 70) return 1;
  if (score >= 40) return 0.7;
  return 0.4; // Low-trust verifiers have reduced weight
}
