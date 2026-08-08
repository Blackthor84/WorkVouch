import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustProfile } from "@/lib/trust/trustService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trust/[userId]
 * Canonical trust API — score, breakdown, timeline, badges, explanation, recent changes.
 * Use userId=me for the authenticated user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: rawId } = await params;
  const trimmed = rawId?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  let profileId = trimmed;
  if (trimmed === "me") {
    const effective = await getEffectiveUser();
    if (!effective?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    profileId = effective.id;
  }

  const result = await getTrustProfile(profileId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
