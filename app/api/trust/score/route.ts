// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/trust/score — Trust score and components for current user.
 * Backend calculation only; used by dashboard TrustScoreCard.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustScoreComponents } from "@/lib/trustScore";
import type { TrustScoreComponents } from "@/lib/trustScore";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: row } = await admin.from("trust_scores")
      .select("score, job_count, reference_count, average_rating")
      .eq("user_id", effective.id)
      .maybeSingle();

    const score = Math.max(0, Math.min(100, Number((row as { score?: number } | null)?.score ?? 0)));
    const components: TrustScoreComponents = await getTrustScoreComponents(effective.id);

    // Confidence score (points): +20 verified job, +10 per coworker verification, +5 bonus for 2+
    let confidenceScorePoints = 0;
    try {
      const { data: csRow } = await (admin as any)
        .from("user_confidence_scores")
        .select("confidence_score")
        .eq("user_id", effective.id)
        .maybeSingle();
      confidenceScorePoints = Number((csRow as { confidence_score?: number } | null)?.confidence_score ?? 0);
    } catch {
      // view may not exist yet; keep 0
    }

    return NextResponse.json({
      score,
      confidenceScore: Math.max(0, confidenceScorePoints),
      jobCount: (row as { job_count?: number } | null)?.job_count ?? 0,
      referenceCount: (row as { reference_count?: number } | null)?.reference_count ?? components.referenceCount,
      averageRating: (row as { average_rating?: number } | null)?.average_rating ?? components.averageReferenceRating,
      components: {
        verifiedEmployments: components.verifiedEmployments,
        totalVerifiedYears: components.totalVerifiedYears,
        averageReferenceRating: components.averageReferenceRating,
        referenceCount: components.referenceCount,
        uniqueEmployersWithReferences: components.uniqueEmployersWithReferences,
        fraudFlagsCount: components.fraudFlagsCount,
      },
    });
  } catch (e) {
    console.error("[API ERROR] GET /api/trust/score", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
