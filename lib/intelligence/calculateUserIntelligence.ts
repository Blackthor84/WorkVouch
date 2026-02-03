/**
 * Background calculation for profile_strength and career_health_score.
 * Updates intelligence_snapshots. Never throws; logs and returns on error.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { getOrCreateSnapshot } from "./getOrCreateSnapshot";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n))));

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Recalculate scores and update intelligence_snapshots for the user.
 * Silent: never throws. Log in dev only.
 */
export async function calculateUserIntelligence(userId: string): Promise<void> {
  try {
    const supabase = getSupabaseServer() as any;

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
    const snapshot = await getOrCreateSnapshot(userId);

    const { error } = await supabase
      .from("intelligence_snapshots")
      .update({
        profile_strength,
        career_health_score,
        tenure_score,
        reference_score,
        rehire_score,
        dispute_score,
        network_density_score,
        last_calculated_at: now,
        updated_at: now,
      })
      .eq("user_id", userId);

    if (error) {
      if (snapshot.id) {
        await supabase.from("intelligence_snapshots").update({
          profile_strength,
          career_health_score,
          tenure_score,
          reference_score,
          rehire_score,
          dispute_score,
          network_density_score,
          last_calculated_at: now,
          updated_at: now,
        }).eq("id", snapshot.id);
      } else {
        await supabase.from("intelligence_snapshots").insert({
          user_id: userId,
          profile_strength,
          career_health_score,
          tenure_score,
          reference_score,
          rehire_score,
          dispute_score,
          network_density_score,
          last_calculated_at: now,
          created_at: now,
          updated_at: now,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`Intelligence recalculated for user ${userId}`);
    }
  } catch (_e) {
    // silent
  }
}
