"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

const FREE_DAILY_VIEW_LIMIT = 5;

export type EmployerDashboardStats = {
  candidatesViewedToday: number;
  avgTrustScoreViewed: number;
  savedCandidatesCount: number;
  isHiringPremium: boolean;
  profileViewsRemaining: number;
};

function startOfToday(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Premium hiring access: profile flag and/or active employer subscription.
 */
export async function isEmployerHiringPremium(): Promise<boolean> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb
    .from("profiles")
    .select("role, is_premium")
    .eq("id", user.id)
    .maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "employer") return false;
  if ((profile as { is_premium?: boolean } | null)?.is_premium === true) return true;

  const { data: acct } = await sb
    .from("employer_accounts")
    .select("subscription_status")
    .eq("user_id", user.id)
    .maybeSingle();
  const status = (acct as { subscription_status?: string | null } | null)?.subscription_status;
  return status === "active";
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

  const isHiringPremium = await isEmployerHiringPremium();

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
  const distinctToday = [...new Set(viewList.map((v) => v.candidate_id))];
  const candidatesViewedToday = distinctToday.length;

  let avgTrustScoreViewed = 0;
  if (distinctToday.length > 0) {
    const { data: scores } = await sb
      .from("trust_scores")
      .select("user_id, score")
      .in("user_id", distinctToday);
    const arr = (scores ?? []) as { user_id: string; score: number }[];
    const sum = arr.reduce((a, r) => a + Number(r.score ?? 0), 0);
    avgTrustScoreViewed = arr.length > 0 ? Math.round(sum / arr.length) : 0;
  }

  const profileViewsRemaining = isHiringPremium
    ? 999
    : Math.max(0, FREE_DAILY_VIEW_LIMIT - distinctToday.length);

  return {
    candidatesViewedToday,
    avgTrustScoreViewed,
    savedCandidatesCount: savedCount ?? 0,
    isHiringPremium,
    profileViewsRemaining,
  };
}

/**
 * Check if employer can open a candidate profile (distinct candidates / day on free tier).
 */
export async function canViewCandidateProfile(
  candidateId?: string
): Promise<{ allowed: boolean; viewsToday: number; limit: number; remaining: number }> {
  const user = await requireAuth();
  const supabase = await createClient();
  const sb = supabase as any;

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role?: string } | null)?.role;

  if (role !== "employer") {
    return { allowed: false, viewsToday: 0, limit: FREE_DAILY_VIEW_LIMIT, remaining: 0 };
  }

  const premium = await isEmployerHiringPremium();
  if (premium) {
    return { allowed: true, viewsToday: 0, limit: 999, remaining: 999 };
  }

  const since = startOfToday();
  const { data: rows } = await sb
    .from("employer_profile_views")
    .select("candidate_id")
    .eq("employer_id", user.id)
    .gte("viewed_at", since);

  const distinct = [...new Set((rows ?? []).map((r: { candidate_id: string }) => r.candidate_id))];
  const viewsToday = distinct.length;

  if (candidateId && distinct.includes(candidateId)) {
    return {
      allowed: true,
      viewsToday,
      limit: FREE_DAILY_VIEW_LIMIT,
      remaining: Math.max(0, FREE_DAILY_VIEW_LIMIT - viewsToday),
    };
  }

  const allowed = viewsToday < FREE_DAILY_VIEW_LIMIT;
  return {
    allowed,
    viewsToday,
    limit: FREE_DAILY_VIEW_LIMIT,
    remaining: allowed ? Math.max(0, FREE_DAILY_VIEW_LIMIT - viewsToday) : 0,
  };
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
