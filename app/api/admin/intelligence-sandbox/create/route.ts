/**
 * POST /api/admin/intelligence-sandbox/create
 * Creates an intelligence sandbox (enterprise) or legacy sandbox session.
 * Enterprise: name, startsAt, endsAt → intelligence_sandboxes, returns sandbox_id.
 * Legacy: industry, candidateCount, etc. → sandbox_sessions, returns sandboxSessionId, expiresAt.
 * Admin/superadmin only. Production unaffected. Strong error handling.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin } from "@/lib/sandbox";
import { createSandboxSession } from "@/lib/intelligence/sandboxCreateSession";

export const dynamic = "force-dynamic";

function isLegacyCreateBody(body: Record<string, unknown>): boolean {
  return body.industry !== undefined || body.candidateCount !== undefined;
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    if (isLegacyCreateBody(body)) {
      const n = Math.min(
        typeof body.candidateCount === "number" ? body.candidateCount : 10,
        body.mode === "stress" ? 10000 : 500
      );
      const result = await createSandboxSession({
        industry: typeof body.industry === "string" ? body.industry : "corporate",
        subIndustry: typeof body.subIndustry === "string" ? body.subIndustry : undefined,
        roleTitle: typeof body.roleTitle === "string" ? body.roleTitle : undefined,
        employerId: typeof body.employerId === "string" ? body.employerId : undefined,
        candidateCount: n,
        behavioralPreset: body.behavioralPreset as Record<string, number> | undefined,
        variationProfile: body.variationProfile as Record<string, number> | undefined,
        mode: body.mode === "stress" ? "stress" : "standard",
        fraudClusterSimulation: Boolean(body.fraudClusterSimulation),
        createdByAdmin: adminId,
      });
      if (!result) {
        return NextResponse.json({ error: "Legacy sandbox create failed" }, { status: 400 });
      }
      return NextResponse.json({
        sandboxSessionId: result.sandboxSessionId,
        expiresAt: result.expiresAt,
        executionTimeMs: result.executionTimeMs,
        dbWriteTimeMs: result.dbWriteTimeMs,
        driftWarning: result.driftWarning,
        baselineSnapshot: result.baselineSnapshot,
      });
    }

    const name = typeof body.name === "string" ? body.name : null;
    const startsAtRaw = body.startsAt ?? body.starts_at;
    const endsAtRaw = body.endsAt ?? body.ends_at;
    const autoDelete = typeof body.autoDelete === "boolean" ? body.autoDelete : true;

    const now = new Date();
    const startsAt = startsAtRaw ? new Date(startsAtRaw as string) : now;
    const endsAt = endsAtRaw ? new Date(endsAtRaw as string) : new Date(now.getTime() + 60 * 60 * 1000);

    if (endsAt.getTime() <= startsAt.getTime()) {
      return NextResponse.json({ error: "ends_at must be after starts_at" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: sandbox, error } = await supabase
      .from("intelligence_sandboxes")
      .insert({
        name,
        created_by: adminId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        auto_delete: autoDelete,
        status: "active",
      })
      .select("id, name, starts_at, ends_at, auto_delete, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const row = sandbox as { id: string; name: string | null; starts_at: string; ends_at: string; auto_delete: boolean; status: string; created_at: string };
    return NextResponse.json({
      sandbox_id: row.id,
      name: row.name,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      auto_delete: row.auto_delete,
      status: row.status,
      created_at: row.created_at,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
