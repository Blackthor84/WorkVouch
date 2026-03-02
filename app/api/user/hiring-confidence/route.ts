/**
 * GET /api/user/hiring-confidence
 * Returns hiring confidence (high | medium | low) for the current user.
 * Reuses employer logic so employees see how they are framed in hiring decisions.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getHiringConfidence } from "@/lib/employer/hiringConfidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await getHiringConfidence(effective.id);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[user/hiring-confidence]", e);
    return NextResponse.json(
      { error: "Failed to load hiring confidence" },
      { status: 500 }
    );
  }
}
