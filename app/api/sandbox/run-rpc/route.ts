/**
 * POST /api/sandbox/run-rpc — run a Supabase RPC by name (admin/sandbox only).
 * Body: { name: string, params?: Record<string, unknown> }
 * RPC must exist in DB. Use for scenario functions (e.g. run_scenario_healthy_team).
 */

import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RPC_NAME_PREFIX = "run_scenario_";

export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const params = typeof body.params === "object" && body.params !== null ? body.params as Record<string, unknown> : {};

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  if (!name.startsWith(RPC_NAME_PREFIX) || name.length <= RPC_NAME_PREFIX.length) {
    return NextResponse.json(
      { error: `RPC name must start with "${RPC_NAME_PREFIX}" (e.g. run_scenario_healthy_team)` },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServer();
  const { data, error } = await runScenarioRpc(supabase, name, params);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, name, data });
}
