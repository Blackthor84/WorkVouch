import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const dynamic = "force-dynamic";

/** DELETE: remove peer review (employment_references row), recalculate intelligence, audit. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  try {
    const { id: reviewId } = await params;
    if (!reviewId) {
      return NextResponse.json({ success: false, error: "Missing review id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: row, error: fetchError } = await supabase
      .from("employment_references")
      .select("id, reviewed_user_id, reviewer_id, rating, comment")
      .eq("id", reviewId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
    }

    const targetUserId = (row as { reviewed_user_id: string }).reviewed_user_id;

    const { error: deleteError } = await supabase
      .from("employment_references")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    await calculateUserIntelligence(targetUserId);

    const { ipAddress, userAgent } = getAuditRequestMeta(_req);
    await insertAdminAuditLog({
      adminId: admin.authUserId,
      targetUserId,
      action: "peer_review_delete",
      oldValue: row as Record<string, unknown>,
      newValue: null,
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
