/**
 * Simulation Lab: manual kill switch. Purges one session and all its data, then deletes auth users.
 * Admin/superadmin only. Production-safe; no impact on non-simulation data.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: session } = await supabase
      .from("simulation_sessions")
      .select("id, created_by_admin_id")
      .eq("id", sessionId)
      .eq("created_by_admin_id", adminId)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: "Session not found or access denied" }, { status: 404 });

    const { data: profileIds, error: idError } = await supabase.rpc("get_simulation_profile_ids_by_session", {
      p_session_id: sessionId,
    });
    if (idError) return NextResponse.json({ error: idError.message }, { status: 500 });
    const ids = (profileIds ?? []) as unknown[];
    const toDelete = Array.isArray(ids)
      ? (ids
          .map((x) =>
            typeof x === "string" ? x : (x && typeof x === "object" ? (Object.values(x as Record<string, unknown>)[0] as string) : null)
          )
          .filter((s): s is string => typeof s === "string"))
      : [];

    const { data: purgeResult, error: purgeError } = await supabase.rpc("purge_simulation_session", {
      p_session_id: sessionId,
    });
    if (purgeError) return NextResponse.json({ error: purgeError.message }, { status: 500 });

    for (const id of toDelete) {
      await supabase.auth.admin.deleteUser(id);
    }

    return NextResponse.json({
      ok: true,
      purgeResult: purgeResult ?? [],
      deletedAuthUsers: toDelete.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
