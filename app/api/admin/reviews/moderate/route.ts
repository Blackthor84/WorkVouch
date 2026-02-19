/**
 * POST /api/admin/reviews/moderate — remove or restore a review. Admin only. Audit required.
 * Body: { review_id, action: "remove" | "restore", reason }.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { insertAdminAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const body = await req.json().catch(() => ({}));
    const reviewId = typeof body.review_id === "string" ? body.review_id.trim() : "";
    const action = body.action === "restore" ? "restore" : "remove";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reviewId || !reason) {
      return NextResponse.json({ success: false, error: "review_id and reason are required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const isSandbox = await getAdminSandboxModeFromCookies();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);

    const actionType = action === "restore" ? "review_restore" : "review_remove";
    await insertAdminAuditLog({
      adminId: admin.userId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "review",
      targetId: reviewId,
      action: actionType,
      oldValue: {},
      newValue: { action, review_id: reviewId },
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
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
