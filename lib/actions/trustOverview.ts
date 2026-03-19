"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type TrustOverview = {
  trustScore: number;
  verifiedReferences: number;
  coworkerMatches: number;
  completedJobs: number;
};

/**
 * Fetch trust overview for the current user: score (0–100), reference count, match count, job count.
 * Uses authenticated server client with cookie getAll/setAll so the session is recognized.
 */
export async function getTrustOverview(): Promise<TrustOverview> {
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
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const sb = supabase as any;

    const [scoreRes, matchesRes, jobsRes] = await Promise.all([
      sb.from("trust_scores").select("score, reference_count, job_count").eq("user_id", user.id).maybeSingle(),
      sb.from("coworker_matches").select("id", { count: "exact", head: true }).or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);

    const scoreRow = scoreRes.data as { score: number; reference_count: number; job_count: number } | null;
    const matchCount = Number((matchesRes as { count?: number }).count ?? 0);
    const jobCount = Number((jobsRes as { count?: number }).count ?? 0);

    return {
      trustScore: Math.round(Number(scoreRow?.score ?? 0)),
      verifiedReferences: Number(scoreRow?.reference_count ?? 0),
      coworkerMatches: matchCount,
      completedJobs: jobCount,
    };
  } catch (e) {
    if ((e as Error).message === "Unauthorized") throw e;
    console.warn("Trust overview fetch failed", e);
    return { trustScore: 0, verifiedReferences: 0, coworkerMatches: 0, completedJobs: 0 };
  }
}
