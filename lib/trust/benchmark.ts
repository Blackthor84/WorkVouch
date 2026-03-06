/**
 * Industry Trust Benchmarks — derive from stored trust_scores and trust_industry_benchmarks.
 * Industry from employee_profiles.industry, profiles.industry, or employment_records.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";

export type TrustBenchmarkResult = {
  industry: string;
  userScore: number;
  industryAverage: number;
  top10Percent: number;
  percentile: number;
};

/**
 * Resolve industry for a profile: employee_profiles.industry, profiles.industry, or from employment_records.
 */
export async function getIndustryForProfile(profileId: string): Promise<string> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;

  const { data: ep } = await sb
    .from("employee_profiles")
    .select("industry")
    .eq("profile_id", profileId)
    .maybeSingle();
  const epIndustry = (ep as { industry?: string } | null)?.industry;
  if (epIndustry && String(epIndustry).trim()) return String(epIndustry).trim();

  const { data: p } = await sb
    .from("profiles")
    .select("industry")
    .eq("id", profileId)
    .maybeSingle();
  const pIndustry = (p as { industry?: string } | null)?.industry;
  if (pIndustry && String(pIndustry).trim()) return String(pIndustry).trim();

  const { data: recs } = await sb
    .from("employment_records")
    .select("company_name")
    .eq("user_id", profileId)
    .limit(1);
  if (Array.isArray(recs) && recs.length > 0) {
    return "General";
  }
  return "Unknown";
}

/**
 * Get stored trust score for profile (from trust_scores table). Returns 0 if none.
 */
export async function getStoredTrustScore(profileId: string): Promise<number> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
  const { data } = await sb
    .from("trust_scores")
    .select("score")
    .eq("user_id", profileId)
    .maybeSingle();
  const score = (data as { score?: number } | null)?.score;
  return typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
}

/**
 * Get benchmark row for industry (from trust_industry_benchmarks).
 */
export async function getIndustryBenchmark(
  industry: string
): Promise<{ avg_score: number; top_10_percent: number } | null> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
  const key = industry && String(industry).trim() ? String(industry).trim() : "Unknown";
  const { data } = await sb
    .from("trust_industry_benchmarks")
    .select("avg_score, top_10_percent")
    .eq("industry", key)
    .maybeSingle();
  return data as { avg_score: number; top_10_percent: number } | null;
}

/**
 * Compute percentile of user within industry cohort (from trust_scores + industry).
 * Returns 0–100: percentage of profiles in same industry with score <= userScore.
 */
export async function getPercentileInIndustry(
  _profileId: string,
  industry: string,
  userScore: number
): Promise<number> {
  const sb = getSupabaseServer() as ReturnType<typeof getSupabaseServer>;
  const key = industry && String(industry).trim() ? String(industry).trim() : "Unknown";
  const profileIds = await getProfileIdsInIndustry(sb, key);
  if (profileIds.length === 0) return 50;

  const { data: scores, error } = await sb
    .from("trust_scores")
    .select("score")
    .in("user_id", profileIds);

  if (error || !Array.isArray(scores) || scores.length === 0) {
    return 50;
  }

  const list = (scores as { score?: number }[]).map((r) =>
    typeof r.score === "number" ? r.score : 0
  );
  const countBelowOrEqual = list.filter((s) => s <= userScore).length;
  const total = list.length;
  if (total === 0) return 50;
  return Math.round((countBelowOrEqual / total) * 100);
}

async function getProfileIdsInIndustry(
  sb: ReturnType<typeof getSupabaseServer>,
  industry: string
): Promise<string[]> {
  const { data: ep } = await sb
    .from("employee_profiles")
    .select("profile_id")
    .eq("industry", industry);
  if (Array.isArray(ep) && ep.length > 0) {
    return (ep as { profile_id: string }[]).map((r) => r.profile_id);
  }
  const { data: p } = await sb
    .from("profiles")
    .select("id")
    .eq("industry", industry);
  if (Array.isArray(p) && p.length > 0) {
    return (p as { id: string }[]).map((r) => r.id);
  }
  return [];
}

/**
 * Full benchmark result for a profile: industry, userScore, industry avg, top 10%, percentile.
 */
export async function getTrustBenchmark(profileId: string): Promise<TrustBenchmarkResult> {
  const [industry, userScore, benchmark] = await Promise.all([
    getIndustryForProfile(profileId),
    getStoredTrustScore(profileId),
    getIndustryForProfile(profileId).then((ind) => getIndustryBenchmark(ind)),
  ]);

  const industryAverage = benchmark?.avg_score ?? 0;
  const top10Percent = benchmark?.top_10_percent ?? 0;
  const percentile = await getPercentileInIndustry(profileId, industry, userScore);

  return {
    industry: industry || "Unknown",
    userScore,
    industryAverage: Number(industryAverage),
    top10Percent: Number(top10Percent),
    percentile,
  };
}
