/**
 * POST /api/admin/intelligence-sandbox/hybrid-preview
 * Admin only. Weight override: role %, sub-industry %, industry %, employer % (total 100%).
 * Returns blended baseline + sample alignment scores. No persistence.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getIndustryBehavioralBaseline, getEmployerBehavioralBaseline } from "@/lib/intelligence/hybridBehavioralModel";
import { getSandboxBehavioralVector } from "@/lib/intelligence/getBehavioralVector";
import type { Database } from "@/types/database";

type SandboxSessionRow = Database["public"]["Tables"]["sandbox_sessions"]["Row"];
type SandboxProfileRow = Database["public"]["Tables"]["sandbox_profiles"]["Row"];

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 50;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const roles = (session.user as { roles?: string[] }).roles ?? [];
    if (!isAdmin(roles)) {
      return NextResponse.json({ error: "Forbidden: admin or superadmin only" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const employerId = body.employerId != null ? (typeof body.employerId === "string" ? body.employerId : null) : null;
    let roleWeightPct = Number(body.roleWeightPct) || 0;
    let subIndustryWeightPct = Number(body.subIndustryWeightPct) || 0;
    let industryWeightPct = Number(body.industryWeightPct) || 0;
    let employerWeightPct = Number(body.employerWeightPct) || 0;
    const total = roleWeightPct + subIndustryWeightPct + industryWeightPct + employerWeightPct;
    if (Math.abs(total - 100) > 0.01) {
      const scale = 100 / (total || 1);
      roleWeightPct *= scale;
      subIndustryWeightPct *= scale;
      industryWeightPct *= scale;
      employerWeightPct *= scale;
    }
    const wRole = Math.max(0, Math.min(100, roleWeightPct)) / 100;
    const wSub = Math.max(0, Math.min(100, subIndustryWeightPct)) / 100;
    const wInd = Math.max(0, Math.min(100, industryWeightPct)) / 100;
    const wEmp = Math.max(0, Math.min(100, employerWeightPct)) / 100;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: sessionData } = await supabase
      .from("sandbox_sessions")
      .select("industry")
      .eq("id", sessionId)
      .eq("is_sandbox", true)
      .maybeSingle();
    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    const sessionRow = sessionData as Pick<SandboxSessionRow, "industry">;
    const industryKey = (sessionRow.industry || "corporate").trim().toLowerCase();

    const options = { sandboxSessionId: sessionId };
    const [industryRow, employerRow] = await Promise.all([
      getIndustryBehavioralBaseline(industryKey, options),
      employerId ? getEmployerBehavioralBaseline(employerId, options) : Promise.resolve(null),
    ]);
    const industry = industryRow ?? {
      avg_pressure: 50, avg_structure: 50, avg_communication: 50, avg_leadership: 50,
      avg_reliability: 50, avg_initiative: 50, avg_conflict_risk: 50, avg_tone_stability: 50,
    };
    const employer = employerRow ?? industry;
    const blend = (a: number, b: number, c: number, d: number) =>
      clamp(wRole * a + wSub * b + wInd * c + wEmp * d);
    const blended = {
      avg_pressure: blend(safeNum(industry.avg_pressure), safeNum(industry.avg_pressure), safeNum(industry.avg_pressure), safeNum(employer.avg_pressure)),
      avg_structure: blend(safeNum(industry.avg_structure), safeNum(industry.avg_structure), safeNum(industry.avg_structure), safeNum(employer.avg_structure)),
      avg_communication: blend(safeNum(industry.avg_communication), safeNum(industry.avg_communication), safeNum(industry.avg_communication), safeNum(employer.avg_communication)),
      avg_leadership: blend(safeNum(industry.avg_leadership), safeNum(industry.avg_leadership), safeNum(industry.avg_leadership), safeNum(employer.avg_leadership)),
      avg_reliability: blend(safeNum(industry.avg_reliability), safeNum(industry.avg_reliability), safeNum(industry.avg_reliability), safeNum(employer.avg_reliability)),
      avg_initiative: blend(safeNum(industry.avg_initiative), safeNum(industry.avg_initiative), safeNum(industry.avg_initiative), safeNum(employer.avg_initiative)),
      avg_conflict_risk: blend(safeNum(industry.avg_conflict_risk), safeNum(industry.avg_conflict_risk), safeNum(industry.avg_conflict_risk), safeNum(employer.avg_conflict_risk)),
      avg_tone_stability: blend(safeNum(industry.avg_tone_stability), safeNum(industry.avg_tone_stability), safeNum(industry.avg_tone_stability), safeNum(employer.avg_tone_stability)),
    };

    const { data: profilesData } = await supabase
      .from("sandbox_profiles")
      .select("id")
      .eq("sandbox_session_id", sessionId)
      .eq("is_sandbox", true)
      .limit(5);
    const profiles = (profilesData ?? []) as Pick<SandboxProfileRow, "id">[];
    const profileIds = profiles.map((p) => p.id);
    const alignmentScores: number[] = [];
    for (const pid of profileIds) {
      const vec = await getSandboxBehavioralVector(pid);
      if (!vec) continue;
      let sumDiff = 0;
      const keys = ["avg_pressure", "avg_structure", "avg_communication", "avg_leadership", "avg_reliability", "avg_initiative"] as const;
      for (const k of keys) sumDiff += Math.abs((vec[k] ?? 50) - (blended[k] ?? 50));
      sumDiff += Math.abs((vec.conflict_risk_level ?? 50) - (blended.avg_conflict_risk ?? 50));
      sumDiff += Math.abs((vec.tone_stability ?? 50) - (blended.avg_tone_stability ?? 50));
      alignmentScores.push(clamp(100 - sumDiff / 8));
    }

    return NextResponse.json({
      blendedBaseline: blended,
      weights: { roleWeightPct: wRole * 100, subIndustryWeightPct: wSub * 100, industryWeightPct: wInd * 100, employerWeightPct: wEmp * 100 },
      sampleAlignmentScores: alignmentScores,
    });
  } catch (e) {
    console.error("[intelligence-sandbox hybrid-preview]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
