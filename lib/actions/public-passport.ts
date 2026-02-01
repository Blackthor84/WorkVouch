"use server";

import { createServerSupabase } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PublicPassportProfile {
  id: string;
  full_name: string;
  industry: string | null;
  city: string | null;
  state: string | null;
  profile_photo_url: string | null;
  visibility: string;
  passport_username: string | null;
}

export interface PublicPassportJob {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  verification_status: string | null;
}

export interface PublicPassportData {
  profile: PublicPassportProfile;
  jobs: PublicPassportJob[];
  profileStrength: number;
  referenceCount: number;
  referenceResponseRate: number | null;
  credentialCount: number;
  disputeTotal: number;
  disputeResolved: number;
  industryBadge: string | null;
}

/**
 * Resolve public Career Passport by slug (UUID or passport_username).
 * Only returns data when is_public_passport = true (or visibility = 'public'). No employer-only notes.
 */
export async function getPublicPassportBySlug(slug: string): Promise<PublicPassportData | null> {
  const result = await getPassportPageData(slug);
  if (result.kind === "public") return result.data;
  return null;
}

export type PassportPageData =
  | { kind: "public"; data: PublicPassportData }
  | { kind: "private" }
  | { kind: "not_found" };

/**
 * Get passport page data for /passport/[username]. Returns public data, private (show Passport Protected card), or not_found.
 */
export async function getPassportPageData(slug: string): Promise<PassportPageData> {
  const supabase = await createServerSupabase();
  const sb = supabase as any;

  const isUuid = UUID_REGEX.test(slug);
  const selectCols =
    "id, full_name, industry, city, state, profile_photo_url, visibility, passport_username, is_public_passport";
  const selectColsMinimal = "id, full_name, industry, city, state, profile_photo_url, visibility";
  let profileRow: (PublicPassportProfile & { is_public_passport?: boolean }) | null = null;

  const fetchByUuid = async (cols: string) => {
    const { data } = await sb.from("profiles").select(cols).eq("id", slug).maybeSingle();
    return data;
  };
  const fetchByUsername = async (cols: string) => {
    const { data } = await sb.from("profiles").select(cols).eq("passport_username", slug).maybeSingle();
    return data;
  };

  if (isUuid) {
    try {
      profileRow = await fetchByUuid(selectCols);
    } catch {
      profileRow = await fetchByUuid(selectColsMinimal);
    }
  } else {
    try {
      profileRow = await fetchByUsername(selectCols);
    } catch {
      try {
        profileRow = await fetchByUsername(selectColsMinimal);
      } catch {
        profileRow = null;
      }
    }
  }

  if (!profileRow) return { kind: "not_found" };
  const isPublic =
    (profileRow as any).is_public_passport === true || (profileRow as any).visibility === "public";
  if (!isPublic) return { kind: "private" };

  const profileId = (profileRow as { id: string }).id;

  const { data: jobs } = await sb
    .from("jobs")
    .select("id, company_name, job_title, start_date, end_date, verification_status")
    .eq("user_id", profileId)
    .eq("is_private", false)
    .order("start_date", { ascending: false });
  const jobList = (jobs ?? []) as PublicPassportJob[];

  const { data: trustRow } = await sb
    .from("trust_scores")
    .select("score")
    .eq("user_id", profileId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const profileStrength = (trustRow as { score?: number } | null)?.score ?? (profileRow as any)?.trust_score ?? 0;

  const { count: refCount } = await sb.from("references").select("id", { count: "exact", head: true }).eq("to_user_id", profileId);
  const referenceCount = refCount ?? 0;
  const jobIds = jobList.map((j) => j.id);
  const totalPossible = jobIds.length;
  const referenceResponseRate = totalPossible > 0 ? Math.min(100, Math.round((referenceCount / totalPossible) * 100)) : null;

  let credentialCount = 0;
  try {
    const { data: cred } = await sb.from("guard_licenses").select("id").eq("user_id", profileId);
    credentialCount = Array.isArray(cred) ? cred.length : 0;
  } catch {
    // ignore
  }

  let disputeTotal = 0;
  let disputeResolved = 0;
  if (jobIds.length > 0) {
    const { data: disp } = await sb.from("employer_disputes").select("id, status").in("job_id", jobIds);
    const list = (disp ?? []) as { status: string }[];
    disputeTotal = list.length;
    disputeResolved = list.filter((d) => d.status === "resolved").length;
  }

  const industryBadge = (profileRow as { industry?: string | null }).industry ?? null;

  const data: PublicPassportData = {
    profile: { ...profileRow, passport_username: (profileRow as any).passport_username ?? null },
    jobs: jobList,
    profileStrength: Math.min(100, Math.max(0, Number(profileStrength))),
    referenceCount,
    referenceResponseRate,
    credentialCount,
    disputeTotal,
    disputeResolved,
    industryBadge,
  };
  return { kind: "public", data };
}
