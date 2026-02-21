import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { runScenarioRpc } from "@/lib/sandbox/runScenarioRpc";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";
import { insertAdminAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["playground_small", "playground_medium", "playground_large", "reset_playground"]);

export async function POST(req: NextRequest) {
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck.response;
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  const body = await req.json().catch(() => ({}));
  const fn = typeof body.fn === "string" ? body.fn.trim() : "";
  if (!fn || !ALLOWED.has(fn)) {
    return NextResponse.json({ error: "Invalid fn" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { error } = await runScenarioRpc(supabase, fn, {});
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (envCheck.overrideActive && admin) {
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      adminEmail: admin.user?.email ?? null,
      targetType: "system",
      action: "playground_mutation_under_override",
      newValue: { fn },
      reason: `Playground run: ${fn}`,
      adminRole: admin.isSuperAdmin ? "superadmin" : "admin",
      isSandbox: false,
    });
  }
  return NextResponse.json({ ok: true, fn });
}
