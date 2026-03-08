// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/risk/[candidateId]
 * Employer-only. Returns risk level and neutral-language alerts for the candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
import { getEmployerRiskAlerts } from "@/lib/employer/riskAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type EmployerRiskResponse = {
  riskLevel: "low" | "medium" | "high";
  alerts: Array<{ id: string; message: string; category?: string }>;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
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
    const { candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }
    const result = await getEmployerRiskAlerts(
      supabase as Parameters<typeof getEmployerRiskAlerts>[0],
      candidateId
    );
    return NextResponse.json(result satisfies EmployerRiskResponse);
  } catch (e) {
    console.error("[employer/risk]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
