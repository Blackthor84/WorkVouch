/**
 * GET /api/employer/candidate/[id]/hiring-confidence
 * Employer-only. Returns hiring confidence: level (high | medium | low), positives, cautions.
 * No raw trust scores. Uses real data only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getHiringConfidence } from "@/lib/employer/hiringConfidence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const userIsEmployer = await isEmployer();
    if (!user || !userIsEmployer) {
      return NextResponse.json(
        { error: "Forbidden: Employer access required" },
        { status: 403 }
      );
    }

    const disclaimerResponse = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimerResponse) return disclaimerResponse;

    const subCheck = await requireActiveSubscription(user.id);
    if (!subCheck.allowed) {
      return NextResponse.json(
        { error: subCheck.error ?? "Active subscription required." },
        { status: 403 }
      );
    }

    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const payload = await getHiringConfidence(candidateId);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[employer/candidate/hiring-confidence]", e);
    return NextResponse.json(
      { error: "Failed to load hiring confidence" },
      { status: 500 }
    );
  }
}
