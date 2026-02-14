/**
 * POST /api/admin/employers/[id]/reactivate — clear suspended_at. Admin only. Audit required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { logAdminAction } from "@/lib/admin/audit";

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

    const { error } = await supabase
      .from("organizations")
      .update({ suspended_at: null })
      .eq("id", orgId);

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    const updatedOrg = { ...(oldRow as Record<string, unknown>), suspended_at: null };
    const isSandbox = await getAdminSandboxModeFromCookies();
    await logAdminAction(
      {
        userId: admin.userId,
        email: (admin.user as { email?: string })?.email ?? null,
        isSuperAdmin: admin.isSuperAdmin,
      },
      req,
      {
        action_type: "REACTIVATE_EMPLOYER",
        target_type: "organization",
        target_id: orgId,
        before_state: oldRow as Record<string, unknown>,
        after_state: updatedOrg,
        reason,
        is_sandbox: isSandbox,
      }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg.startsWith("Audit log failed")) return NextResponse.json({ success: false, error: "Audit failed" }, { status: 500 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
