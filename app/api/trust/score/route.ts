/**
 * GET /api/trust/score — Trust score and components for current user.
 * Delegates to canonical trust engine. Prefer GET /api/trust/me for full bundle.
 */

import { getEffectiveUser } from "@/lib/auth";
import { calculateTrust } from "@/lib/trust/trustEngine";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const userId = effective.id;
    const trust = await calculateTrust(userId);
    const { components, score } = trust;

    let confidenceScorePoints = 0;
    try {
      const { data: csRow } = await (admin as any)
        .from("user_confidence_scores")
        .select("confidence_score")
        .eq("user_id", userId)
        .maybeSingle();
      confidenceScorePoints = Number(
        (csRow as { confidence_score?: number } | null)?.confidence_score ?? 0,
      );
    } catch {
      // view may not exist yet; keep 0
    }

    return new Response(
      JSON.stringify({
        score,
        confidenceScore: Math.max(0, confidenceScorePoints),
        jobCount: trust.verifiedEmploymentCount,
        referenceCount: trust.referenceCount,
        averageRating: components.averageReferenceRating,
        band: trust.band,
        trajectory: trust.trajectory,
        trajectoryLabel: trust.trajectoryLabel,
        explanation: trust.explanation,
        badges: trust.badges,
        components: {
          verifiedEmployments: components.verifiedEmployments,
          totalVerifiedYears: components.totalVerifiedYears,
          averageReferenceRating: components.averageReferenceRating,
          referenceCount: components.referenceCount,
          uniqueEmployersWithReferences: components.uniqueEmployersWithReferences,
          fraudFlagsCount: components.fraudFlagsCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[API ERROR] GET /api/trust/score", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
