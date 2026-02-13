import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden: admin or superadmin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId", data: null }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const [teamFitRes, riskRes, networkRes, hiringRes] = await Promise.all([
      supabase.from("team_fit_scores").select("alignment_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).order("updated_at", { ascending: false }).limit(5),
      supabase.from("risk_model_outputs").select("overall_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).order("updated_at", { ascending: false }).limit(5),
      supabase.from("network_density_index").select("density_score, fraud_confidence, breakdown, model_version, updated_at").eq("candidate_id", candidateId).maybeSingle(),
      supabase.from("hiring_confidence_scores").select("composite_score, breakdown, model_version, updated_at").eq("candidate_id", candidateId).order("updated_at", { ascending: false }).limit(5),
    ]);

    const teamFitSummary = (teamFitRes.data ?? [])[0] ?? null;
    const riskBreakdown = (riskRes.data ?? [])[0] ?? null;
    const networkOverview = networkRes.data;
    const hiringComposite = (hiringRes.data ?? [])[0] ?? null;

    return NextResponse.json({
      teamFitSummary,
      riskBreakdown,
      networkOverview,
      fraudIndicator: networkOverview ? { fraudConfidence: networkOverview.fraud_confidence } : null,
      hiringConfidenceComposite: hiringComposite,
    });
  } catch (e) {
    console.error("[admin intelligence-preview]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
