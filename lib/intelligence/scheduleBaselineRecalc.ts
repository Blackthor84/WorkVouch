/**
 * Schedule industry + employer baseline recalc when behavioral_profile_vector updates
 * or employee add/remove. Async; never blocks. No mock data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { resolveIndustryKey } from "@/lib/industry-normalization";
import { recalculateIndustryBaseline } from "./industryBehavioralBaseline";
import { scheduleEmployerBaselineRecalc } from "./employerBehavioralBaseline";
import { logIntel, LOG_TAGS } from "@/lib/core/intelligence";

/**
 * After a candidate's behavioral vector is updated (e.g. review added), schedule
 * industry baseline recalc for their industry and employer baseline recalc for each
 * employer they are linked to. Returns a Promise; logs INTEL_FAIL on failure.
 */
export async function scheduleBaselineRecalcForCandidate(
  candidateId: string
): Promise<void> {
  try {
    const supabase = getSupabaseServer();
    const [profileRes, recordsRes] = await Promise.all([
      supabase.from("profiles").select("industry, industry_key").eq("id", candidateId).maybeSingle(),
      supabase
        .from("employment_records")
        .select("marked_by_employer_id")
        .eq("user_id", candidateId)
        .in("verification_status", ["verified", "matched"]),
    ]);
    const profile = profileRes.data as { industry?: string; industry_key?: string } | null;
    const industryKey = resolveIndustryKey(profile?.industry_key, profile?.industry);
    await recalculateIndustryBaseline(industryKey);
    const recs = (recordsRes.data ?? []) as { marked_by_employer_id?: string | null }[];
    const employerIds = [...new Set(recs.map((r) => r.marked_by_employer_id).filter(Boolean) as string[])];
    for (const employerId of employerIds) {
      scheduleEmployerBaselineRecalc(employerId);
    }
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    logIntel({
      tag: LOG_TAGS.INTEL_FAIL,
      context: "schedule_baseline_recalc",
      message: "Baseline recalc failed",
      candidateId,
      error: errMsg,
    });
    throw e;
  }
}
