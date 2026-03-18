"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type TrustOverview = {
  trustScore: number;
  verifiedReferences: number;
  coworkerMatches: number;
  completedJobs: number;
};

/**
 * Fetch trust overview for the current user: score (0–100), reference count, match count, job count.
 */
export async function getTrustOverview(): Promise<TrustOverview> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const sb = supabase as any;

    const [scoreRes, matchesRes, jobsRes] = await Promise.all([
      sb.from("trust_scores").select("score, reference_count, job_count").eq("user_id", user.id).maybeSingle(),
      sb.from("coworker_matches").select("id", { count: "exact", head: true }).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const scoreRow = scoreRes.data as { score: number; reference_count: number; job_count: number } | null;
    const matchCount = Number((matchesRes as { count?: number }).count ?? 0);
    const jobCount = Number((jobsRes as { count?: number }).count ?? 0);

    return {
      trustScore: Math.round(Number(scoreRow?.score ?? 0)),
      verifiedReferences: Number(scoreRow?.reference_count ?? 0),
      coworkerMatches: matchCount,
      completedJobs: jobCount,
    };
  } catch (e) {
    console.warn("Trust overview fetch failed", e);
    return { trustScore: 0, verifiedReferences: 0, coworkerMatches: 0, completedJobs: 0 };
  }
}
