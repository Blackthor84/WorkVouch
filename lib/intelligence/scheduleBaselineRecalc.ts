/**
 * Schedule industry + employer baseline recalc when behavioral_profile_vector updates
 * or employee add/remove. Async; never blocks. No mock data.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { resolveIndustryKey } from "@/lib/industry-normalization";
import { recalculateIndustryBaseline } from "./industryBehavioralBaseline";
import { scheduleEmployerBaselineRecalc } from "./employerBehavioralBaseline";

function safeLog(err: unknown): void {
  try {
    if (process.env.NODE_ENV === "development" && typeof console !== "undefined" && console.error) {
      console.error("[scheduleBaselineRecalc]", err);
    }
  } catch {
    // no-op
  }
}

/**
 * After a candidate's behavioral vector is updated (e.g. review added), schedule
 * industry baseline recalc for their industry and employer baseline recalc for each
 * employer they are linked to. Does not block.
 */
export function scheduleBaselineRecalcForCandidate(candidateId: string): void {
  (async () => {
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
      recalculateIndustryBaseline(industryKey).catch(safeLog);
      const recs = (recordsRes.data ?? []) as { marked_by_employer_id?: string | null }[];
      const employerIds = [...new Set(recs.map((r) => r.marked_by_employer_id).filter(Boolean) as string[])];
      for (const employerId of employerIds) {
        scheduleEmployerBaselineRecalc(employerId);
      }
    } catch (e) {
      safeLog(e);
    }
  })();
}
