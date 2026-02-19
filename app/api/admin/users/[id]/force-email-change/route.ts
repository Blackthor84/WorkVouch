import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getAuditMeta } from "@/lib/email/system-audit";
import { logSystemAudit } from "@/lib/email/system-audit";
import { auditLog } from "@/lib/auditLogger";
import { sendEmail } from "@/lib/utils/sendgrid";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

/**
 * POST /api/admin/users/[id]/force-email-change
 * Admin or Superadmin. Force change user email with required reason; notify both old and new.
 * Uses @/lib/supabase/admin (service role) — auth.admin is not available on @/lib/supabase/server.
 * No raw errors leaked to frontend.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const admin = await requireAdminForApi();
    if (!admin) return adminForbiddenResponse();
    const { id: targetUserId } = await params;
    if (!targetUserId || typeof targetUserId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing user id" },
        { status: 400 }
      );
    }

    let body: { new_email?: string; newEmail?: string; reason?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const newEmailRaw =
      typeof body.new_email === "string"
        ? body.new_email
        : typeof body.newEmail === "string"
          ? body.newEmail
          : "";
    const newEmail = newEmailRaw.trim().toLowerCase();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!newEmail || !validateEmail(newEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email" },
        { status: 400 }
      );
    }
    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { success: false, error: "Reason must be at least 10 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: profile, error: fetchErr } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", targetUserId)
      .single();

    if (fetchErr || !profile) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const oldEmail = (profile.email ?? "").trim().toLowerCase();
    if (newEmail === oldEmail) {
      return NextResponse.json(
        { success: false, error: "New email is the same as current" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", newEmail)
      .neq("id", targetUserId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email is already in use by another account" },
        { status: 400 }
      );
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(
      targetUserId,
      { email: newEmail }
    );
    if (authError) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] Auth update failed:", authError);
      throw authError;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email: newEmail, email_verified: true })
      .eq("id", targetUserId);
    if (profileError) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] Profile update failed:", profileError);
      throw profileError;
    }

    const { ipAddress, userAgent } = getAuditMeta(req);

    try {
      await supabase.from("email_change_history").insert({
        user_id: targetUserId,
        previous_email: oldEmail,
        new_email: newEmail,
        changed_by: "admin",
        ip_address: ipAddress,
      });
    } catch (e) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] email_change_history insert:", e);
    }

    try {
      await supabase.from("admin_audit_logs").insert({
        admin_id: admin.userId,
        target_user_id: targetUserId,
        action: "user_email_change",
        old_value: { email: oldEmail },
        new_value: { email: newEmail },
        reason: `Admin force: ${reason}`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    } catch (e) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] admin_audit_logs insert:", e);
    }

    try {
      await logSystemAudit({
        eventType: "EMAIL_CHANGE_FORCED_ADMIN",
        userId: admin.userId,
        payload: { target_user_id: targetUserId, old_email: oldEmail, new_email: newEmail, reason },
        ipAddress,
        userAgent,
      });
      await auditLog({
        actorUserId: admin.userId,
        actorRole: admin.role,
        action: "email_change_forced_admin",
        targetUserId,
        metadata: { old_email: oldEmail, new_email: newEmail, reason },
        ipAddress,
        userAgent,
      });
    } catch (e) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] Audit log:", e);
    }

    const notifyHtml = (to: string, isNew: boolean) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>WorkVouch account email changed by support</h1>
        <p>Your WorkVouch account email has been changed ${isNew ? "to this address" : "from this address"}.</p>
        <p><strong>Previous email:</strong> ${oldEmail}</p>
        <p><strong>New email:</strong> ${newEmail}</p>
        <p><strong>Reason (admin):</strong> ${reason}</p>
        <p>If you did not expect this change, please contact support immediately.</p>
        <p>Best regards,<br>The WorkVouch Team</p>
      </div>
    `;
    try {
      await sendEmail(oldEmail, "WorkVouch: Your account email was changed", notifyHtml(oldEmail, false));
      await sendEmail(newEmail, "WorkVouch: Your account email was changed", notifyHtml(newEmail, true));
    } catch (e) {
      console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR] Send email:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Email updated successfully",
    });
  } catch (error) {
    console.error("[ADMIN_FORCE_EMAIL_CHANGE_ERROR]", error);

    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      if (error.message === "Forbidden" || error.message.startsWith("Forbidden")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
