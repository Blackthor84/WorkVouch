import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { insertAdminAuditLog } from "@/lib/admin/audit";
import { getAuditRequestMeta } from "@/lib/admin/getAuditRequestMeta";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";

export const dynamic = "force-dynamic";

/** DELETE: remove employment record, recalculate intelligence for user, audit. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id: recordId } = await params;
    if (!recordId) {
      return NextResponse.json({ success: false, error: "Missing record id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: row, error: fetchError } = await supabase
      .from("employment_records")
      .select("id, user_id, company_name, job_title, start_date, end_date")
      .eq("id", recordId)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ success: false, error: "Employment record not found" }, { status: 404 });
    }

    const targetUserId = (row as { user_id: string }).user_id;

    const { error: deleteError } = await supabase
      .from("employment_records")
      .delete()
      .eq("id", recordId);

    if (deleteError) {
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    await calculateUserIntelligence(targetUserId);

    const { ipAddress, userAgent } = getAuditRequestMeta(_req);
    await insertAdminAuditLog({
      adminId: admin.userId,
      targetUserId,
      action: "employment_record_delete",
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
