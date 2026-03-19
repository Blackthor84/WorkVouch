"use server";

import { admin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";

export type EmployerCandidateRow = {
  id: string;
  full_name: string | null;
  headline: string | null;
  trust_score: number;
  reference_count: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

/**
 * Search candidates for employer dashboard. Read-only.
 * Only callable when profile.role === 'employer'.
 */
export async function searchCandidatesForEmployer(params: {
  search?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  minTrust?: number;
  maxTrust?: number;
}): Promise<EmployerCandidateRow[]> {
  const user = await requireAuth();
  const sb = admin as any;

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if ((profile as { role?: string } | null)?.role !== "employer") {
    return [];
  }

  let profileQuery = sb
    .from("profiles")
    .select("id, full_name, state")
    .neq("id", user.id);

  profileQuery = profileQuery.or("role.eq.employee,role.is.null");
  if (params.search?.trim()) {
    profileQuery = profileQuery.ilike("full_name", `%${params.search.trim()}%`);
  }
  if (params.location?.trim()) {
    profileQuery = profileQuery.ilike("state", `%${params.location.trim()}%`);
  }

  const { data: profiles, error: profileError } = await profileQuery.limit(50);

  if (profileError || !profiles?.length) return [];

  const ids = (profiles as { id: string }[]).map((p) => p.id);

  const [trustRes, jobsRes, refCountRes] = await Promise.all([
    sb.from("trust_scores").select("user_id, score").in("user_id", ids),
    sb
      .from("jobs")
      .select("user_id, company_name, job_title, title, start_date, end_date")
      .in("user_id", ids)
      .eq("is_private", false)
      .order("start_date", { ascending: false }),
    sb.from("reference_feedback").select("target_user_id").in("target_user_id", ids),
  ]);

  const trustMap: Record<string, number> = {};
  for (const row of (trustRes.data ?? []) as { user_id: string; score: number }[]) {
    trustMap[row.user_id] = Number(row.score ?? 0);
  }
  const refCountByUser: Record<string, number> = {};
  for (const row of (refCountRes.data ?? []) as { target_user_id: string }[]) {
    refCountByUser[row.target_user_id] = (refCountByUser[row.target_user_id] ?? 0) + 1;
  }

  const jobsByUser: Record<string, Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>> = {};
  for (const row of (jobsRes.data ?? []) as { user_id: string; company_name: string; job_title?: string | null; title?: string | null; start_date: string; end_date: string | null }[]) {
    if (!jobsByUser[row.user_id]) jobsByUser[row.user_id] = [];
    jobsByUser[row.user_id].push({
      company_name: row.company_name ?? "",
      job_title: row.job_title ?? row.title ?? null,
      start_date: row.start_date,
      end_date: row.end_date,
    });
  }

  const results: EmployerCandidateRow[] = [];

  for (const p of profiles as { id: string; full_name: string | null }[]) {
    const score = trustMap[p.id] ?? 0;
    const reference_count = refCountByUser[p.id] ?? 0;
    if (params.minTrust != null && score < params.minTrust) continue;
    if (params.maxTrust != null && score > params.maxTrust) continue;

    const userJobs = jobsByUser[p.id] ?? [];
    if (params.company?.trim()) {
      const companyLower = params.company.trim().toLowerCase();
      const filtered = userJobs.filter((j) => j.company_name.toLowerCase().includes(companyLower));
      if (filtered.length === 0) continue;
    }
    if (params.jobTitle?.trim()) {
      const titleLower = params.jobTitle.trim().toLowerCase();
      const filtered = userJobs.filter((j) => (j.job_title ?? "").toLowerCase().includes(titleLower));
      if (filtered.length === 0) continue;
    }

    results.push({
      id: p.id,
      full_name: p.full_name,
      headline: null,
      trust_score: Math.round(score),
      reference_count,
      jobs: userJobs,
    });
  }

  return results.sort((a, b) => b.trust_score - a.trust_score);
}
