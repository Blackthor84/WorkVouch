/**
 * GET /api/admin/intelligence-sandbox?sessionId=...
 * Admin/SuperAdmin only. Returns sandbox session + profiles + vectors + baselines.
 * Runs cleanup before returning. Never returns production data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runSandboxCleanup } from "@/lib/intelligence/sandboxCreateSession";

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

    await runSandboxCleanup();

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const [sessionRes, profilesRes, vectorsRes, industryRes, employerRes, snapshotsRes] = await Promise.all([
      supabase.from("sandbox_sessions").select("*").eq("id", sessionId).eq("is_sandbox", true).maybeSingle(),
      supabase.from("sandbox_profiles").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_behavioral_profile_vector").select("*").eq("is_sandbox", true),
      supabase.from("sandbox_industry_baselines").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_employer_baselines").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_baseline_snapshots").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true).order("created_at", { ascending: false }).limit(1),
    ]);

    const sessionRow = sessionRes.data;
    if (!sessionRow || sessionRes.error) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }
    if (new Date(sessionRow.expires_at) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    const profiles = profilesRes.data ?? [];
    const profileIds = profiles.map((p: { id: string }) => p.id);
    const vectors = (vectorsRes.data ?? []).filter((v: { profile_id: string }) => profileIds.includes(v.profile_id));
    const industryBaselines = industryRes.data ?? [];
    const employerBaselines = employerRes.data ?? [];

    const [teamFitRes, riskRes, hiringRes] = await Promise.all([
      supabase.from("sandbox_team_fit_scores").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_risk_model_outputs").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_hiring_confidence_scores").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
    ]);

    const baselineSnapshots = snapshotsRes.data ?? [];
    const latestSnapshot = Array.isArray(baselineSnapshots) ? baselineSnapshots[0] : null;
    const driftWarning = latestSnapshot && typeof latestSnapshot.delta_percent === "object"
      ? Object.values(latestSnapshot.delta_percent as Record<string, number>).some((d: number) => Math.abs(d) > 20)
      : false;

    return NextResponse.json({
      session: sessionRow,
      profiles,
      vectors,
      industryBaselines,
      employerBaselines,
      teamFitScores: teamFitRes.data ?? [],
      riskOutputs: riskRes.data ?? [],
      hiringConfidenceScores: hiringRes.data ?? [],
      baselineSnapshots,
      driftWarning,
    });
  } catch (e) {
    console.error("[intelligence-sandbox GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
