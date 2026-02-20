import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { supabaseServer } from "@/lib/supabase/server";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSandboxEvent } from "@/lib/sandbox/sandboxEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** POST /api/sandbox/impersonate — admin/superadmin only. Body: { id } (required), { sandboxId?, type?, name? } optional. Target must be a sandbox user. */
export async function POST(req: NextRequest) {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const adminId = authed.user.id;
    const body = await req.json().catch(() => ({})) as { id?: string; sandboxId?: string | null; type?: string; name?: string };
    const targetUserId = body.id;
    const sandboxId = body.sandboxId ?? null;
    const targetType = (body.type === "employer" ? "employer" : "employee") as "employee" | "employer";
    const targetName = typeof body.name === "string" ? body.name : "Sandbox user";

    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabaseAdmin = getServiceRoleClient();
    const [empRes, empOwnerRes] = await Promise.all([
      supabaseAdmin.from("sandbox_employees").select("id").eq("id", targetUserId).limit(1),
      supabaseAdmin.from("sandbox_employers").select("id").eq("id", targetUserId).limit(1),
    ]);
    const isEmployee = (empRes.data ?? []).length > 0;
    const isEmployer = (empOwnerRes.data ?? []).length > 0;
    if (!isEmployee && !isEmployer) {
      return NextResponse.json(
        { error: "Can only impersonate sandbox users" },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      id: targetUserId,
      type: targetType,
      name: targetName,
      sandboxId,
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
    void logSandboxEvent({
      type: "impersonation_started",
      message: "Impersonating sandbox user: " + targetName,
      actor: targetUserId,
      entity_type: "user",
      sandbox_id: sandboxId ?? null,
      metadata: { targetUserId, targetName, sandboxId },
    });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — clear sandbox impersonation. Admin/superadmin only. */
export async function DELETE(req: NextRequest) {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const adminId = authed.user.id;
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
