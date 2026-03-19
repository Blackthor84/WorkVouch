"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type EmploymentMatchRow = {
  id: string;
  employment_record_id: string;
  matched_user_id: string;
  otherUserId: string;
  match_status: string;
  status?: string | null;
  overlap_start: string;
  overlap_end: string;
  company_name: string;
  match_confidence?: number | null;
  other_job_title: string | null;
  trust_score: number | null;
  other_user: {
    id: string;
    full_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
    headline: string | null;
  } | null;
  is_record_owner: boolean;
}

/** Raw row from coworker_matches (no joins). DB columns: user_1, user_2. */
type CoworkerMatchRow = {
  id: string;
  user_1: string;
  user_2: string;
  job1_id: string;
  job2_id: string;
  company_name: string | null;
  match_confidence?: number | null;
  status?: string | null;
  created_at?: string;
};

/**
 * Fetch coworker matches where the current user is involved (user_1 OR user_2).
 * No joins to profiles until FKs are in place; uses raw coworker_matches only.
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

  try {
    const sb = supabase as any;

    const { data, error } = await sb
      .from("coworker_matches")
      .select("*")
      .or(`user_1.eq.${user.id},user_2.eq.${user.id}`);

    if (error) {
      console.warn("[getEmploymentMatchesForUser] query error", error.message);
      return [];
    }

    if (!data?.length) return [];

    const typedRows = data as CoworkerMatchRow[];
    const normalizedMatches = typedRows.map((match) => ({
      ...match,
      otherUserId: match.user_1 === user.id ? match.user_2 : match.user_1,
    }));

    const otherIds = [...new Set(normalizedMatches.map((m) => m.otherUserId))];
    let profileMap: Record<string, { full_name: string | null; profile_photo_url: string | null; headline: string | null }> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await sb
        .from("profiles")
        .select("id, full_name, profile_photo_url, headline")
        .in("id", otherIds);
      (profiles ?? []).forEach((p: { id: string; full_name: string | null; profile_photo_url: string | null; headline?: string | null }) => {
        profileMap[p.id] = {
          full_name: p.full_name ?? null,
          profile_photo_url: p.profile_photo_url ?? null,
          headline: p.headline ?? null,
        };
      });
    }

    return normalizedMatches.map((m) => {
      const otherId = m.otherUserId;
      const isRecordOwner = m.user_1 === user.id;
      const profile = profileMap[otherId];

      return {
        id: m.id,
        employment_record_id: "",
        matched_user_id: otherId,
        otherUserId: otherId,
        match_status: (m.status ?? "pending") as string,
        status: m.status ?? "pending",
        overlap_start: "",
        overlap_end: "",
        company_name: m.company_name ?? "Unknown",
        match_confidence: m.match_confidence ?? null,
        other_job_title: null,
        trust_score: null,
        other_user: profile
          ? { id: otherId, full_name: profile.full_name, email: null, profile_photo_url: profile.profile_photo_url, headline: profile.headline }
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
