import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

const CONFIRM_PAYLOAD = "DELETE";

/**
 * POST /api/account/delete
 * GDPR-compliant account deletion. Server-side only.
 * 1. Confirms user intent (body.confirm === "DELETE").
 * 2. Soft-deletes profile data (deleted_at).
 * 3. Inserts record into deletion_logs (GDPR audit).
 * 4. Logs to system_audit_logs for audit.
 * 5. Deletes auth user via service role (auth.admin.deleteUser).
 */
export async function POST(req: NextRequest) {
  const { session } = await getSupabaseSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { confirm?: string } = {};
  try {
    body = await req.json();
  } catch {
    // no body
  }
  if (body.confirm !== CONFIRM_PAYLOAD) {
    return NextResponse.json(
      { error: "Confirmation required. Send body: { confirm: \"DELETE\" }." },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const { ipAddress, userAgent } = getAuditMetaFromRequest(req);

  try {
    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    // 1) Soft-delete profile (user profile data)
    const { error: profileError } = await supabaseAny
      .from("profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      console.error("[account/delete] Profile soft-delete error:", profileError);
      return NextResponse.json(
        { error: "Failed to delete profile data. Please contact support." },
        { status: 500 }
      );
    }

    // 2) Insert into deletion_logs (GDPR-compliant record; before auth delete)
    const { error: deletionLogError } = await supabaseAny.from("deletion_logs").insert({
      user_id: userId,
      deleted_at: new Date().toISOString(),
      source: "user_initiated",
    });
    if (deletionLogError) {
      console.error("[account/delete] deletion_logs insert error:", deletionLogError);
    }

    // 3) Log to system_audit_logs for audit
    await auditLog({
      actorUserId: userId,
      actorRole: "user",
      action: "account_deletion",
      targetUserId: userId,
      metadata: { source: "user_initiated" },
      ipAddress,
      userAgent,
    });

    // 4) Delete auth user (Supabase Admin API, service role)
    const { error: authError } = await (supabase as any).auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[account/delete] Auth delete error:", authError);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again or contact support." },
      { status: 500 }
    );
  }
}
