"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type EmploymentMatchRow = {
  id: string;
  employment_record_id: string;
  matched_user_id: string;
  match_status: string;
  overlap_start: string;
  overlap_end: string;
  company_name: string;
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
 * Fetch coworker matches for the current user from coworker_matches (user1 or user2).
 * Returns matches with company name and other user profile for "You worked with X at Y" UI.
 * employment_matches does not exist; uses coworker_matches only.
 */
export async function getEmploymentMatchesForUser(): Promise<EmploymentMatchRow[]> {
  try {
    const user = await requireAuth();
    const supabase = await createClient();
    const sb = supabase as any;

    const { data: rows, error } = await sb
      .from("coworker_matches")
      .select("id, user1_id, user2_id, job1_id, job2_id, company_name, created_at")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error || !rows?.length) return [];

    type Row = { id: string; user1_id: string; user2_id: string; job1_id: string; job2_id: string; company_name: string; created_at: string };
    const typedRows = rows as Row[];

    const otherUserIds = new Set<string>();
    const otherJobIds: string[] = [];
    for (const r of typedRows) {
      const other = r.user1_id === user.id ? r.user2_id : r.user1_id;
      otherUserIds.add(other);
      const otherJobId = r.user1_id === user.id ? r.job2_id : r.job1_id;
      otherJobIds.push(otherJobId);
    }

    const [profsRes, jobsRes, trustRes] = await Promise.all([
      sb.from("profiles").select("id, full_name, email, profile_photo_url").in("id", [...otherUserIds]),
      otherJobIds.length ? sb.from("jobs").select("id, job_title").in("id", otherJobIds) : Promise.resolve({ data: [] }),
      sb.from("trust_scores").select("user_id, score").in("user_id", [...otherUserIds]),
    ]);

    const profileMap: Record<string, { id: string; full_name: string | null; email: string | null; profile_photo_url: string | null }> = {};
    for (const p of (profsRes.data ?? []) as { id: string; full_name: string | null; email: string | null; profile_photo_url: string | null }[]) {
      profileMap[p.id] = p;
    }
    const jobMap: Record<string, string> = {};
    for (const j of (jobsRes.data ?? []) as { id: string; job_title: string }[]) {
      jobMap[j.id] = j.job_title ?? "";
    }
    const trustMap: Record<string, number> = {};
    for (const t of (trustRes.data ?? []) as { user_id: string; score: number }[]) {
      trustMap[t.user_id] = t.score;
    }

    return typedRows.map((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const isRecordOwner = m.user1_id === user.id;
      const otherJobId = m.user1_id === user.id ? m.job2_id : m.job1_id;
      const otherJobTitle = jobMap[otherJobId] ?? null;
      const trustScore = trustMap[otherId] ?? null;
      const profile = profileMap[otherId] ?? null;
      return {
        id: m.id,
        employment_record_id: "",
        matched_user_id: otherId,
        match_status: "confirmed",
        overlap_start: "",
        overlap_end: "",
        company_name: m.company_name ?? "Unknown",
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
    console.warn("Optional employmentMatches query failed", e);
    return [];
  }
}
