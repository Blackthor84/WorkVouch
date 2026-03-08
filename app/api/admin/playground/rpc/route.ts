// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";
import { insertAdminAuditLog } from "@/lib/admin/audit";

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
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck.response;
  const adminSession = await requireAdminForApi();
  if (!adminSession) return adminForbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const fn = typeof body.fn === "string" ? body.fn.trim() : "";
  const params = (typeof body.params === "object" && body.params !== null ? body.params : {}) as Record<string, unknown>;

  if (!fn || !ALLOWED.has(fn)) {
    return NextResponse.json({ error: "Invalid fn" }, { status: 400 });
  }
  const { data, error } = await runScenarioRpc(admin, fn, params);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (envCheck.overrideActive && admin) {
    await insertAdminAuditLog({
      adminId: adminSession.authUserId,
      adminEmail: adminSession.user?.email ?? null,
      targetType: "system",
      action: "playground_mutation_under_override",
      newValue: { fn, params },
      reason: `Playground RPC: ${fn}`,
      adminRole: adminSession.isSuperAdmin ? "superadmin" : "admin",
      isSandbox: false,
    });
  }
  return NextResponse.json({ ok: true, data });
}
