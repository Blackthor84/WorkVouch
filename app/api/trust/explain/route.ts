import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import type { TrustEngineSnapshot } from "@/lib/trust/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trust/explain — explainability: trust score, top factors, risk factors, confidence.
 * Uses effective user (impersonation-aware). Optional query: profileId (admin viewing a user).
 * Input: engine snapshot (single source of truth).
 */
export async function GET(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId")?.trim() || effective.id;

  const row = await getOrCreateSnapshot(profileId);
  const trustScore = Math.max(0, Math.min(100, Number(row.career_health_score) ?? 0));
  const profileStrength = Math.max(0, Math.min(100, Number(row.profile_strength) ?? 0));
  const referenceScore = Math.max(0, Math.min(100, Number(row.reference_score) ?? 0));

  const snapshot: TrustEngineSnapshot = {
    trustScore,
    profileStrength,
    confidenceScore: referenceScore,
    industry: "retail",
    employerMode: "enterprise",
    actorMode: "employer",
    events: [],
    ledger: [], // Explanation-only snapshot (no engine history)
  };

  const result = explainTrustScore(snapshot);
  return NextResponse.json({
    ...result,
    confidenceLevel: result.confidence,
  });
}
