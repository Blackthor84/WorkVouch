import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi, assertAdminCanModify } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export const dynamic = "force-dynamic";

/**
 * Permanently disable user (hard disable: set status deleted or disabled).
 * 1. requireAdmin 2. sandbox 3. before 4. mutate 5. audit (if audit fails, return 500).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json({ success: false, error: "Reason is required for disable" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: oldRow } = await supabase
      .from("profiles")
      .select("id, status, role, deleted_at")
      .eq("id", targetUserId)
      .single();

    if (!oldRow) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const targetRole = (oldRow as { role?: string }).role ?? "user";
    assertAdminCanModify(admin, targetUserId, targetRole);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ status: "deleted", deleted_at: now })
      .eq("id", targetUserId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    const isSandbox = await getAdminSandboxModeFromCookies();
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "user",
      targetId: targetUserId,
      action: "disable",
      oldValue: oldRow as Record<string, unknown>,
      newValue: { status: "deleted", deleted_at: now },
      reason,
      ipAddress,
      userAgent,
      adminRole: admin.isSuperAdmin ? "superadmin" : "admin",
      isSandbox,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.startsWith("Audit log failed")) return NextResponse.json({ success: false, error: "Audit failed" }, { status: 500 });
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
