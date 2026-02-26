import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import { buildTrustTimeline } from "@/lib/trust/buildTrustTimeline";
import type { TrustEngineSnapshot } from "@/lib/trust/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trust/report — exportable trust report (JSON). Enterprise.
 * Builds snapshot from DB (getOrCreateSnapshot). Returns snapshot, explanation, timeline, generatedAt.
 *
 * POST — same report from request body snapshot (TrustEngineSnapshot).
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
    ledger: [],
  };

  const explanation = explainTrustScore(snapshot);
  const timeline = buildTrustTimeline(snapshot);

  return NextResponse.json({
    snapshot,
    explanation,
    timeline,
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot: TrustEngineSnapshot = await req.json();
  const explanation = explainTrustScore(snapshot);
  const timeline = buildTrustTimeline(snapshot);

  return NextResponse.json({
    snapshot,
    explanation,
    timeline,
    generatedAt: new Date().toISOString(),
  });
}
