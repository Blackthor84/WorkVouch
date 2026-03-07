/**
 * GET /api/trust/radar/[profileId]
 * Returns Trust Radar dimensions (0–100) from real data.
 * Auth: owner or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTrustRadarDimensions } from "@/lib/trust/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustRadarResponse = {
  verificationCoverage: number;
  referenceCredibility: number;
  networkDepth: number;
  disputeScore: number;
  consistencyScore: number;
  recencyScore: number;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const dimensions = await getTrustRadarDimensions(
      supabase as Parameters<typeof getTrustRadarDimensions>[0],
      profileId
    );
    return NextResponse.json(dimensions satisfies TrustRadarResponse);
  } catch (e) {
    console.error("[trust/radar]", e);
    return NextResponse.json(
      { error: "Failed to compute radar dimensions" },
      { status: 500 }
    );
  }
}
