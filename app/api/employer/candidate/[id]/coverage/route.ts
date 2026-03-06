/**
 * GET /api/employer/candidate/[id]/coverage
 * Employer-only. Returns verification coverage for the candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !(await isEmployer())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disclaimer = await requireEmployerLegalAcceptanceOrResponse(user.id, await getCurrentUserRole());
    if (disclaimer) return disclaimer;
    const sub = await requireActiveSubscription(user.id);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error ?? "Subscription required" }, { status: 403 });
    }
    const { id: candidateId } = await params;
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: rows, error } = await supabase
      .from("employment_records")
      .select("verification_status")
      .eq("user_id", candidateId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const list = (rows ?? []) as { verification_status?: string }[];
    const totalRoles = list.length;
    const verifiedRoles = list.filter((r) => r.verification_status === "verified").length;
    const coveragePercent = totalRoles > 0 ? Math.round((verifiedRoles / totalRoles) * 100) : 0;
    return NextResponse.json({
      coveragePercent,
      verifiedRoles,
      totalRoles,
    });
  } catch (e) {
    console.error("[employer/candidate/coverage]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
