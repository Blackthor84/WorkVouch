import { NextRequest, NextResponse } from "next/server";
import { requireSandboxMode } from "@/lib/sandbox/apiGuard";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/sandbox/impersonate/exit — clear impersonation cookie. Logs end to impersonation_audit. */
export async function POST(req: NextRequest) {
  const guard = requireSandboxMode();
  if (guard) return guard;

  try {
    const { id: adminId } = await requireSandboxV2Admin();
    const cookie = req.cookies.get("sandbox_playground_impersonation")?.value;
    let targetUserId: string | null = null;
    let targetIdentifier: string | null = null;
    if (cookie) {
      try {
        const parsed = JSON.parse(cookie) as { id?: string; name?: string };
        targetUserId = parsed.id ?? null;
        targetIdentifier = parsed.name ?? null;
      } catch {
        // ignore
      }
    }
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await writeImpersonationAudit({
      admin_user_id: adminId,
      admin_email: user?.email ?? null,
      target_user_id: targetUserId,
      target_identifier: targetIdentifier ?? "exit",
      event: "end",
      environment: "sandbox",
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    });
  } catch (e) {
    console.error("[sandbox/impersonate/exit] impersonation_audit insert failed", e);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("sandbox_playground_impersonation", "", { maxAge: 0, path: "/" });
  return res;
}
