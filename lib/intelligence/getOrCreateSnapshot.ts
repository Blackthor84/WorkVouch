/**
 * Get or create intelligence_snapshots row for a user.
 * Uses service role. Never returns null; returns structured fallback if missing/fail.
 * When simulationContext is provided, new rows are tagged with simulation_session_id and expires_at.
 */

import type { SimulationContext } from "@/lib/simulation-lab";
import { getSupabaseServer } from "@/lib/supabase/admin";

export interface IntelligenceSnapshotRow {
  id: string;
  user_id: string;
  profile_strength: number;
  career_health_score: number;
  tenure_score: number;
  reference_score: number;
  rehire_score: number;
  dispute_score: number;
  network_density_score: number;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
  model_version?: string;
}

const ZERO_SNAPSHOT = (userId: string): IntelligenceSnapshotRow => ({
  id: "",
  user_id: userId,
  profile_strength: 0,
  career_health_score: 0,
  tenure_score: 0,
  reference_score: 0,
  rehire_score: 0,
  dispute_score: 0,
  network_density_score: 0,
  last_calculated_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  model_version: "v1.0-enterprise",
});

/**
 * Get existing snapshot or insert default row. Never returns null.
 * When simulationContext is provided, insert is tagged with is_simulation, simulation_session_id, expires_at.
 */
export async function getOrCreateSnapshot(
  userId: string,
  simulationContext?: SimulationContext | null
): Promise<IntelligenceSnapshotRow> {
  try {
    const supabase = getSupabaseServer();

    const { data: existing, error: selectError } = await supabase
      .from("intelligence_snapshots")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!selectError && existing && typeof existing === "object") {
      return normalizeRow(existing as Record<string, unknown>);
    }

    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      user_id: userId,
      profile_strength: 0,
      career_health_score: 0,
      tenure_score: 0,
      reference_score: 0,
      rehire_score: 0,
      dispute_score: 0,
      network_density_score: 0,
      last_calculated_at: null,
      created_at: now,
      updated_at: now,
      model_version: "v1.0-enterprise",
    };
    if (simulationContext) {
      row.is_simulation = true;
      row.simulation_session_id = simulationContext.simulationSessionId;
      row.expires_at = simulationContext.expiresAt;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("intelligence_snapshots")
      .insert(row as Record<string, unknown>)
      .select()
      .single();

    if (!insertError && inserted && typeof inserted === "object") {
      return normalizeRow(inserted as Record<string, unknown>);
    }

    return ZERO_SNAPSHOT(userId);
  } catch (e) {
    return ZERO_SNAPSHOT(userId);
  }
}

function normalizeRow(raw: Record<string, unknown>): IntelligenceSnapshotRow {
  const num = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: str(raw.id),
    user_id: str(raw.user_id),
    profile_strength: num(raw.profile_strength),
    career_health_score: num(raw.career_health_score),
    tenure_score: num(raw.tenure_score),
    reference_score: num(raw.reference_score),
    rehire_score: num(raw.rehire_score),
    dispute_score: num(raw.dispute_score),
    network_density_score: num(raw.network_density_score),
    last_calculated_at: raw.last_calculated_at != null ? str(raw.last_calculated_at) : null,
    created_at: str(raw.created_at) || new Date().toISOString(),
    updated_at: str(raw.updated_at) || new Date().toISOString(),
    model_version: str(raw.model_version) || "v1.0-enterprise",
  };
}
