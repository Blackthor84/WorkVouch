/**
 * GET /api/admin/intelligence-sandbox
 * - ?sessionId=... → legacy sandbox session + profiles + baselines.
 * - ?sandboxId=... → enterprise sandbox metrics (profiles, employers, peer reviews, ads, etc.).
 * - ?list=1 → list active intelligence_sandboxes for current admin.
 * Runs cleanup before returning. Never returns production data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runSandboxCleanup } from "@/lib/intelligence/sandboxCreateSession";

type SandboxSessionRow = {
  id: string;
  created_at: string;
  expires_at: string;
  created_by_admin: string;
};

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
    const sandboxId = searchParams.get("sandboxId");
    const list = searchParams.get("list") === "1";

    const supabase = getSupabaseServer();

    if (list) {
      const { data: sandboxes, error } = await supabase
        .from("intelligence_sandboxes")
        .select("id, name, starts_at, ends_at, status, created_at")
        .in("status", ["active"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ sandboxes: sandboxes ?? [] });
    }

    if (sandboxId) {
      const uid = (session.user as { id?: string }).id;
      if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const { data: sandbox, error: sbErr } = await supabase
        .from("intelligence_sandboxes")
        .select("id, name, created_by, starts_at, ends_at, status")
        .eq("id", sandboxId)
        .maybeSingle();
      if (sbErr || !sandbox) return NextResponse.json({ error: "Sandbox not found" }, { status: 404 });
      const createdBy = (sandbox as { created_by?: string }).created_by;
      if (createdBy !== uid && !roles.includes("admin") && !roles.includes("superadmin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const [
        profilesRes,
        employersRes,
        employersListRes,
        refsRes,
        hiringRes,
        adsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("employer_accounts").select("id, company_name").eq("sandbox_id", sandboxId).order("company_name"),
        supabase.from("employment_references").select("id", { count: "exact", head: true }).eq("sandbox_id", sandboxId),
        supabase.from("hiring_confidence_scores").select("id, composite_score", { count: "exact" }).eq("sandbox_id", sandboxId).limit(100),
        supabase.from("sandbox_ad_campaigns").select("id, impressions, clicks, conversions, spend").eq("sandbox_id", sandboxId),
      ]);
      const profilesCount = (profilesRes as { count?: number }).count ?? 0;
      const employersCount = (employersRes as { count?: number }).count ?? 0;
      const refsCount = (refsRes as { count?: number }).count ?? 0;
      const hiringRows = (hiringRes as { data?: { composite_score: number }[] }).data ?? [];
      const adsRows = (adsRes as { data?: { impressions: number; clicks: number; conversions: number; spend: number }[] }).data ?? [];
      const totalSpend = adsRows.reduce((s, r) => s + Number(r.spend || 0), 0);
      const totalImpressions = adsRows.reduce((s, r) => s + Number(r.impressions || 0), 0);
      const totalClicks = adsRows.reduce((s, r) => s + Number(r.clicks || 0), 0);
      const totalConversions = adsRows.reduce((s, r) => s + Number(r.conversions || 0), 0);
      const avgHiringConfidence = hiringRows.length > 0
        ? hiringRows.reduce((a, r) => a + (r.composite_score ?? 0), 0) / hiringRows.length
        : null;
      const employersList = ((employersListRes as { data?: { id: string; company_name: string | null }[] }).data ?? []) as { id: string; company_name: string | null }[];
      return NextResponse.json({
        sandbox: { id: (sandbox as { id: string }).id, name: (sandbox as { name: string | null }).name, starts_at: (sandbox as { starts_at: string }).starts_at, ends_at: (sandbox as { ends_at: string }).ends_at, status: (sandbox as { status: string }).status },
        metrics: {
          profiles_count: profilesCount,
          employers_count: employersCount,
          peer_reviews_count: refsCount,
          hiring_confidence_avg: avgHiringConfidence,
          hiring_confidence_sample: hiringRows.slice(0, 10).map((r) => r.composite_score),
          ad_campaigns_count: adsRows.length,
          ad_total_spend: totalSpend,
          ad_total_impressions: totalImpressions,
          ad_total_clicks: totalClicks,
          ad_total_conversions: totalConversions,
          employers: employersList,
        },
      });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId or sandboxId or list=1" }, { status: 400 });
    }

    const [sessionRes, profilesRes, vectorsRes, industryRes, employerRes, snapshotsRes] = await Promise.all([
      supabase
        .from("sandbox_sessions")
        .select("id, created_at, expires_at, created_by_admin")
        .eq("id", sessionId)
        .eq("is_sandbox", true)
        .maybeSingle<SandboxSessionRow>(),
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
