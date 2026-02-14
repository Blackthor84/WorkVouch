/**
 * Simulation Lab: cron purge endpoint.
 * Call from external cron (e.g. every 5 min) with CRON_SECRET.
 * No session required; validates CRON_SECRET. Runs purge_expired_simulations + auth user delete.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServer();
    await supabase.rpc("simulation_session_transition_status");
    const { data: profileIds, error: idError } = await supabase.rpc("get_expired_simulation_profile_ids");
    if (idError) {
      return NextResponse.json({ error: idError.message }, { status: 500 });
    }
    const ids = (profileIds ?? []) as unknown[];
    const toDelete = Array.isArray(ids)
      ? (ids
          .map((x) =>
            typeof x === "string" ? x : (x && typeof x === "object" ? (Object.values(x as Record<string, unknown>)[0] as string) : null)
          )
          .filter((s): s is string => typeof s === "string"))
      : [];

    const { data: deleted, error: rpcError } = await supabase.rpc("purge_expired_simulations");
    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    for (const id of toDelete) {
      await supabase.auth.admin.deleteUser(id);
    }

    return NextResponse.json({
      ok: true,
      purgeResult: deleted ?? [],
      deletedAuthUsers: toDelete.length,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
