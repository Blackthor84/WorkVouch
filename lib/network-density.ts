/**
 * Enterprise network density and fraud confidence. Server-side only.
 * Accepts candidateId; computes density and fraud signal; persists to network_density_index.
 * Never exposes to employees. Fail gracefully; neutral if insufficient data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  calculateNetworkDensity,
  detectSuspiciousClusters,
  type ReferenceEdge,
} from "@/lib/intelligence/networkMetrics";

const MODEL_VERSION = "1";

function safeLog(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[network-density:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

async function loadReferenceEdges(
  supabase: ReturnType<typeof getSupabaseServer>,
  candidateId: string
): Promise<{ edges: ReferenceEdge[]; totalPossible: number }> {
  try {
    const [refsRes, recordsRes] = await Promise.all([
      supabase
        .from("employment_references")
        .select("reviewer_id, reviewed_user_id, created_at")
        .eq("reviewed_user_id", candidateId),
      supabase.from("employment_records").select("id").eq("user_id", candidateId),
    ]);
    const refs = (refsRes.data ?? []) as { reviewer_id: string; reviewed_user_id: string; created_at?: string }[];
    const records = (recordsRes.data ?? []) as { id: string }[];
    const edges: ReferenceEdge[] = refs.map((r) => ({
      fromUserId: r.reviewer_id,
      toUserId: r.reviewed_user_id,
      respondedAt: r.created_at,
      requestedAt: r.created_at,
    }));
    const totalPossible = Math.max(records.length * 2, 1);
    return { edges, totalPossible };
  } catch (e) {
    safeLog("loadReferenceEdges", e);
    return { edges: [], totalPossible: 1 };
  }
}

/** Optional simulation/sandbox context: tag rows with simulation_session_id and/or sandbox_id. */
export type SimulationContext = { simulationSessionId?: string; expiresAt: string; sandboxId?: string } | null | undefined;

export async function computeAndPersistNetworkDensity(
  candidateId: string,
  simulationContext?: SimulationContext
): Promise<{ densityScore: number; fraudConfidence: number; breakdown: Record<string, number> } | null> {
  try {
    const supabase = getSupabaseServer();
    const { edges, totalPossible } = await loadReferenceEdges(supabase, candidateId);
    const densityRaw = calculateNetworkDensity({
      userId: candidateId,
      references: edges,
      totalPossibleReferences: totalPossible,
    });
    const fraudRaw = detectSuspiciousClusters({
      userId: candidateId,
      references: edges,
      totalPossibleReferences: totalPossible,
    });
    const densityScore = Math.round(densityRaw * 10000) / 10000;
    const fraudConfidence = Math.round(fraudRaw * 10000) / 10000;
    const breakdown = {
      referenceCount: edges.length,
      totalPossibleReferences: totalPossible,
      densityRaw,
      fraudSignalRaw: fraudRaw,
    };

    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      candidate_id: candidateId,
      model_version: MODEL_VERSION,
      density_score: densityScore,
      fraud_confidence: fraudConfidence,
      breakdown: breakdown as unknown as Record<string, unknown>,
      updated_at: now,
    };
    if (simulationContext) {
      row.expires_at = simulationContext.expiresAt;
      if (simulationContext.simulationSessionId) {
        row.is_simulation = true;
        row.simulation_session_id = simulationContext.simulationSessionId;
      }
      if (simulationContext.sandboxId) row.sandbox_id = simulationContext.sandboxId;
    }
    const { data: existing } = await supabase
      .from("network_density_index")
      .select("id")
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from("network_density_index").update(row).eq("id", (existing as { id: string }).id);
    } else {
      const insertRow: Record<string, unknown> = {
        candidate_id: candidateId,
        model_version: MODEL_VERSION,
        density_score: densityScore,
        fraud_confidence: fraudConfidence,
        breakdown: breakdown as unknown as Record<string, unknown>,
      };
      if (simulationContext) {
        insertRow.expires_at = simulationContext.expiresAt;
        if (simulationContext.simulationSessionId) {
          insertRow.is_simulation = true;
          insertRow.simulation_session_id = simulationContext.simulationSessionId;
        }
        if (simulationContext.sandboxId) insertRow.sandbox_id = simulationContext.sandboxId;
      }
      await supabase.from("network_density_index").insert(insertRow);
    }
    return { densityScore, fraudConfidence, breakdown };
  } catch (e) {
    safeLog("computeAndPersistNetworkDensity", e);
    return null;
  }
}
