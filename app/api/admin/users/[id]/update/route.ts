import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { requireAdmin, assertAdminCanModify } from "@/lib/admin/requireAdmin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * PATCH /api/admin/users/[id]/update
 * Admin/SuperAdmin edit any user: full_name, email.
 * Logs to admin_audit_logs with action "admin_update_profile".
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const body = await request.json();
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;

    if (full_name !== undefined && full_name.length < 2) {
      return NextResponse.json({ error: "full_name must be at least 2 characters" }, { status: 400 });
    }
    if (email !== undefined && !validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const { data: targetProfile, error: fetchErr } = await supabaseAny
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = (targetProfile.role ?? "") || (await (async () => {
      const { data: roles } = await supabaseAny.from("user_roles").select("role").eq("user_id", targetUserId);
      return (roles?.[0] as { role?: string })?.role ?? "";
    })());
    assertAdminCanModify(admin, targetUserId, targetRole);

    const previous_value = { full_name: targetProfile.full_name, email: targetProfile.email };
    const updates: Record<string, unknown> = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (email !== undefined) {
      updates.email = email;
      updates.email_verified = false;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    if (email !== undefined && email !== (targetProfile.email ?? "").trim().toLowerCase()) {
      const { data: existing } = await supabaseAny
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", targetUserId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 });
      }
      const { error: authErr } = await supabase.auth.admin.updateUserById(targetUserId, { email });
      if (authErr) {
        return NextResponse.json({ error: "Failed to update auth email" }, { status: 500 });
      }
    }

    const { error: updateErr } = await supabaseAny
      .from("profiles")
      .update(updates)
      .eq("id", targetUserId);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const new_value = { full_name: full_name ?? targetProfile.full_name, email: email ?? targetProfile.email };
    await supabaseAny.from("admin_audit_logs").insert({
      admin_id: admin.userId,
      target_user_id: targetUserId,
      action: "admin_update_profile",
      old_value: previous_value,
      new_value,
      reason: "Admin profile edit",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || msg.startsWith("Forbidden:")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
