/**
 * POST /api/admin/intelligence-sandbox/create
 * Admin/SuperAdmin only. Creates sandbox session with N fake profiles and behavioral vectors.
 * Data expires in 10 minutes. Never affects production.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { createSandboxSession, runSandboxCleanup } from "@/lib/intelligence/sandboxCreateSession";

function isAdmin(roles: string[]): boolean {
  return roles.includes("admin") || roles.includes("superadmin");
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

    await runSandboxCleanup();

    const body = await req.json().catch(() => ({}));
    const industry = typeof body.industry === "string" ? body.industry : "corporate";
    const subIndustry = typeof body.subIndustry === "string" ? body.subIndustry : undefined;
    const roleTitle = typeof body.roleTitle === "string" ? body.roleTitle : undefined;
    const employerId = body.employerId != null ? (typeof body.employerId === "string" ? body.employerId : null) : undefined;
    const candidateCount = typeof body.candidateCount === "number" ? body.candidateCount : (typeof body.candidateCount === "string" ? parseInt(body.candidateCount, 10) : 10);
    const behavioralPreset = body.behavioralPreset && typeof body.behavioralPreset === "object" ? body.behavioralPreset : undefined;
    const mode = body.mode === "stress" ? "stress" : "standard";
    const variationProfile = body.variationProfile && typeof body.variationProfile === "object" ? body.variationProfile : undefined;
    const fraudClusterSimulation = Boolean(body.fraudClusterSimulation);

    const result = await createSandboxSession({
      industry,
      subIndustry,
      roleTitle,
      employerId: employerId ?? null,
      candidateCount: Number.isFinite(candidateCount) ? candidateCount : 10,
      behavioralPreset,
      variationProfile,
      mode,
      fraudClusterSimulation,
      createdByAdmin: session.user.id!,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to create sandbox session" }, { status: 500 });
    }

    return NextResponse.json({
      sandboxSessionId: result.sandboxSessionId,
      expiresAt: result.expiresAt,
      profileIds: result.profileIds,
      mode: result.mode,
      driftWarning: result.driftWarning ?? false,
      executionTimeMs: result.executionTimeMs,
      dbWriteTimeMs: result.dbWriteTimeMs,
      baselineSnapshot: result.baselineSnapshot,
    });
  } catch (e) {
    console.error("[intelligence-sandbox create]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
