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
 * Promote user to admin. SUPERADMIN ONLY (requireSuperAdminForApi). Cannot promote to superadmin (use seed).
 * Reason required. Audit log written on success; action fails if audit fails.
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

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Reason is required for promote action" },
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
    if (currentRole === "admin" || currentRole === "super_admin") {
      return NextResponse.json(
        { success: false, error: "User is already admin" },
        { status: 400 }
      );
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(targetUserId, {
      app_metadata: { role: "admin" },
    });
    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 500 }
      );
    }

    await supabase.from("profiles").update({ role: "admin" }).eq("id", targetUserId);

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    const isSandbox = await getAdminSandboxModeFromCookies();
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "user",
      targetId: targetUserId,
      action: "role_change",
      oldValue: { role: currentRole },
      newValue: { role: "admin" },
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
