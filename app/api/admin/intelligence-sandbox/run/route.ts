/**
 * POST /api/admin/intelligence-sandbox/run
 * Admin/SuperAdmin only. Runs team fit, risk, hiring confidence for sandbox session; writes to sandbox_* only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { runSandboxScoring } from "@/lib/intelligence/sandboxRunScoring";

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

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
    const employerId = body.employerId != null ? (typeof body.employerId === "string" ? body.employerId : null) : null;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const result = await runSandboxScoring(sessionId, employerId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Run failed" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[intelligence-sandbox run]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
