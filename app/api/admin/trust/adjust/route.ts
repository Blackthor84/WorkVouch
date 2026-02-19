/**
 * POST /api/admin/trust/adjust — manually adjust trust score. Admin only. Audit required.
 * Body: { target_type: "user", target_id, new_score, reason }.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
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
    const targetId = typeof body.target_id === "string" ? body.target_id.trim() : "";
    const newScore = typeof body.new_score === "number" ? body.new_score : null;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!targetId || !reason) {
      return NextResponse.json({ success: false, error: "target_id and reason are required" }, { status: 400 });
    }

    const isSandbox = await getAdminSandboxModeFromCookies();
    const { ipAddress, userAgent } = getAuditRequestMeta(req);

    await insertAdminAuditLog({
      adminId: admin.userId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "trust_score",
      targetId,
      action: "trust_adjust",
      oldValue: {},
      newValue: { new_score: newScore },
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
