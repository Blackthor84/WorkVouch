"use server";

import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export type ProfileVisibilityStats = {
  employerSearchCount: number;
  industryTypes: string[];
  lastViewedDate: string | null;
};

/**
 * For current user (employee): number of employer directory searches that included this profile,
 * industry types of searching employers, last viewed date (rounded to day). No employer names.
 */
export async function getProfileVisibilityStats(): Promise<ProfileVisibilityStats | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const sb = getSupabaseServer() as any;

  const { data: resultRows } = await sb
    .from("directory_search_result_profiles")
    .select("search_log_id")
    .eq("profile_id", user.id);

  const searchLogIds = [...new Set((resultRows ?? []).map((r: { search_log_id: string }) => r.search_log_id))];
  if (searchLogIds.length === 0) {
    return { employerSearchCount: 0, industryTypes: [], lastViewedDate: null };
  }

  const { data: logs } = await sb
    .from("directory_search_logs")
    .select("id, employer_id, created_at")
    .in("id", searchLogIds)
    .order("created_at", { ascending: false });

  const employerIds = [...new Set((logs ?? []).map((l: { employer_id: string }) => l.employer_id))];
  let industryTypes: string[] = [];
  if (employerIds.length > 0) {
    const { data: accounts } = await sb
      .from("employer_accounts")
      .select("industry, industry_key")
      .in("id", employerIds);
    const industries = new Set<string>();
    for (const a of (accounts ?? []) as { industry?: string; industry_key?: string }[]) {
      const ind = (a.industry_key ?? a.industry ?? "").replace(/_/g, " ");
      if (ind) industries.add(ind);
    }
    industryTypes = [...industries];
  }

  const lastLog = (logs ?? [])[0] as { created_at?: string } | undefined;
  const lastViewedDate = lastLog?.created_at
    ? new Date(lastLog.created_at).toISOString().slice(0, 10)
    : null;

  return {
    employerSearchCount: searchLogIds.length,
    industryTypes,
    lastViewedDate,
  };
}
