import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const IMPERSONATION_COOKIE = "sandbox_playground_impersonation";

/** POST /api/sandbox/impersonate/exit — clear impersonation cookie. Admin/superadmin only. Call before logout for auto-exit. */
export async function POST(req: NextRequest) {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let targetUserId: string | null = null;
  let targetIdentifier: string | null = null;
  try {
    const adminId = authed.user.id;
    const cookie = req.cookies.get(IMPERSONATION_COOKIE)?.value;
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

  void logSandboxEvent({
    type: "impersonation_ended",
    message: "Sandbox impersonation ended.",
    actor: targetUserId ?? undefined,
    entity_type: "user",
    metadata: { targetUserId: targetUserId ?? null },
  });

  const res = NextResponse.json({ ok: true });
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
