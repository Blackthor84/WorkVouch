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
  } | null;
  is_record_owner: boolean;
}

/** Raw row from coworker_matches (no joins). DB columns: user_id, coworker_id. */
type CoworkerMatchRow = {
  id: string;
  user_id: string;
  coworker_id: string;
  job1_id: string;
  job2_id: string;
  company_name: string | null;
  match_confidence?: number | null;
  status?: string | null;
  created_at?: string;
};

/**
 * Fetch coworker matches where the current user is involved (user_id OR coworker_id).
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
      .or(`user_id.eq.${user.id},coworker_id.eq.${user.id}`);

    console.log("MATCHES FINAL:", data);

    if (error) {
      console.warn("[getEmploymentMatchesForUser] query error", error.message);
      return [];
    }

    if (!data?.length) return [];

    const rows = data;

    const typedRows = rows as CoworkerMatchRow[]; // raw data, no joins

    return typedRows.map((m) => {
      const otherId = m.user_id === user.id ? m.coworker_id : m.user_id;
      const isRecordOwner = m.user_id === user.id;

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
        other_user: null,
        is_record_owner: isRecordOwner,
      };
    });
  } catch (e) {
    if ((e as Error).message === "Unauthorized") throw e;
    console.warn("Employment matches query failed", e);
    return [];
  }
}
