import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/admin/playground/abuse-scenario — run playground_generate_abuse_scenario RPC. Sandbox or production override + admin only. */
export async function POST(req: NextRequest) {
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck.response;
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

  if (envCheck.overrideActive && admin) {
    const { insertAdminAuditLog } = await import("@/lib/admin/audit");
    await insertAdminAuditLog({
      adminId: admin.userId,
      adminEmail: admin.user?.email ?? null,
      targetType: "system",
      action: "playground_mutation_under_override",
      newValue: { rpc: "playground_generate_abuse_scenario", employer_name, employee_count, mass_rehire },
      reason: "Abuse scenario run under production override",
      adminRole: admin.isSuperAdmin ? "superadmin" : "admin",
      isSandbox: false,
    });
  }
  return NextResponse.json({ ok: true, message: "Abuse simulation complete" });
}
