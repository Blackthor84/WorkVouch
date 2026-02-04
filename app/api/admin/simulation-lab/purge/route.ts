/**
 * Simulation Lab: purge expired simulation data.
 * Calls DB purge_expired_simulations(), then deletes expired auth users (profiles CASCADE).
 * Admin/superadmin only. Safe to run every 5 min.
 */

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin } from "@/lib/simulation-lab";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireSimulationLabAdmin();
    const supabase = getSupabaseServer();

    await supabase.rpc("simulation_session_transition_status");
    const { data: profileIds, error: idError } = await supabase.rpc("get_expired_simulation_profile_ids");
    if (idError) return NextResponse.json({ error: idError.message }, { status: 500 });
    const ids = (profileIds ?? []) as unknown[];
    const toDelete = Array.isArray(ids)
      ? (ids
          .map((x) =>
            typeof x === "string" ? x : (x && typeof x === "object" ? (Object.values(x as Record<string, unknown>)[0] as string) : null)
          )
          .filter((s): s is string => typeof s === "string"))
      : [];

    const { data: deleted, error: rpcError } = await supabase.rpc("purge_expired_simulations");
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

    for (const id of toDelete) {
      await supabase.auth.admin.deleteUser(id);
    }

    return NextResponse.json({
      ok: true,
      purgeResult: deleted ?? [],
      deletedAuthUsers: toDelete.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
