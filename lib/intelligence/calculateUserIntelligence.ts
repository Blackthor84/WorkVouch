/**
 * Background calculation for profile_strength and career_health_score.
 * Updates intelligence_snapshots. Never throws; returns on error.
 * When simulationContext is provided, validates session and tags rows with simulation_session_id.
 */

import type { SimulationContext } from "@/lib/simulation-lab";
import { validateSessionForWrite } from "@/lib/simulation-lab";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrCreateSnapshot } from "./getOrCreateSnapshot";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

/**
 * Recalculate scores and update intelligence_snapshots for the user.
 * If simulationContext is provided, validates session is running before writes and tags rows.
 */
export async function calculateUserIntelligence(
  userId: string,
  simulationContext?: SimulationContext | null
): Promise<void> {
  try {
    if (simulationContext) {
      await validateSessionForWrite(simulationContext.simulationSessionId);
    }

    const supabase = getSupabaseServer();

    const [jobsRes, refsRes, disputesRes, rehireRes] = await Promise.all([
      supabase.from("employment_records").select("id, start_date, end_date, verification_status").eq("user_id", userId),
      supabase.from("employment_references").select("id").eq("reviewed_user_id", userId),
      supabase.from("compliance_disputes").select("id, status").eq("profile_id", userId),
      supabase.from("rehire_recommendations").select("id").eq("user_id", userId).eq("rehire_eligible", true),
    ]);

    const jobs = Array.isArray(jobsRes.data) ? jobsRes.data : [];
    const refs = Array.isArray(refsRes.data) ? refsRes.data : [];
    const disputes = Array.isArray(disputesRes.data) ? disputesRes.data : [];
    const rehireRows = Array.isArray(rehireRes.data) ? rehireRes.data : [];

    const verifiedJobs = jobs.filter((j: { verification_status?: string }) => j.verification_status === "verified");
    const totalTenureMonths = jobs.reduce((sum: number, j: { start_date?: string; end_date?: string | null }) => {
      const s = j.start_date ? new Date(j.start_date).getTime() : 0;
      const e = j.end_date ? new Date(j.end_date).getTime() : Date.now();
      if (s && e >= s) sum += (e - s) / (30.44 * 24 * 60 * 60 * 1000);
      return sum;
    }, 0);
    const resolvedDisputes = disputes.filter((d: { status?: string }) => d.status === "Resolved").length;
    const openDisputes = disputes.length - resolvedDisputes;

    const tenure_score = clamp(Math.min(100, (totalTenureMonths / 24) * 100));
    const reference_score = jobs.length > 0 ? clamp((refs.length / Math.max(jobs.length, 1)) * 50 + Math.min(50, refs.length * 10)) : (refs.length > 0 ? 50 : 0);
    const rehire_score = rehireRows.length > 0 ? clamp(50 + 25 + Math.min(25, verifiedJobs.length * 5)) : clamp(50 + Math.min(25, verifiedJobs.length * 5));
    const dispute_score = clamp(100 - openDisputes * 25 - disputes.length * 5);
    const network_density_score = jobs.length > 0 ? clamp((refs.length / Math.max(jobs.length * 2, 1)) * 100) : 0;

    const profile_strength = clamp(
      tenure_score * 0.25 +
        reference_score * 0.25 +
        rehire_score * 0.2 +
        network_density_score * 0.15 +
        dispute_score * 0.15
    );
    const career_health_score = clamp(
      tenure_score * 0.4 + reference_score * 0.2 + rehire_score * 0.2 + dispute_score * 0.2
    );

    const now = new Date().toISOString();
    const snapshot = await getOrCreateSnapshot(userId, simulationContext);

    const baseUpdate: Record<string, unknown> = {
      profile_strength,
      career_health_score,
      tenure_score,
      reference_score,
      rehire_score,
      dispute_score,
      network_density_score,
      last_calculated_at: now,
      updated_at: now,
    };
    if (simulationContext) {
      baseUpdate.is_simulation = true;
      baseUpdate.simulation_session_id = simulationContext.simulationSessionId;
      baseUpdate.expires_at = simulationContext.expiresAt;
    }

    const { error } = await supabase
      .from("intelligence_snapshots")
      .update(baseUpdate as Record<string, unknown>)
      .eq("user_id", userId);

    if (error) {
      if (snapshot.id) {
        await supabase.from("intelligence_snapshots").update(baseUpdate as Record<string, unknown>).eq("id", snapshot.id);
      } else {
        const insertRow: Record<string, unknown> = {
          user_id: userId,
          ...baseUpdate,
          created_at: now,
        };
        await supabase.from("intelligence_snapshots").insert(insertRow as Record<string, unknown>);
      }
    }
  } catch (_e) {
    // silent
  }
}
