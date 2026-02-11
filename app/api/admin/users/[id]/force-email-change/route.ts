import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireSuperAdmin } from "@/lib/admin/requireAdmin";
import { getAuditMeta } from "@/lib/email/system-audit";
import { logSystemAudit } from "@/lib/email/system-audit";
import { auditLog } from "@/lib/auditLogger";
import { sendEmail } from "@/lib/utils/sendgrid";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * POST /api/admin/users/[id]/force-email-change
 * Superadmin only. Force change user email with required reason; notify both old and new.
 * No silent changes; all logged.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin();
    const { id: targetUserId } = await params;
    if (!targetUserId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const new_email = typeof body.new_email === "string" ? body.new_email.trim().toLowerCase() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!new_email || !validateEmail(new_email)) {
      return NextResponse.json({ error: "Valid new_email is required" }, { status: 400 });
    }
    if (!reason || reason.length < 10) {
      return NextResponse.json({ error: "Reason is required (min 10 characters)" }, { status: 400 });
    }

    const supabaseAny = supabaseAdmin as any;

    const { data: profile, error: fetchErr } = await supabaseAny
      .from("profiles")
      .select("id, email")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const old_email = (profile.email ?? "").trim().toLowerCase();
    if (new_email === old_email) {
      return NextResponse.json({ error: "New email is the same as current" }, { status: 400 });
    }

    const { data: existing } = await supabaseAny
      .from("profiles")
      .select("id")
      .eq("email", new_email)
      .neq("id", targetUserId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 });
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, { email: new_email });
    if (authErr) {
      console.error("[SECURITY][EMAIL_CHANGE_FORCED_ADMIN] Auth update failed:", authErr);
      return NextResponse.json({ error: authErr.message || "Failed to update auth" }, { status: 500 });
    }

    const { error: profileErr } = await supabaseAny
      .from("profiles")
      .update({ email: new_email, email_verified: true })
      .eq("id", targetUserId);
    if (profileErr) {
      console.error("[SECURITY][EMAIL_CHANGE_FORCED_ADMIN] Profile update failed:", profileErr);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const { ipAddress, userAgent } = getAuditMeta(request);

    await supabaseAny.from("email_change_history").insert({
      user_id: targetUserId,
      previous_email: old_email,
      new_email,
      changed_by: "admin",
      ip_address: ipAddress,
    });

    await supabaseAny.from("admin_audit_logs").insert({
      admin_id: admin.userId,
      target_user_id: targetUserId,
      action: "user_email_change",
      old_value: { email: old_email },
      new_value: { email: new_email },
      reason: `Superadmin force: ${reason}`,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await logSystemAudit({
      eventType: "EMAIL_CHANGE_FORCED_ADMIN",
      userId: admin.userId,
      payload: { target_user_id: targetUserId, old_email, new_email, reason },
      ipAddress,
      userAgent,
    });
    await auditLog({
      actorUserId: admin.userId,
      actorRole: "superadmin",
      action: "email_change_forced_admin",
      targetUserId,
      metadata: { old_email, new_email, reason },
      ipAddress,
      userAgent,
    });
    console.info("[SECURITY][EMAIL_CHANGE_FORCED_ADMIN]", { admin_id: admin.userId, target_user_id: targetUserId, timestamp: new Date().toISOString() });

    const notifyHtml = (to: string, isNew: boolean) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>WorkVouch account email changed by support</h1>
        <p>Your WorkVouch account email has been changed ${isNew ? "to this address" : "from this address"}.</p>
        <p><strong>Previous email:</strong> ${old_email}</p>
        <p><strong>New email:</strong> ${new_email}</p>
        <p><strong>Reason (admin):</strong> ${reason}</p>
        <p>If you did not expect this change, please contact support immediately.</p>
        <p>Best regards,<br>The WorkVouch Team</p>
      </div>
    `;
    await sendEmail(old_email, "WorkVouch: Your account email was changed", notifyHtml(old_email, false));
    await sendEmail(new_email, "WorkVouch: Your account email was changed", notifyHtml(new_email, true));

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Internal error";
    if (msg === "Unauthorized") return NextResponse.json({ error: msg }, { status: 401 });
    if (msg === "Forbidden" || (typeof msg === "string" && msg.startsWith("Forbidden"))) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("[SECURITY][EMAIL_CHANGE_FORCED_ADMIN] FAIL:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
