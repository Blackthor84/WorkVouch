/**
 * POST /api/admin/employers/[id]/suspend — suspend employer (organization). Admin only. Audit required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { insertAdminAuditLog } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const { id: orgId } = await params;
    if (!orgId) return NextResponse.json({ success: false, error: "Missing employer id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) return NextResponse.json({ success: false, error: "Reason is required" }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: oldRow } = await supabase
      .from("organizations")
      .select("id, name, slug, suspended_at")
      .eq("id", orgId)
      .single();

    if (!oldRow) return NextResponse.json({ success: false, error: "Employer not found" }, { status: 404 });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("organizations")
      .update({ suspended_at: now })
      .eq("id", orgId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const { ipAddress, userAgent } = getAuditRequestMeta(req);
    const isSandbox = await getAdminSandboxModeFromCookies();
    await insertAdminAuditLog({
      adminId: admin.userId,
      adminEmail: (admin.user as { email?: string })?.email ?? null,
      targetType: "employer",
      targetId: orgId,
      action: "employer_suspend",
      oldValue: oldRow as Record<string, unknown>,
      newValue: { suspended_at: now },
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
