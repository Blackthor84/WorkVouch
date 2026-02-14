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
 * Fetch employment_matches for the current user (as record owner or matched user).
 * Returns matches with company name and other user profile for "You worked with X at Y" UI.
 */
export async function getEmploymentMatchesForUser(): Promise<EmploymentMatchRow[]> {
  const user = await requireAuth();
  const supabase = await createServerSupabase();
  const sb = supabase as any;

  const { data: myRecords } = await sb.from("employment_records").select("id").eq("user_id", user.id);
  const myRecordIds = (myRecords ?? []).map((r: { id: string }) => r.id);

  let matchesAsOwner: any[] = [];
  if (myRecordIds.length > 0) {
    const { data: ownerData } = await sb
      .from("employment_matches")
      .select("id, employment_record_id, matched_user_id, match_status, overlap_start, overlap_end")
      .in("employment_record_id", myRecordIds);
    matchesAsOwner = (ownerData ?? []).map((m: any) => ({ ...m, _source: "owner" }));
  }

  const { data: asMatched } = await sb
    .from("employment_matches")
    .select("id, employment_record_id, matched_user_id, match_status, overlap_start, overlap_end")
    .eq("matched_user_id", user.id);

  const matchesAsMatched = (asMatched ?? []).map((m: any) => ({ ...m, _source: "matched" }));

  const allMatches = [...matchesAsOwner, ...matchesAsMatched];
  if (allMatches.length === 0) return [];

  const recordIds = [...new Set(allMatches.map((m: any) => m.employment_record_id))];
  const { data: recs } = await sb.from("employment_records").select("id, company_name, user_id").in("id", recordIds);
  const recMap: Record<string, { company_name: string; user_id: string }> = {};
  for (const r of (recs ?? []) as { id: string; company_name: string; user_id: string }[]) {
    recMap[r.id] = { company_name: r.company_name, user_id: r.user_id };
  }

  const otherUserIds = new Set<string>();
  for (const m of allMatches) {
    if (m._source === "owner") otherUserIds.add(m.matched_user_id);
    else if (recMap[m.employment_record_id]) otherUserIds.add(recMap[m.employment_record_id].user_id);
  }
  const { data: profs } = await sb.from("profiles").select("id, full_name, email").in("id", [...otherUserIds]);
  const profileMap: Record<string, { id: string; full_name: string | null; email: string | null }> = {};
  for (const p of (profs ?? []) as { id: string; full_name: string | null; email: string | null }[]) {
    profileMap[p.id] = p;
  }

  return allMatches.map((m: any) => {
    const rec = recMap[m.employment_record_id];
    const otherId = m._source === "owner" ? m.matched_user_id : rec?.user_id;
    return {
      id: m.id,
      employment_record_id: m.employment_record_id,
      matched_user_id: m.matched_user_id,
      match_status: m.match_status,
      overlap_start: m.overlap_start,
      overlap_end: m.overlap_end,
      company_name: rec?.company_name ?? "Unknown",
      other_user: otherId ? profileMap[otherId] ?? null : null,
      is_record_owner: m._source === "owner",
    };
  });
}
