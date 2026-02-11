import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { logSystemAudit, getAuditMeta } from "@/lib/email/system-audit";

/**
 * POST /api/account/revoke-email-change
 * Revoke a pending email change (e.g. from "If this wasn't you" link in old email).
 * Token is single-use; request marked revoked.
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
      .select("id, user_id, old_email, new_email, status")
      .eq("verification_token", token)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    if (row.status !== "pending") {
      return NextResponse.json({ error: "This request has already been used or revoked" }, { status: 400 });
    }

    await supabaseAny.from("email_change_requests").update({ status: "revoked" }).eq("id", row.id);

    const { ipAddress, userAgent } = getAuditMeta(request);
    await logSystemAudit({
      eventType: "EMAIL_CHANGE_REVOKED",
      userId: row.user_id,
      payload: { old_email: row.old_email, new_email: row.new_email },
      ipAddress,
      userAgent,
    });
    console.info("[SECURITY][EMAIL_CHANGE_REVOKED]", { user_id: row.user_id, ip: ipAddress, timestamp: new Date().toISOString() });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[SECURITY][EMAIL_CHANGE_REVOKED] FAIL:", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
