import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";
import { getAdminSession } from "@/lib/auth/getAdminSession";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/sandbox/impersonate — body: { targetUserId?, targetType?, targetName?, sandboxId? }. Sets cookie for banner/session. */
export async function POST(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const session = await getAdminSession();
    const adminId = session?.userId ?? "";
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId ?? body.target_id;
    const targetType = (body.targetType ?? body.target_type ?? "employee") as string;
    const targetName = body.targetName ?? body.target_name ?? "Sandbox user";
    const sandboxId = body.sandboxId ?? body.sandbox_id;

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
    }

    const payload = JSON.stringify({
      type: targetType === "employer" ? "employer" : "employee",
      id: targetUserId,
      name: targetName,
      sandboxId: sandboxId ?? null,
    });
    const maxAge = 60 * 60 * 8;
    const res = NextResponse.json({ ok: true });
    res.cookies.set("sandbox_playground_impersonation", payload, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    try {
      const supabase = await supabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      const { ipAddress, userAgent } = getAuditRequestMeta(req);
      await writeImpersonationAudit({
        admin_user_id: adminId,
        admin_email: user?.email ?? null,
        target_user_id: targetUserId,
        target_identifier: targetName,
        event: "start",
        environment: "sandbox",
        ip_address: ipAddress ?? null,
        user_agent: userAgent ?? null,
      });
    } catch (e) {
      console.error("[sandbox/impersonate] impersonation_audit insert failed", e);
    }
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE or POST with body { exit: true } to clear impersonation */
export async function DELETE(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;
  try {
    const session = await getAdminSession();
    const adminId = session?.userId ?? "";
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
    console.error("[sandbox/impersonate DELETE] impersonation_audit insert failed", e);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sandbox_playground_impersonation", "", { maxAge: 0, path: "/" });
  return res;
}
