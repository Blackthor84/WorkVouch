import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { withRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { checkEmailChangeRateLimit } from "@/lib/email/email-change-rate-limit";
import {
  sendEmailChangeVerificationEmail,
  sendEmailChangeAlertToOldEmail,
  buildConfirmEmailChangeUrl,
  buildRevokeEmailChangeUrl,
} from "@/lib/email/email-change";
import { logSystemAudit, getAuditMeta } from "@/lib/email/system-audit";
import { randomBytes } from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_BYTES = 32;
const EXPIRES_HOURS = 24;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

function generateSecureToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * POST /api/account/request-email-change
 * Step A: User requests email change. Sends verification to new email, alert to old.
 * No email is changed until confirm-email-change is called with the token.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const rl = withRateLimit(request, { userId, ...RATE_LIMITS.defaultWrite, prefix: "rl:email:" });
    if (!rl.allowed) return rl.response;

    const body = await request.json().catch(() => ({}));
    const new_email = typeof body.new_email === "string" ? body.new_email.trim().toLowerCase() : "";
    if (!new_email || !validateEmail(new_email)) {
      return NextResponse.json({ error: "Valid new email is required" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const supabaseAny = supabase as any;

    const { data: profile } = await supabaseAny
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();
    const old_email = (profile?.email ?? "").trim().toLowerCase();
    if (new_email === old_email) {
      return NextResponse.json({ error: "New email is the same as current email" }, { status: 400 });
    }

    const { data: existing } = await supabaseAny
      .from("profiles")
      .select("id")
      .eq("email", new_email)
      .neq("id", userId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "Email is already in use by another account" }, { status: 400 });
    }

    const { allowed, count } = await checkEmailChangeRateLimit(userId);
    if (!allowed) {
      console.error("[SECURITY][EMAIL_CHANGE_REQUEST] Rate limit exceeded", { userId, count });
      return NextResponse.json(
        { error: "Too many email change requests. Please try again later." },
        { status: 429 }
      );
    }

    const verification_token = generateSecureToken();
    const expires_at = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000).toISOString();
    const { ipAddress, userAgent } = getAuditMeta(request);

    const { error: insertErr } = await supabaseAny.from("email_change_requests").insert({
      user_id: userId,
      old_email,
      new_email,
      verification_token,
      requested_ip: ipAddress,
      requested_user_agent: userAgent,
      expires_at,
      status: "pending",
    });

    if (insertErr) {
      console.error("[SECURITY][EMAIL_CHANGE_REQUEST] Insert failed:", insertErr);
      return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
    }

    const confirmLink = buildConfirmEmailChangeUrl(verification_token);
    const revokeLink = buildRevokeEmailChangeUrl(verification_token);

    await sendEmailChangeVerificationEmail(new_email, confirmLink, EXPIRES_HOURS);
    await sendEmailChangeAlertToOldEmail(
      old_email,
      new_email,
      revokeLink,
      ipAddress,
      userAgent,
      new Date().toISOString()
    );

    await logSystemAudit({
      eventType: "EMAIL_CHANGE_REQUEST",
      userId,
      payload: { old_email, new_email, expires_at },
      ipAddress,
      userAgent,
    });
    console.info("[SECURITY][EMAIL_CHANGE_REQUEST]", { user_id: userId, ip: ipAddress, timestamp: new Date().toISOString() });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[SECURITY][EMAIL_CHANGE_REQUEST] FAIL:", e);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
