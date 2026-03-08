// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { admin } from "@/lib/supabase-admin";
import { requireAdminForApi, assertAdminCanModify } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await requireAdminForApi();
  if (!adminSession) return adminForbiddenResponse();
  try {
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }
    const { data: oldRow } = await admin.from("profiles")
      .select("id, status, deleted_at, role")
      .eq("id", targetUserId)
      .single();

    if (!oldRow) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const targetRole = (oldRow as { role?: string }).role ?? "user";
    assertAdminCanModify(adminSession, targetUserId, targetRole);

    const now = new Date().toISOString();
    const { error } = await admin.from("profiles")
      .update({
        status: "deleted",
        deleted_at: now,
        is_deleted: true,
      })
      .eq("id", targetUserId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    await insertAdminAuditLog({
      adminId: adminSession.authUserId,
      targetUserId,
      action: "soft_delete",
      oldValue: oldRow as Record<string, unknown>,
      newValue: { status: "deleted", deleted_at: now },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
