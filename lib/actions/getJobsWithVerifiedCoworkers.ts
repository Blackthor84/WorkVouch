"use server";

import { createClient } from "@/lib/supabase/server";

const VERIFIED_STATUSES = ["accepted", "verified", "confirmed"] as const;

function normalizeCompany(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().trim();
}

export type JobWithCoworkers = {
  job: {
    id: string;
    company_name: string;
    role: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  coworkers: Array<{
    id: string;
    full_name: string | null;
    profile_photo_url: string | null;
    headline: string | null;
  }>;
};

/**
 * For the current user: load jobs and verified coworker matches grouped by job (company_name).
 * Batch-fetches coworker profiles to avoid N+1.
 */
export async function getJobsWithVerifiedCoworkers(
  userId: string
): Promise<JobWithCoworkers[]> {
  const supabase = await createClient();
  const sb = supabase as any;

  const [jobsRes, matchesRes] = await Promise.all([
    sb
      .from("jobs")
      .select("id, company_name, title, job_title, start_date, end_date")
      .eq("user_id", userId)
      .order("start_date", { ascending: false }),
    sb
      .from("coworker_matches")
      .select("user_1, user_2, company_name, status")
      .or(`user_1.eq.${userId},user_2.eq.${userId}`),
  ]);

  const jobs = (jobsRes.data ?? []) as Array<{
    id: string;
    company_name: string | null;
    title?: string | null;
    job_title?: string | null;
    start_date: string | null;
    end_date: string | null;
  }>;
  const matches = (matchesRes.data ?? []) as Array<{
    user_1: string;
    user_2: string;
    company_name: string | null;
    status?: string | null;
  }>;

  const verifiedMatches = matches.filter((m) =>
    VERIFIED_STATUSES.includes((m.status ?? "") as (typeof VERIFIED_STATUSES)[number])
  );

  const otherUserIds = new Set<string>();
  const matchesByCompany = new Map<
    string,
    Array<{ otherUserId: string }>
  >();

  for (const m of verifiedMatches) {
    const otherUserId = m.user_1 === userId ? m.user_2 : m.user_1;
    const companyKey = normalizeCompany(m.company_name);
    if (!companyKey) continue;
    otherUserIds.add(otherUserId);
    const list = matchesByCompany.get(companyKey) ?? [];
    if (!list.some((x) => x.otherUserId === otherUserId)) {
      list.push({ otherUserId });
      matchesByCompany.set(companyKey, list);
    }
  }

  let profilesMap: Record<
    string,
    { id: string; full_name: string | null; profile_photo_url: string | null; headline: string | null }
  > = {};
  if (otherUserIds.size > 0) {
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, profile_photo_url, headline")
      .in("id", [...otherUserIds]);
    const list = (profiles ?? []) as Array<{
      id: string;
      full_name: string | null;
      profile_photo_url: string | null;
      headline: string | null;
    }>;
    list.forEach((p) => {
      profilesMap[p.id] = {
        id: p.id,
        full_name: p.full_name ?? null,
        profile_photo_url: p.profile_photo_url ?? null,
        headline: p.headline ?? null,
      };
    });
  }

  return jobs.map((job) => {
    const companyKey = normalizeCompany(job.company_name);
    const matchList = companyKey ? matchesByCompany.get(companyKey) ?? [] : [];
    const coworkers = matchList
      .map(({ otherUserId }) => profilesMap[otherUserId])
      .filter(Boolean) as Array<{
      id: string;
      full_name: string | null;
      profile_photo_url: string | null;
      headline: string | null;
    }>;
    const role = job.title ?? job.job_title ?? null;
    return {
      job: {
        id: job.id,
        company_name: job.company_name ?? "",
        role: role?.trim() || null,
        start_date: job.start_date ?? null,
        end_date: job.end_date ?? null,
      },
      coworkers,
    };
  });
}
