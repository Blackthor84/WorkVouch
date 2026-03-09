/**
 * Coworker discovery: find profiles with overlapping employment at the same company.
 * Used for bulk verification and "People who may have worked with you".
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type DiscoveredCoworker = {
  profileId: string;
  name: string;
  jobTitle: string;
  companyName: string;
  overlapStart: string;
  overlapEnd: string;
};

const MAX_COWORKERS = 10;

/**
 * Find up to 10 profiles with employment at the same company and overlapping dates.
 * Excludes the owner of the given employment record.
 * Overlap: existing.start_date <= record.end_date AND existing.end_date >= record.start_date
 */
export async function discoverCoworkers(
  supabase: SupabaseClient,
  employmentRecordId: string,
  ownerProfileId: string
): Promise<DiscoveredCoworker[]> {
  const { data: record, error: recordErr } = await supabase
    .from("employment_records")
    .select("id, user_id, company_normalized, company_name, start_date, end_date")
    .eq("id", employmentRecordId)
    .eq("user_id", ownerProfileId)
    .maybeSingle();

  if (recordErr || !record) return [];

  const companyNormalized = (record as { company_normalized: string }).company_normalized;
  const companyName = (record as { company_name: string }).company_name;
  const startDate = (record as { start_date: string }).start_date;
  const endDate = (record as { end_date: string | null }).end_date;
  const endDateOrMax = endDate ?? "9999-12-31";

  const { data: others, error } = await supabase
    .from("employment_records")
    .select("id, user_id, title, start_date, end_date")
    .eq("company_normalized", companyNormalized)
    .neq("user_id", ownerProfileId)
    .limit(MAX_COWORKERS * 2);

  if (error || !others) return [];

  const list = others as Array<{
    id: string;
    user_id: string;
    title: string;
    start_date: string;
    end_date: string | null;
  }>;

  const overlapping: Array<{
    profileId: string;
    jobTitle: string;
    overlapStart: string;
    overlapEnd: string;
  }> = [];

  for (const o of list) {
    const oEnd = o.end_date ?? "9999-12-31";
    const overlapStart = o.start_date > startDate ? o.start_date : startDate;
    const overlapEnd = oEnd < endDateOrMax ? oEnd : endDateOrMax;
    if (overlapStart <= overlapEnd) {
      overlapping.push({
        profileId: o.user_id,
        jobTitle: o.title ?? "",
        overlapStart,
        overlapEnd,
      });
    }
    if (overlapping.length >= MAX_COWORKERS) break;
  }

  if (overlapping.length === 0) return [];

  const profileIds = [...new Set(overlapping.map((x) => x.profileId))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", profileIds);

  const nameByProfileId = new Map<string, string>();
  for (const p of profiles ?? []) {
    const row = p as { id: string; full_name: string | null };
    nameByProfileId.set(row.id, row.full_name ?? "Unknown");
  }

  return overlapping.map((o) => ({
    profileId: o.profileId,
    name: nameByProfileId.get(o.profileId) ?? "Unknown",
    jobTitle: o.jobTitle,
    companyName,
    overlapStart: o.overlapStart,
    overlapEnd: o.overlapEnd,
  }));
}
