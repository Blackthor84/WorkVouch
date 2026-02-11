import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin, assertAdminCanModify } from "@/lib/admin/requireAdmin";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";
import { withRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

/**
 * PATCH /api/admin/users/[id]/update
 * Admin/SuperAdmin edit user: full_name, role, status. Email change via force-email-change only.
 * Syncs profiles + auth.users. Uses supabaseAdmin for auth updates.
 * [ADMIN_UPDATE_USER]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const rl = withRateLimit(request, { userId: admin.userId, ...RATE_LIMITS.admin, prefix: "rl:admin:" });
    if (!rl.allowed) return rl.response;
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
    const role = typeof body.role === "string" ? body.role.trim() : undefined;
    const status = body.status as "active" | "suspended" | "deleted" | undefined;

    if (body.email !== undefined) {
      return NextResponse.json(
        { error: "Email cannot be changed here. Use POST /api/admin/users/[id]/force-email-change (superadmin only)." },
        { status: 400 }
      );
    }

    if (full_name !== undefined && full_name.length < 2) {
      return NextResponse.json({ error: "full_name must be at least 2 characters" }, { status: 400 });
    }
    if (status !== undefined && !["active", "suspended", "deleted"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabaseAny = supabaseAdmin as any;

    const { data: targetProfile, error: fetchErr } = await supabaseAny
      .from("profiles")
      .select("id, full_name, role, status")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !targetProfile) {
      console.error("[ADMIN_UPDATE_USER] User not found:", targetUserId, fetchErr);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = (targetProfile.role ?? "") || (await (async () => {
      const { data: roles } = await supabaseAny.from("user_roles").select("role").eq("user_id", targetUserId);
      return (roles?.[0] as { role?: string })?.role ?? "";
    })());
    assertAdminCanModify(admin, targetUserId, targetRole, role);

    const previous_value = { full_name: targetProfile.full_name, role: targetProfile.role, status: targetProfile.status };
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error: updateErr } = await supabaseAny
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId);

    if (updateErr) {
      console.error("[ADMIN_UPDATE_USER] Profile update failed:", updateErr);
      return NextResponse.json({ error: updateErr.message || "Failed to update profile" }, { status: 500 });
    }

    if (role !== undefined) {
      const roleValue = (role === "candidate" ? "user" : role) as "user" | "employer" | "admin" | "superadmin";
      await supabaseAny.from("user_roles").delete().eq("user_id", targetUserId);
      await supabaseAny.from("user_roles").insert({ user_id: targetUserId, role: roleValue });
    }

    const new_value = {
      full_name: full_name ?? targetProfile.full_name,
      role: role ?? targetProfile.role,
      status: status ?? targetProfile.status,
    };
    await supabaseAny.from("admin_audit_logs").insert({
      admin_id: admin.userId,
      target_user_id: targetUserId,
      action: "admin_update_profile",
      old_value: previous_value,
      new_value,
      reason: "Admin profile edit",
    });
    const { ipAddress, userAgent } = getAuditMetaFromRequest(request);
    await auditLog({
      actorUserId: admin.userId,
      actorRole: admin.role,
      action: "admin_user_edit",
      targetUserId,
      metadata: { previous_value, new_value },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message ?? "Internal error";
    console.error("[ADMIN_UPDATE_USER] FAIL:", e);
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || (typeof msg === "string" && msg.startsWith("Forbidden"))) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
