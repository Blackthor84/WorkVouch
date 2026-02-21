import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Demote admin to user. SUPERADMIN ONLY (requireSuperAdminForApi). Cannot demote self. Cannot demote superadmin.
 * Reason required. Audit log written on success; action fails if audit fails (no silent success).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireSuperAdminForApi();
  if (!admin) return adminForbiddenResponse();

  try {
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    if (admin.authUserId === targetUserId) {
      return NextResponse.json(
        { success: false, error: "Cannot demote yourself" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Reason is required for demote action" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", targetUserId)
      .single();

    if (!profile) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const currentRole = (profile as { role?: string }).role ?? "user";
    if (currentRole === "super_admin") {
      return NextResponse.json(
        { success: false, error: "Cannot demote superadmin" },
        { status: 403 }
      );
    }
    if (currentRole !== "admin") {
      return NextResponse.json(
        { success: false, error: "User is not an admin" },
        { status: 400 }
      );
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(targetUserId, {
      app_metadata: { role: "user" },
    });
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 500 }
      );
    }

    await supabase.from("profiles").update({ role: "user" }).eq("id", targetUserId);

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    const isSandbox = await getAdminSandboxModeFromCookies();
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "user",
      targetId: targetUserId,
      action: "role_change",
      oldValue: { role: currentRole },
      newValue: { role: "user" },
      reason,
      ipAddress,
      userAgent,
      adminRole: "superadmin",
      isSandbox,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
