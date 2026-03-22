/**
 * Twilio SMS delivery for verification invitations.
 * In sandbox/non-production, SMS is never sent; a block is audited and a no-op result returned.
 */

import { isSandbox } from "@/lib/env/env";
import { auditLog } from "@/lib/auditLogger";

export type SendVerificationSmsResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

/**
 * Send verification invitation SMS via Twilio.
 * Message: [requesterName] asked you to confirm... Confirm here: [verificationLink]. Reply STOP to opt out.
 */
export async function sendVerificationSms(
  phoneNumber: string,
  verificationLink: string,
  requesterName: string
): Promise<SendVerificationSmsResult> {
  if (isSandbox) {
    try {
      await auditLog({
        actorRole: "system",
        action: "sms_blocked_sandbox",
        metadata: { to: phoneNumber.slice(-4).padStart(4, "*") },
      });
    } catch (e) {
      console.error("[sms] sms_blocked_sandbox audit failed", e);
    }
    return { ok: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "SMS not configured (missing Twilio env)" };
  }

  const body = [
    `${requesterName} asked you to confirm a professional relationship on WorkVouch.`,
    "",
    `Confirm here:\n${verificationLink}`,
    "",
    "Reply STOP to opt out.",
  ].join("\n");

  try {
    const Twilio = (await import("twilio")).default;
    const client = Twilio(accountSid, authToken);
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: phoneNumber,
    });
    return { ok: true, messageId: message.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    console.error("[sms] sendVerificationSms failed", message);
    return { ok: false, error: message };
  }
}

export type SendCoworkerVouchSmsResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

/**
 * Coworker vouch invite — public confirm link (no account required).
 */
export async function sendCoworkerVouchInviteSms(
  phoneNumber: string,
  confirmLink: string,
  inviterName: string,
  companyName: string
): Promise<SendCoworkerVouchSmsResult> {
  if (isSandbox) {
    try {
      await auditLog({
        actorRole: "system",
        action: "sms_blocked_sandbox",
        metadata: { to: phoneNumber.slice(-4).padStart(4, "*"), kind: "coworker_vouch_invite" },
      });
    } catch (e) {
      console.error("[sms] coworker vouch sandbox audit failed", e);
    }
    return { ok: true };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "SMS not configured (missing Twilio env)" };
  }

  const co = companyName.trim() || "their workplace";
  const body = [
    `${inviterName} wants to confirm you worked together at ${co} on WorkVouch.`,
    "",
    `Tap to respond (no signup required):\n${confirmLink}`,
    "",
    "Reply STOP to opt out.",
  ].join("\n");

  try {
    const Twilio = (await import("twilio")).default;
    const client = Twilio(accountSid, authToken);
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: phoneNumber,
    });
    return { ok: true, messageId: message.sid };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    console.error("[sms] sendCoworkerVouchInviteSms failed", message);
    return { ok: false, error: message };
  }
}
