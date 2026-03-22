/**
 * Send coworker vouch invite link (email and/or SMS). Updates invite_sent_at on success.
 */

import { admin } from "@/lib/supabase-admin";
import { sendEmail } from "@/lib/utils/sendgrid";
import { sendCoworkerVouchInviteSms } from "@/lib/sms/sendSms";

/** Short link; `app/(public)/vouch/[token]/page.tsx` redirects to the full confirm UI. */
export function buildVouchConfirmUrl(origin: string, inviteToken: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/vouch/${encodeURIComponent(inviteToken)}`;
}

export function buildSignupWithInviteUrl(origin: string, inviteToken: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/signup?invite=${encodeURIComponent(inviteToken)}`;
}

type DispatchArgs = {
  inviteId: string;
  inviteToken: string;
  origin: string;
  inviterName: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  channels: ("email" | "sms")[];
};

export type DispatchCoworkerInviteResult = {
  emailSent: boolean;
  smsSent: boolean;
  errors: string[];
};

export async function dispatchCoworkerVouchInviteMessages(
  args: DispatchArgs
): Promise<DispatchCoworkerInviteResult> {
  const { inviteId, inviteToken, origin, inviterName, companyName, email, phone, channels } = args;
  const confirmUrl = buildVouchConfirmUrl(origin, inviteToken);
  const signupUrl = buildSignupWithInviteUrl(origin, inviteToken);

  const errors: string[] = [];
  let emailSent = false;
  let smsSent = false;

  const safeCompany = companyName.trim() || "their workplace";

  if (channels.includes("email") && email) {
    const subject = `${inviterName} wants to confirm you worked together on WorkVouch`;
    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;font-family:system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.5;color:#111;background:#fafafa;">
  <div style="max-width:420px;margin:0 auto;background:#fff;padding:24px;border-radius:12px;">
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;"><strong>${escapeHtml(inviterName)}</strong> invited you to confirm you worked together at <strong>${escapeHtml(safeCompany)}</strong> on WorkVouch.</p>
    <p style="margin:0 0 20px;">No account needed to respond:</p>
    <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 20px;border-radius:10px;font-weight:600;">Confirm or decline</a>
    <p style="margin:20px 0 0;font-size:14px;color:#666;">Want a profile later? <a href="${escapeHtml(signupUrl)}">Sign up</a> with the same invite.</p>
  </div>
</body>
</html>`;
    const r = await sendEmail(email, subject, html);
    if (r.success) emailSent = true;
    else errors.push(r.error ?? "email_failed");
  }

  if (channels.includes("sms") && phone) {
    const r = await sendCoworkerVouchInviteSms(phone, confirmUrl, inviterName, safeCompany);
    if (r.ok) smsSent = true;
    else errors.push(r.error ?? "sms_failed");
  }

  if (emailSent || smsSent) {
    await admin.from("coworker_invites").update({ invite_sent_at: new Date().toISOString() }).eq("id", inviteId);
  }

  return { emailSent, smsSent, errors };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
