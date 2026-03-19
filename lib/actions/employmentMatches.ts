"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type EmploymentMatchRow = {
  id: string;
  employment_record_id: string;
  matched_user_id: string;
  /** Same as matched_user_id; use for "the other person" in UI (bidirectional). */
  otherUserId: string;
  match_status: string;
  /** coworker_matches.status: 'pending' | 'confirmed' */
  status?: string | null;
  overlap_start: string;
  overlap_end: string;
  company_name: string;
  /** 0–1 from coworker_matches.match_confidence; used for Weak/Medium/Strong badge */
  match_confidence?: number | null;
  /** Other user's job title at this company (for "Company • Role" display) */
  other_job_title: string | null;
  /** Other user's trust score 0–100 from trust_scores table */
  trust_score: number | null;
  other_user: {
    id: string;
    full_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
  } | null;
  is_record_owner: boolean;
}

/**
 * Fetch coworker matches where the current user is involved (user1_id OR user2_id).
 * Bidirectional: returns matches where you are user1 and matches where you are user2.
 * Uses authenticated server client with cookie getAll/setAll so the session is recognized.
 */
export async function getEmploymentMatchesForUser(): Promise<EmploymentMatchRow[]> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user || userError) {
    throw new Error("Unauthorized");
  }

  // DEBUG: log current user id (server-side; check terminal)
  console.log("[getEmploymentMatchesForUser] user.id", user.id);

  try {
    const sb = supabase as any;

    // Query: show matches where current user is involved (user1_id OR user2_id)
    const { data: rows, error } = await sb
      .from("coworker_matches")
      .select(`
        id,
        user1_id,
        user2_id,
        job1_id,
        job2_id,
        company_name,
        match_confidence,
        status,
        created_at,
        user1:profiles!coworker_matches_user1_id_fkey(id, full_name, email, profile_photo_url),
        user2:profiles!coworker_matches_user2_id_fkey(id, full_name, email, profile_photo_url)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    // DEBUG: log raw response (server-side)
    console.log("[getEmploymentMatchesForUser] raw rows count", rows?.length ?? 0);
    if (error) console.log("[getEmploymentMatchesForUser] error", error.message, error);
    if (rows?.length) console.log("[getEmploymentMatchesForUser] first row ids", { id: rows[0]?.id, user1_id: (rows[0] as any)?.user1_id, user2_id: (rows[0] as any)?.user2_id });

    if (error || !rows?.length) {
      // If matches exist in Supabase but array is empty, check RLS on coworker_matches:
      // policy should allow SELECT WHERE auth.uid() = user1_id OR auth.uid() = user2_id
      return [];
    }

    type ProfileRow = { id: string; full_name: string | null; email: string | null; profile_photo_url: string | null };
    type Row = {
      id: string; user1_id: string; user2_id: string; job1_id: string; job2_id: string; company_name: string;
      match_confidence?: number | null; status?: string | null; created_at: string;
      user1: ProfileRow | null; user2: ProfileRow | null;
    };
    const typedRows = rows as Row[];

    const allJobIds: string[] = [];
    for (const r of typedRows) {
      allJobIds.push(r.job1_id, r.job2_id);
    }

    const [jobsRes, trustRes] = await Promise.all([
      allJobIds.length ? sb.from("jobs").select("id, job_title, start_date, end_date").in("id", [...new Set(allJobIds)]) : Promise.resolve({ data: [] }),
      sb.from("trust_scores").select("user_id, score").in("user_id", [...new Set(typedRows.flatMap((r) => [r.user1_id, r.user2_id]))]),
    ]);
    type JobRow = { id: string; job_title: string | null; start_date: string | null; end_date: string | null };
    const jobDataMap: Record<string, JobRow> = {};
    for (const j of (jobsRes.data ?? []) as JobRow[]) {
      jobDataMap[j.id] = j;
    }
    const jobMap: Record<string, string> = {};
    for (const j of Object.values(jobDataMap)) {
      jobMap[j.id] = j.job_title ?? "";
    }
    const trustMap: Record<string, number> = {};
    for (const t of (trustRes.data ?? []) as { user_id: string; score: number }[]) {
      trustMap[t.user_id] = t.score;
    }

    return typedRows.map((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const isRecordOwner = m.user1_id === user.id;
      const job1Id = m.job1_id;
      const job2Id = m.job2_id;
      const otherJobId = m.user1_id === user.id ? m.job2_id : m.job1_id;
      const otherJobTitle = jobMap[otherJobId] ?? null;
      const trustScore = trustMap[otherId] ?? null;
      const profile = (m.user1_id === user.id ? m.user2 : m.user1) ?? null;

      let overlap_start = "";
      let overlap_end = "";
      const j1 = jobDataMap[job1Id];
      const j2 = jobDataMap[job2Id];
      if (j1?.start_date != null && j1?.end_date != null && j2?.start_date != null && j2?.end_date != null) {
        const s1 = new Date(j1.start_date).getTime();
        const e1 = new Date(j1.end_date).getTime();
        const s2 = new Date(j2.start_date).getTime();
        const e2 = new Date(j2.end_date).getTime();
        const start = new Date(Math.max(s1, s2));
        const end = new Date(Math.min(e1, e2));
        if (end >= start) {
          overlap_start = start.toISOString().slice(0, 10);
          overlap_end = end.toISOString().slice(0, 10);
        }
      }

      return {
        id: m.id,
        employment_record_id: "",
        matched_user_id: otherId,
        otherUserId: otherId,
        match_status: (m.status ?? "pending") as string,
        status: m.status ?? "pending",
        overlap_start,
        overlap_end,
        company_name: m.company_name ?? "Unknown",
        match_confidence: m.match_confidence ?? null,
        other_job_title: otherJobTitle,
        trust_score: trustScore,
        other_user: profile
          ? {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              profile_photo_url: profile.profile_photo_url ?? null,
            }
          : null,
        is_record_owner: isRecordOwner,
      };
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") throw e;
    console.warn("Employment matches query failed", e);
    return [];
  }
}
