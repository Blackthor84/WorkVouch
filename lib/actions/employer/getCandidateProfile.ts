"use server";

import { admin } from "@/lib/supabase-admin";
import { requireAuth } from "@/lib/auth";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve candidate route param to profile id. Accepts either UUID or public_slug.
 */
export async function resolveCandidateId(param: string): Promise<string | null> {
  if (!param?.trim()) return null;
  const p = param.trim();
  if (UUID_REGEX.test(p)) return p;
  const sb = admin as any;
  const { data: row } = await sb.from("profiles").select("id").eq("public_slug", p).maybeSingle();
  return (row as { id: string } | null)?.id ?? null;
}

export type CandidateProfileData = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  trust_score: number;
  reference_count: number;
  jobs: Array<{
    company_name: string;
    job_title: string | null;
    start_date: string;
    end_date: string | null;
  }>;
  references: Array<{
    rating: number;
    feedback: string | null;
    author_name: string | null;
    company_name: string | null;
    created_at: string;
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
    .select("id, full_name, industry, professional_summary")
    .eq("id", candidateId)
    .single();

  if (profileError || !profile) return null;

  const [trustRes, jobsRes, refFeedbackRes] = await Promise.all([
    sb.from("trust_scores").select("score, reference_count").eq("user_id", candidateId).maybeSingle(),
    sb
      .from("jobs")
      .select("company_name, job_title, title, start_date, end_date")
      .eq("user_id", candidateId)
      .eq("is_private", false)
      .order("start_date", { ascending: false }),
    sb
      .from("reference_feedback")
      .select("id, rating, feedback, created_at, author_id, request_id")
      .eq("target_user_id", candidateId)
      .order("created_at", { ascending: false }),
  ]);

  const score = Math.round(Number((trustRes.data as { score?: number })?.score ?? 0));
  const reference_count = Number((trustRes.data as { reference_count?: number })?.reference_count ?? 0);
  const jobs = ((jobsRes.data ?? []) as { company_name: string; job_title?: string | null; title?: string | null; start_date: string; end_date: string | null }[]).map((j) => ({
    company_name: j.company_name ?? "",
    job_title: j.job_title ?? j.title ?? null,
    start_date: j.start_date,
    end_date: j.end_date,
  }));

  const refRows = (refFeedbackRes.data ?? []) as { id: string; rating: number; feedback: string | null; created_at: string; author_id: string; request_id: string }[];
  const authorIds = [...new Set(refRows.map((r) => r.author_id))];
  const requestIds = [...new Set(refRows.map((r) => r.request_id))];

  let authorNames: Record<string, string | null> = {};
  let companyByRequest: Record<string, string | null> = {};
  if (authorIds.length > 0) {
    const { data: authors } = await sb.from("profiles").select("id, full_name").in("id", authorIds);
    (authors ?? []).forEach((a: { id: string; full_name: string | null }) => { authorNames[a.id] = a.full_name; });
  }
  if (requestIds.length > 0) {
    const { data: reqs } = await sb.from("reference_requests").select("id, coworker_match_id").in("id", requestIds);
    const matchIds = [...new Set(((reqs ?? []) as { coworker_match_id: string }[]).map((r) => r.coworker_match_id))];
    if (matchIds.length > 0) {
      const { data: matches } = await sb.from("coworker_matches").select("id, company_name").in("id", matchIds);
      const companyByMatch: Record<string, string | null> = {};
      (matches ?? []).forEach((m: { id: string; company_name: string | null }) => { companyByMatch[m.id] = m.company_name ?? null; });
      (reqs ?? []).forEach((r: { id: string; coworker_match_id: string }) => {
        companyByRequest[r.id] = companyByMatch[r.coworker_match_id] ?? null;
      });
    }
  }

  const references = refRows.map((r) => ({
    rating: r.rating,
    feedback: r.feedback,
    author_name: authorNames[r.author_id] ?? null,
    company_name: companyByRequest[r.request_id] ?? null,
    created_at: r.created_at,
  }));

  const refCount = references.length > 0 ? references.length : reference_count;

  return {
    id: profile.id,
    full_name: profile.full_name,
    headline: (profile as { industry?: string | null }).industry ?? null,
    bio: (profile as { professional_summary?: string | null }).professional_summary ?? null,
    trust_score: score,
    reference_count: refCount,
    jobs,
    references,
  };
}
