import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSystemAudit, getAuditMeta } from "@/lib/email/system-audit";
import { auditLog } from "@/lib/auditLogger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/account/confirm-email-change
 * Step B: Verify token and apply email change. Single-use; must be pending and not expired.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const { data: row, error: fetchErr } = await supabaseAny
      .from("email_change_requests")
      .select("id, user_id, old_email, new_email, status, expires_at")
      .eq("verification_token", token)
      .single();

    if (fetchErr || !row) {
      console.error("[SECURITY][EMAIL_CHANGE_CONFIRMED] Token lookup failed or not found:", fetchErr);
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    if (row.status !== "pending") {
      console.error("[SECURITY][EMAIL_CHANGE_CONFIRMED] Reuse or revoked token:", row.status);
      return NextResponse.json({ error: "This link has already been used or revoked" }, { status: 400 });
    }

    const expiresAt = new Date(row.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      await supabaseAny
        .from("email_change_requests")
        .update({ status: "expired" })
        .eq("id", row.id);
      console.error("[SECURITY][EMAIL_CHANGE_CONFIRMED] Expired token");
      return NextResponse.json({ error: "This link has expired" }, { status: 400 });
    }

    const userId = row.user_id;
    const new_email = row.new_email;

    const { data: existing } = await supabaseAny
      .from("profiles")
      .select("id")
      .eq("email", new_email)
      .neq("id", userId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 });
    }

    const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { email: new_email });
    if (authErr) {
      console.error("[SECURITY][EMAIL_CHANGE_CONFIRMED] Auth update failed:", authErr);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    const { error: profileErr } = await supabaseAny
      .from("profiles")
      .update({ email: new_email, email_verified: true })
      .eq("id", userId);
    if (profileErr) {
      console.error("[SECURITY][EMAIL_CHANGE_CONFIRMED] Profile update failed:", profileErr);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    await supabaseAny
      .from("email_change_requests")
      .update({ status: "completed", verified_at: new Date().toISOString() })
      .eq("id", row.id);

    const { ipAddress, userAgent } = getAuditMeta(request);
    await supabaseAny.from("email_change_history").insert({
      user_id: userId,
      previous_email: row.old_email,
      new_email,
      changed_by: "self",
      ip_address: ipAddress,
    });

    await supabaseAny.from("admin_audit_logs").insert({
      admin_id: userId,
      target_user_id: userId,
      action: "user_email_change",
      old_value: { email: row.old_email },
      new_value: { email: new_email },
      reason: "Email change confirmed via verification link",
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await logSystemAudit({
      eventType: "EMAIL_CHANGE_CONFIRMED",
      userId,
      payload: { previous_email: row.old_email, new_email },
      ipAddress,
      userAgent,
    });
    await auditLog({
      actorUserId: userId,
      actorRole: "user",
      action: "email_change_confirmed",
      targetUserId: userId,
      metadata: { previous_email: row.old_email, new_email },
      ipAddress,
      userAgent,
    });
    console.info("[SECURITY][EMAIL_CHANGE_CONFIRMED]", { user_id: userId, ip: ipAddress, timestamp: new Date().toISOString() });

    try {
      const { error: fraudErr } = await supabaseAny.from("fraud_signals").insert({
        user_id: userId,
        signal_type: "email_change_completed",
        metadata: { previous_email: row.old_email, new_email },
      });
      if (fraudErr) console.error("[API][confirm-email-change] fraud_signals insert", { err: fraudErr });
    } catch (err: unknown) {
      console.error("[API][confirm-email-change] fraud_signals insert", { err });
    }

    try {
      const { triggerProfileIntelligence } = await import("@/lib/intelligence/engines");
      await triggerProfileIntelligence(userId);
    } catch (err: unknown) {
      console.error("[API][confirm-email-change] triggerProfileIntelligence", { userId, err });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[API][confirm-email-change] FAIL", { err });
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
