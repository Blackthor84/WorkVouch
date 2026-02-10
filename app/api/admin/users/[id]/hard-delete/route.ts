import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";
import { insertAdminAuditLog } from "@/lib/admin/audit";

export const dynamic = "force-dynamic";

/** DELETE: hard delete (superadmin only). Removes profile and related data. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id: targetUserId } = await params();
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Missing user id" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: oldRow } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", targetUserId)
      .single();

    if (!oldRow) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { error } = await supabase.from("profiles").delete().eq("id", targetUserId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await insertAdminAuditLog({
      adminId: admin.userId,
      targetUserId,
      action: "hard_delete",
      oldValue: oldRow as Record<string, unknown>,
      newValue: null,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg === "Forbidden" || msg.startsWith("Forbidden:")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
