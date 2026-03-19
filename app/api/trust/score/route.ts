/**
 * GET /api/trust/score — Trust score and components for current user.
 * Uses createServerClient in-route with cookie getAll/setAll for auth.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTrustScoreComponents } from "@/lib/trustScore";
import type { TrustScoreComponents } from "@/lib/trustScore";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userId = user.id;
    const { data: row } = await admin
      .from("trust_scores")
      .select("score, job_count, reference_count, average_rating")
      .eq("user_id", userId)
      .maybeSingle();

    const score = Math.max(
      0,
      Math.min(100, Number((row as { score?: number } | null)?.score ?? 0))
    );
    const components: TrustScoreComponents =
      await getTrustScoreComponents(userId);

    let confidenceScorePoints = 0;
    try {
      const { data: csRow } = await (admin as any)
        .from("user_confidence_scores")
        .select("confidence_score")
        .eq("user_id", userId)
        .maybeSingle();
      confidenceScorePoints = Number(
        (csRow as { confidence_score?: number } | null)?.confidence_score ?? 0
      );
    } catch {
      // view may not exist yet; keep 0
    }

    return new Response(
      JSON.stringify({
        score,
        confidenceScore: Math.max(0, confidenceScorePoints),
        jobCount: (row as { job_count?: number } | null)?.job_count ?? 0,
        referenceCount:
          (row as { reference_count?: number } | null)?.reference_count ??
          components.referenceCount,
        averageRating:
          (row as { average_rating?: number } | null)?.average_rating ??
          components.averageReferenceRating,
        components: {
          verifiedEmployments: components.verifiedEmployments,
          totalVerifiedYears: components.totalVerifiedYears,
          averageReferenceRating: components.averageReferenceRating,
          referenceCount: components.referenceCount,
          uniqueEmployersWithReferences:
            components.uniqueEmployersWithReferences,
          fraudFlagsCount: components.fraudFlagsCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("[API ERROR] GET /api/trust/score", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
