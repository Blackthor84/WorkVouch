/**
 * Cleanup enterprise simulation: delete simulation org and all linked data.
 * Safe only when org.is_simulation = true. Deletes auth users for session profiles.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";
import { requireEnterpriseSimulationMode } from "@/lib/enterprise/simulation-guard";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    requireEnterpriseSimulationMode();
    await requireSimulationLabAdmin();

    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId as string;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const sb = getSupabaseServer() as any;
    const { data: org, error: orgErr } = await sb
      .from("organizations")
      .select("id, is_simulation, simulation_session_id")
      .eq("id", orgId)
      .single();
    if (orgErr || !org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const row = org as { is_simulation?: boolean; simulation_session_id?: string | null };
    if (!row.is_simulation) {
      return NextResponse.json(
        { error: "Refusing to cleanup: organization is not a simulation org" },
        { status: 400 }
      );
    }
    const sessionId = row.simulation_session_id;

    const profileIds: string[] = [];
    if (sessionId) {
      const { data: ids } = await sb.rpc("get_simulation_profile_ids_for_session", {
        p_session_id: sessionId,
      });
      if (Array.isArray(ids)) {
        for (const r of ids) {
          const id = typeof r === "string" ? r : (r as { id?: string })?.id;
          if (id) profileIds.push(id);
        }
      }
    }

    const { data: cleanupResult, error: cleanupErr } = await sb.rpc("cleanup_enterprise_simulation", {
      p_org_id: orgId,
    });
    if (cleanupErr) {
      return NextResponse.json(
        { error: "Cleanup failed", detail: cleanupErr.message },
        { status: 500 }
      );
    }

    let authDeleted = 0;
    for (const pid of profileIds) {
      const { error: delErr } = await sb.auth.admin.deleteUser(pid);
      if (!delErr) authDeleted++;
    }

    return NextResponse.json({
      ok: true,
      cleanup: {
        steps: cleanupResult ?? [],
        auth_users_deleted: authDeleted,
        profile_ids_attempted: profileIds.length,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("ENTERPRISE_SIMULATION_MODE"))
      return NextResponse.json({ error: msg }, { status: 403 });
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
