// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/candidate/[id]/radar
 * Employer-only Trust Radar dimensions for a candidate profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { admin } from "@/lib/supabase-admin";
import { getTrustRadarDimensions } from "@/lib/trust/radar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type EmployerCandidateRadarResponse = {
  verificationCoverage: number;
  referenceCredibility: number;
  networkDepth: number;
  disputeScore: number;
  consistencyScore: number;
  recencyScore: number;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(
      user.id,
      await getCurrentUserRole()
    );
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }

    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const dimensions = await getTrustRadarDimensions(
      admin as Parameters<typeof getTrustRadarDimensions>[0],
      candidateId
    );
    return NextResponse.json(dimensions satisfies EmployerCandidateRadarResponse);
  } catch (e) {
    console.error("[employer/candidate/radar]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
