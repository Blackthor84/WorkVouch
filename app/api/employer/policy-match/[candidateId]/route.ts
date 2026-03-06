/**
 * GET /api/employer/policy-match/[candidateId]
 * Returns trust policy match results for the candidate against all of the employer's policies.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isEmployer } from "@/lib/auth";
import { requireEmployerLegalAcceptanceOrResponse } from "@/lib/employer/requireEmployerLegalAcceptance";
import { requireActiveSubscription } from "@/lib/employer-require-active-subscription";
import { getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { evaluateTrustPolicy } from "@/lib/trust/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const supabase = getSupabaseServer();
    const { data: policies, error: listError } = await supabase
      .from("trust_policies")
      .select("id")
      .eq("employer_id", user.id);

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const list = (policies ?? []) as { id: string }[];
    const results = await Promise.all(
      list.map((p) => evaluateTrustPolicy(candidateId, p.id, supabase))
    );
    return NextResponse.json({ matches: results });
  } catch (e) {
    console.error("[employer/policy-match]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
