import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/playground/abuse-scenario — run playground_generate_abuse_scenario RPC. Admin-only. */
export async function POST(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const employer_name = typeof body.employer_name === "string" ? body.employer_name.trim() : "Evil Corp";
  const employee_count = typeof body.employee_count === "number" ? body.employee_count : 1000;
  const mass_rehire = Boolean(body.mass_rehire);

  const supabase = getSupabaseServer();
  const { error } = await runScenarioRpc(supabase, "playground_generate_abuse_scenario", {
    employer_name,
    employee_count,
    mass_rehire,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Abuse simulation complete" });
}
