/**
 * GET /api/admin/intelligence-dashboard?userId=...&employerId=...
 * Admin/superadmin only. Returns full intelligence breakdown: snapshot, risk, network, team fit, hiring, model version, last calculated.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getCurrentUserRole } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";
import { getIndustryBehavioralBaseline, getEmployerBehavioralBaseline, getHybridBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import { resolveIndustryKey } from "@/lib/industry-normalization";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = await getCurrentUserRole();
    if (!isAdmin(role)) {
      return NextResponse.json({ error: "Forbidden: admin or superadmin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const employerId = searchParams.get("employerId") ?? undefined;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const unified = await calculateUnifiedIntelligence(userId, employerId ?? null);
    const supabase = getSupabaseServer();

    const [snapshotRes, riskRes, networkRes, teamRes, hiringRes, reviewIntelRes, behavioralVectorRes] =
      await Promise.all([
        supabase
          .from("intelligence_snapshots")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("risk_model_outputs")
          .select("overall_score, breakdown, model_version, updated_at")
          .eq("candidate_id", userId)
          .is("employer_id", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("network_density_index")
          .select("density_score, fraud_confidence, breakdown, model_version, updated_at")
          .eq("candidate_id", userId)
          .maybeSingle(),
        employerId
          ? supabase
              .from("team_fit_scores")
              .select("alignment_score, breakdown, model_version, updated_at")
              .eq("candidate_id", userId)
              .eq("employer_id", employerId)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        employerId
          ? supabase
              .from("hiring_confidence_scores")
              .select("composite_score, breakdown, model_version, updated_at")
              .eq("candidate_id", userId)
              .eq("employer_id", employerId)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("review_intelligence")
          .select("*")
          .eq("candidate_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("behavioral_profile_vector")
          .select("*")
          .eq("candidate_id", userId)
          .maybeSingle(),
      ]);

    const snapshot = snapshotRes.data as Record<string, unknown> | null;
    const risk = riskRes.data as Record<string, unknown> | null;
    const network = networkRes.data as Record<string, unknown> | null;
    const teamFit = teamRes.data as Record<string, unknown> | null;
    const hiring = hiringRes.data as Record<string, unknown> | null;
    const behavioral_raw_scores = (reviewIntelRes.data ?? []) as Record<string, unknown>[];
    const behavioral_vector = behavioralVectorRes.data as Record<string, unknown> | null;
    const riskBreakdown = (risk?.breakdown ?? {}) as Record<string, number>;
    const risk_behavioral_contribution =
      typeof riskBreakdown.behavioralRiskScore === "number"
        ? Math.round(riskBreakdown.behavioralRiskScore * 0.15 * 100) / 100
        : null;
    const behavioral_alignment_score =
      unified.team_fit_score ?? (teamFit?.alignment_score as number | undefined) ?? null;

    let industry_baseline: Record<string, unknown> | null = null;
    let employer_baseline: Record<string, unknown> | null = null;
    let hybrid_baseline: Record<string, unknown> | null = null;
    try {
      const profileRes = await supabase.from("profiles").select("industry, industry_key").eq("id", userId).maybeSingle();
      const profile = profileRes.data as { industry?: string; industry_key?: string } | null;
      const candidateIndustry = resolveIndustryKey(profile?.industry_key, profile?.industry);
      const industryRow = await getIndustryBehavioralBaseline(candidateIndustry);
      if (industryRow) industry_baseline = { ...industryRow, sample_size: industryRow.sample_size };
      if (employerId) {
        const employerRow = await getEmployerBehavioralBaseline(employerId);
        if (employerRow) employer_baseline = { ...employerRow, employee_sample_size: employerRow.employee_sample_size };
        const hybrid = await getHybridBehavioralBaseline(candidateIndustry, employerId);
        hybrid_baseline = { ...hybrid };
      }
    } catch {
      // non-fatal
    }

    return NextResponse.json({
      profile_strength: unified.profile_strength,
      career_health: unified.career_health,
      stability_score: unified.stability_score,
      reference_score: unified.reference_score,
      rehire_probability: unified.rehire_probability,
      dispute_score: unified.dispute_score,
      network_density_score: unified.network_density_score,
      fraud_confidence: unified.fraud_confidence,
      overall_risk_score: unified.overall_risk_score,
      hiring_confidence_score: unified.hiring_confidence_score,
      team_fit_score: unified.team_fit_score,
      model_version: unified.model_version,
      snapshot_row: snapshot,
      risk_breakdown: risk,
      network_overview: network,
      team_fit_row: teamFit,
      hiring_confidence_row: hiring,
      last_calculated_at: snapshot?.last_calculated_at ?? null,
      behavioral_raw_scores,
      behavioral_vector,
      behavioral_alignment_score,
      risk_behavioral_contribution,
      industry_baseline: industry_baseline ?? null,
      employer_baseline: employer_baseline ?? null,
      hybrid_baseline: hybrid_baseline ?? null,
    });
  } catch (e) {
    console.error("[admin intelligence-dashboard]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
