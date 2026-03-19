"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const FREE_DAILY_VIEW_LIMIT = 5;

export type EmployerDashboardStats = {
  candidatesViewedToday: number;
  avgTrustScoreViewed: number;
  savedCandidatesCount: number;
};

function startOfToday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Get dashboard stats for employer: views today, avg trust of viewed, saved count.
 */
export async function getEmployerDashboardStats(): Promise<EmployerDashboardStats | null> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "employer") return null;

  const since = startOfToday();

  const [
    { data: views },
    { count: savedCount },
  ] = await Promise.all([
    sb
      .from("employer_profile_views")
      .select("candidate_id")
      .eq("employer_id", user.id)
      .gte("viewed_at", since),
    sb
      .from("saved_candidates")
      .select("id", { count: "exact", head: true })
      .eq("employer_id", user.id),
  ]);

  const viewList = (views ?? []) as { candidate_id: string }[];
  const candidatesViewedToday = viewList.length;

  let avgTrustScoreViewed = 0;
  if (viewList.length > 0) {
    const candidateIds = [...new Set(viewList.map((v) => v.candidate_id))];
    const { data: scores } = await sb
      .from("trust_scores")
      .select("user_id, score")
      .in("user_id", candidateIds);
    const arr = (scores ?? []) as { user_id: string; score: number }[];
    const sum = arr.reduce((a, r) => a + Number(r.score ?? 0), 0);
    avgTrustScoreViewed = arr.length > 0 ? Math.round(sum / arr.length) : 0;
  }

  return {
    candidatesViewedToday,
    avgTrustScoreViewed,
    savedCandidatesCount: savedCount ?? 0,
  };
}

/**
 * Check if employer can view a candidate profile (under free daily limit or premium).
 */
export async function canViewCandidateProfile(): Promise<{ allowed: boolean; viewsToday: number; limit: number }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb.from("profiles").select("role, is_premium").eq("id", user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  const isPremium = (profile as { is_premium?: boolean } | null)?.is_premium ?? false;

  if (role !== "employer") {
    return { allowed: false, viewsToday: 0, limit: FREE_DAILY_VIEW_LIMIT };
  }

  if (isPremium) {
    return { allowed: true, viewsToday: 0, limit: 999 };
  }

  const since = startOfToday();
  const { count } = await sb
    .from("employer_profile_views")
    .select("id", { count: "exact", head: true })
    .eq("employer_id", user.id)
    .gte("viewed_at", since);

  const viewsToday = count ?? 0;
  const allowed = viewsToday < FREE_DAILY_VIEW_LIMIT;
  return { allowed, viewsToday, limit: FREE_DAILY_VIEW_LIMIT };
}

/**
 * Record that the current employer viewed a candidate profile. Call after a successful view.
 */
export async function recordCandidateProfileView(candidateId: string): Promise<void> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "employer") return;

  await sb.from("employer_profile_views").insert({
    employer_id: user.id,
    candidate_id: candidateId,
  });
}

export type RecentView = { candidate_id: string; viewed_at: string; candidate_name: string | null };

/**
 * Recent profile views for dashboard "Recent Activity".
 */
export async function getRecentProfileViews(limit = 5): Promise<RecentView[]> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "employer") return [];

  const { data: views } = await sb
    .from("employer_profile_views")
    .select("candidate_id, viewed_at")
    .eq("employer_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (!views?.length) return [];

  const ids = [...new Set((views as { candidate_id: string }[]).map((v) => v.candidate_id))];
  const { data: profiles } = await sb.from("profiles").select("id, full_name").in("id", ids);
  const nameMap: Record<string, string | null> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string | null }) => {
    nameMap[p.id] = p.full_name ?? null;
  });

  return (views as { candidate_id: string; viewed_at: string }[]).map((v) => ({
    candidate_id: v.candidate_id,
    viewed_at: v.viewed_at,
    candidate_name: nameMap[v.candidate_id] ?? null,
  }));
}
