/**
 * GET /api/admin/intelligence-dashboard?userId=...&employerId=...
 * Admin/superadmin only. Returns full intelligence breakdown: snapshot, risk, network, team fit, hiring, model version, last calculated.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { calculateUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles ?? [];
    if (!isAdmin(roles)) {
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

    const [snapshotRes, riskRes, networkRes, teamRes, hiringRes] = await Promise.all([
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
    ]);

    const snapshot = snapshotRes.data as Record<string, unknown> | null;
    const risk = riskRes.data as Record<string, unknown> | null;
    const network = networkRes.data as Record<string, unknown> | null;
    const teamFit = teamRes.data as Record<string, unknown> | null;
    const hiring = hiringRes.data as Record<string, unknown> | null;

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
    });
  } catch (e) {
    console.error("[admin intelligence-dashboard]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
