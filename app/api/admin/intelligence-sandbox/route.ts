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
import type { Database } from "@/types/database";

type SandboxSessionRow = Database["public"]["Tables"]["sandbox_sessions"]["Row"];
type SandboxProfileRow = Database["public"]["Tables"]["sandbox_profiles"]["Row"];
type SandboxVectorRow = Database["public"]["Tables"]["sandbox_behavioral_profile_vector"]["Row"];
type IndustryBaselineRow = Database["public"]["Tables"]["sandbox_industry_baselines"]["Row"];
type EmployerBaselineRow = Database["public"]["Tables"]["sandbox_employer_baselines"]["Row"];
type BaselineSnapshotRow = Database["public"]["Tables"]["sandbox_baseline_snapshots"]["Row"];
type TeamFitRow = Database["public"]["Tables"]["sandbox_team_fit_scores"]["Row"];
type RiskOutputRow = Database["public"]["Tables"]["sandbox_risk_model_outputs"]["Row"];
type HiringConfidenceRow = Database["public"]["Tables"]["sandbox_hiring_confidence_scores"]["Row"];
type IntelligenceSandboxRow = Database["public"]["Tables"]["intelligence_sandboxes"]["Row"];
type EmployerAccountRow = Database["public"]["Tables"]["employer_accounts"]["Row"];
type SandboxAdCampaignRow = Database["public"]["Tables"]["sandbox_ad_campaigns"]["Row"];
type HiringConfidenceRow = Database["public"]["Tables"]["hiring_confidence_scores"]["Row"];

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
      const listRows = (sandboxes ?? []) as Pick<IntelligenceSandboxRow, "id" | "name" | "starts_at" | "ends_at" | "status" | "created_at">[];
      return NextResponse.json({ sandboxes: listRows });
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
      const sandboxRow = sandbox as Pick<IntelligenceSandboxRow, "id" | "name" | "created_by" | "starts_at" | "ends_at" | "status">;
      if (sandboxRow.created_by !== uid && !roles.includes("admin") && !roles.includes("superadmin")) {
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
      const profilesCount = profilesRes.count ?? 0;
      const employersCount = employersRes.count ?? 0;
      const refsCount = refsRes.count ?? 0;
      const hiringRows: HiringConfidenceRow[] =
        (hiringRes.data ?? []) as HiringConfidenceRow[];
      const adsRows = (adsRes.data ?? []) as Pick<SandboxAdCampaignRow, "id" | "impressions" | "clicks" | "conversions" | "spend">[];
      const totalSpend = adsRows.reduce((s, r) => s + Number(r.spend || 0), 0);
      const totalImpressions = adsRows.reduce((s, r) => s + Number(r.impressions || 0), 0);
      const totalClicks = adsRows.reduce((s, r) => s + Number(r.clicks || 0), 0);
      const totalConversions = adsRows.reduce((s, r) => s + Number(r.conversions || 0), 0);
      const avgHiringConfidence =
        hiringRows.length > 0
          ? hiringRows.reduce((sum, row) => {
              const score =
                typeof row.composite_score === "number"
                  ? row.composite_score
                  : 0;
              return sum + score;
            }, 0) / hiringRows.length
          : null;
      const employersList = (employersListRes.data ?? []) as Pick<EmployerAccountRow, "id" | "company_name">[];
      return NextResponse.json({
        sandbox: { id: sandboxRow.id, name: sandboxRow.name, starts_at: sandboxRow.starts_at, ends_at: sandboxRow.ends_at, status: sandboxRow.status },
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
        .maybeSingle(),
      supabase
        .from("sandbox_profiles")
        .select("id")
        .eq("sandbox_session_id", sessionId)
        .eq("is_sandbox", true),
      supabase
        .from("sandbox_behavioral_profile_vector")
        .select("profile_id")
        .eq("is_sandbox", true),
      supabase.from("sandbox_industry_baselines").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_employer_baselines").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_baseline_snapshots").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true).order("created_at", { ascending: false }).limit(1),
    ]);

    const sessionRow = sessionRes.data as SandboxSessionRow | null;
    if (!sessionRow || sessionRes.error) {
      return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
    }
    if (new Date(sessionRow.expires_at) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 });
    }

    const profiles = (profilesRes.data ?? []) as Pick<SandboxProfileRow, "id">[];
    const profileIds = profiles.map((p) => p.id);
    const vectorsRows = (vectorsRes.data ?? []) as Pick<SandboxVectorRow, "profile_id">[];
    const vectors = vectorsRows.filter((v) => profileIds.includes(v.profile_id));
    const industryBaselines = (industryRes.data ?? []) as IndustryBaselineRow[];
    const employerBaselines = (employerRes.data ?? []) as EmployerBaselineRow[];

    const [teamFitRes, riskRes, hiringRes] = await Promise.all([
      supabase.from("sandbox_team_fit_scores").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_risk_model_outputs").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
      supabase.from("sandbox_hiring_confidence_scores").select("*").eq("sandbox_session_id", sessionId).eq("is_sandbox", true),
    ]);

    const baselineSnapshots = (snapshotsRes.data ?? []) as BaselineSnapshotRow[];
    const latestSnapshot = baselineSnapshots[0] ?? null;
    const driftWarning =
      latestSnapshot?.delta_percent &&
      typeof latestSnapshot.delta_percent === "object" &&
      Object.values(latestSnapshot.delta_percent as Record<string, number>).some((d) => Math.abs(d) > 20);

    return NextResponse.json({
      session: sessionRow,
      profiles,
      vectors,
      industryBaselines,
      employerBaselines,
      teamFitScores: (teamFitRes.data ?? []) as TeamFitRow[],
      riskOutputs: (riskRes.data ?? []) as RiskOutputRow[],
      hiringConfidenceScores: (hiringRes.data ?? []) as HiringConfidenceRow[],
      baselineSnapshots,
      driftWarning: Boolean(driftWarning),
    });
  } catch (e) {
    console.error("[intelligence-sandbox GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
