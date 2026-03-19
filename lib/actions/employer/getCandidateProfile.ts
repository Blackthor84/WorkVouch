"use server";

import { admin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";

export type CandidateProfileData = {
  id: string;
  full_name: string | null;
  trust_score: number;
  jobs: Array<{
    company_name: string;
    job_title: string | null;
    start_date: string;
    end_date: string | null;
  }>;
};

/**
 * Get a single candidate's profile for employer view. Read-only.
 */
export async function getCandidateProfile(candidateId: string): Promise<CandidateProfileData | null> {
  await requireAuth();
  const sb = admin as any;

  const { data: profile, error: profileError } = await sb
    .from("profiles")
    .select("id, full_name")
    .eq("id", candidateId)
    .single();

  if (profileError || !profile) return null;

  const [trustRes, jobsRes] = await Promise.all([
    sb.from("trust_scores").select("score").eq("user_id", candidateId).maybeSingle(),
    sb
      .from("jobs")
      .select("company_name, job_title, title, start_date, end_date")
      .eq("user_id", candidateId)
      .eq("is_private", false)
      .order("start_date", { ascending: false }),
  ]);

  const score = Math.round(Number((trustRes.data as { score?: number })?.score ?? 0));
  const jobs = ((jobsRes.data ?? []) as { company_name: string; job_title?: string | null; title?: string | null; start_date: string; end_date: string | null }[]).map((j) => ({
    company_name: j.company_name ?? "",
    job_title: j.job_title ?? j.title ?? null,
    start_date: j.start_date,
    end_date: j.end_date,
  }));

  return {
    id: profile.id,
    full_name: profile.full_name,
    trust_score: score,
    jobs,
  };
}
