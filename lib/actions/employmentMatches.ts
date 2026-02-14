"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export type EmploymentMatchRow = {
  id: string;
  employment_record_id: string;
  matched_user_id: string;
  match_status: string;
  overlap_start: string;
  overlap_end: string;
  company_name: string;
  other_user: { id: string; full_name: string | null; email: string | null } | null;
  is_record_owner: boolean;
};

/**
 * Fetch coworker matches for the current user from coworker_matches (user1 or user2).
 * Returns matches with company name and other user profile for "You worked with X at Y" UI.
 * employment_matches does not exist; uses coworker_matches only.
 */
export async function getEmploymentMatchesForUser(): Promise<EmploymentMatchRow[]> {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabase();
    const sb = supabase as any;

    const { data: rows, error } = await sb
      .from("coworker_matches")
      .select("id, user1_id, user2_id, company_name, created_at")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (error || !rows?.length) return [];

    const otherUserIds = new Set<string>();
    for (const r of rows as { user1_id: string; user2_id: string }[]) {
      const other = r.user1_id === user.id ? r.user2_id : r.user1_id;
      otherUserIds.add(other);
    }
    const { data: profs } = await sb.from("profiles").select("id, full_name, email").in("id", [...otherUserIds]);
    const profileMap: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
    for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
      profileMap[p.id] = p;
    }

    return (rows as { id: string; user1_id: string; user2_id: string; company_name: string; created_at: string }[]).map((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const isRecordOwner = m.user1_id === user.id;
      return {
        id: m.id,
        employment_record_id: "",
        matched_user_id: otherId,
        match_status: "confirmed",
        overlap_start: "",
        overlap_end: "",
        company_name: m.company_name ?? "Unknown",
        other_user: profileMap[otherId] ?? null,
        is_record_owner: isRecordOwner,
      };
    });
  } catch (e) {
    console.warn("Optional employmentMatches query failed", e);
    return [];
  }
}
