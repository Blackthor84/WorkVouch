"use server";

import { admin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";

export type EmployerCandidateRow = {
  id: string;
  full_name: string | null;
  trust_score: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

/**
 * Search candidates for employer dashboard. Read-only.
 * Only callable when profile.role === 'employer'.
 */
export async function searchCandidatesForEmployer(params: {
  search?: string;
  company?: string;
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

  // Build profile query: only employees (role = employee or null), exclude self. Read-only via admin.
  let profileQuery = sb
    .from("profiles")
    .select("id, full_name")
    .neq("id", user.id);

  profileQuery = profileQuery.or("role.eq.employee,role.is.null");
  if (params.search?.trim()) {
    const term = params.search.trim();
    profileQuery = profileQuery.ilike("full_name", `%${term}%`);
  }

  const { data: profiles, error: profileError } = await profileQuery.limit(50);

  if (profileError || !profiles?.length) return [];

  const ids = (profiles as { id: string }[]).map((p) => p.id);

  const [trustRes, jobsRes] = await Promise.all([
    sb.from("trust_scores").select("user_id, score").in("user_id", ids),
    sb
      .from("jobs")
      .select("user_id, company_name, job_title, title, start_date, end_date")
      .in("user_id", ids)
      .eq("is_private", false)
      .order("start_date", { ascending: false }),
  ]);

  const trustMap: Record<string, number> = {};
  for (const row of (trustRes.data ?? []) as { user_id: string; score: number }[]) {
    trustMap[row.user_id] = Number(row.score ?? 0);
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
    const score = Math.round(trustMap[p.id] ?? 0);
    if (params.minTrust != null && score < params.minTrust) continue;
    if (params.maxTrust != null && score > params.maxTrust) continue;

    const userJobs = jobsByUser[p.id] ?? [];
    if (params.company?.trim()) {
      const companyLower = params.company.trim().toLowerCase();
      const filtered = userJobs.filter((j) => j.company_name.toLowerCase().includes(companyLower));
      if (filtered.length === 0) continue;
    }

    results.push({
      id: p.id,
      full_name: p.full_name,
      trust_score: score,
      jobs: userJobs,
    });
  }

  return results.sort((a, b) => b.trust_score - a.trust_score);
}
