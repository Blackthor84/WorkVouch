/**
 * Employer Team Fit API. Gated by enterprise_team_fit (enterprise tier, admins, preview).
 * Returns team fit, risk, network, hiring confidence for candidateId + employerId.
 * Not exposed to employees. Not returned in public candidate responses.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { checkFeatureAccess } from "@/lib/feature-flags";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    const employerIdParam = searchParams.get("employerId");
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const { data: emp } = await supabase.from("employer_accounts").select("id").eq("user_id", userId).maybeSingle();
    const employerId = employerIdParam || (emp as { id?: string } | null)?.id;
    if (!employerId) {
      return NextResponse.json({ error: "Employer context required" }, { status: 403 });
    }

    const allowed =
      (await checkFeatureAccess("enterprise_intelligence", { userId, employerId, uiOnly: true })) ||
      (await checkFeatureAccess("enterprise_team_fit", { userId, employerId, uiOnly: true }));
    if (!allowed) {
      return NextResponse.json({ error: "Feature not available" }, { status: 403 });
    }

    const [teamFitRes, riskResEmp, riskResGlobal, networkRes, hiringRes] = await Promise.all([
      supabase.from("team_fit_scores").select("alignment_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).eq("employer_id", employerId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("risk_model_outputs").select("overall_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).eq("employer_id", employerId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("risk_model_outputs").select("overall_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).is("employer_id", null).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("network_density_index").select("density_score, fraud_confidence, breakdown, model_version, updated_at").eq("candidate_id", candidateId).maybeSingle(),
      supabase.from("hiring_confidence_scores").select("composite_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).eq("employer_id", employerId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const riskRes = { data: riskResEmp.data ?? riskResGlobal.data };

    return NextResponse.json({
      teamFitSummary: teamFitRes.data,
      riskBreakdown: riskRes.data,
      networkOverview: networkRes.data,
      fraudIndicator: networkRes.data ? { fraudConfidence: networkRes.data.fraud_confidence } : null,
      hiringConfidenceComposite: hiringRes.data,
    });
  } catch (e) {
    console.error("[employer team-fit]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
