import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set([
  "create_playground_scenario",
  "snapshot_scenario",
  "abuse_mass_no_rehire",
  "recalc_scenario_reputation",
  "restore_snapshot",
  "reset_playground_scenario",
]);

export async function POST(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const fn = typeof body.fn === "string" ? body.fn.trim() : "";
  const params = (typeof body.params === "object" && body.params !== null ? body.params : {}) as Record<string, unknown>;

  if (!fn || !ALLOWED.has(fn)) {
    return NextResponse.json({ error: "Invalid fn" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await runScenarioRpc(supabase, fn, params);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
