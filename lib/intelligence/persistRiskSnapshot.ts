/**
 * Persist risk snapshot to profiles.risk_snapshot.
 * Call when verification completes, dispute is resolved, or reference submitted.
 * Only writes when risk_snapshot feature is enabled (caller should check or pass enabled flag).
 */

import { calculateRiskSnapshot, type RiskSnapshotInput } from "./riskEngine";

export type { RiskSnapshotInput };

export interface PersistRiskSnapshotParams {
  profileId: string;
  candidateData: RiskSnapshotInput;
  /** Supabase admin/server client (e.g. from getSupabaseServer()). */
  supabase: unknown;
}

/**
 * Compute risk snapshot and update profiles.risk_snapshot for the given profile.
 * Does not check feature flag; caller must ensure risk_snapshot is enabled before calling.
 */
export async function persistRiskSnapshot(params: PersistRiskSnapshotParams): Promise<{ error?: unknown }> {
  const { profileId, candidateData, supabase } = params;
  const snapshot = calculateRiskSnapshot(candidateData);
  const client = supabase as { from: (t: string) => { update: (d: object) => { eq: (c: string, id: string) => Promise<{ error: unknown }> } } };
  const { error } = await client.from("profiles").update({ risk_snapshot: snapshot }).eq("id", profileId);
  return error ? { error } : {};
}
