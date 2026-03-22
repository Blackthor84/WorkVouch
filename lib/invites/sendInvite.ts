/**
 * Create a coworker vouch invite and optionally send SMS/email with a short link.
 *
 * **Server-only** — uses the admin Supabase client. Call from API routes or server actions, not the browser.
 *
 * This maps your pattern (`sendInvite`, `nanoid`, Twilio) onto WorkVouch’s `coworker_invites` table
 * and shared dispatch helpers (SendGrid + Twilio).
 */

import { admin } from "@/lib/supabase-admin";
import {
  buildSignupWithInviteUrl,
  buildVouchConfirmUrl,
  dispatchCoworkerVouchInviteMessages,
} from "@/lib/invites/dispatchCoworkerVouchInvite";
import { generateInviteToken } from "@/lib/invites/inviteToken";
import { normalizeToE164 } from "@/lib/invites/phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

function parseContact(contact: string | { email?: string; phone?: string }): {
  email: string | null;
  phone: string | null;
} {
  if (typeof contact === "object" && contact !== null) {
    const rawEmail = typeof contact.email === "string" ? contact.email.trim().toLowerCase() : "";
    const email = rawEmail && EMAIL_RE.test(rawEmail) ? rawEmail : null;
    const phone = typeof contact.phone === "string" ? normalizeToE164(contact.phone) : null;
    return { email, phone };
  }
  const raw = String(contact).trim();
  if (!raw) return { email: null, phone: null };
  if (raw.includes("@") && EMAIL_RE.test(raw.toLowerCase())) {
    return { email: raw.toLowerCase(), phone: null };
  }
  return { email: null, phone: normalizeToE164(raw) };
}

export type SendInviteArgs = {
  userId: string;
  jobId: string;
  /** Single string (email or phone) or explicit fields */
  contact: string | { email?: string; phone?: string };
  /** Site origin, e.g. `https://tryworkvouch.com`. Falls back to `NEXT_PUBLIC_SITE_URL`. */
  origin?: string;
  /** Send via SendGrid/Twilio when channels allow (default: true) */
  sendMessage?: boolean;
  channels?: ("email" | "sms")[];
};

export type SendInviteResult = {
  /** Short public URL → redirects to full confirm UI */
  link: string;
  token: string;
  inviteId: string;
  signupUrl: string;
  dispatch?: { emailSent: boolean; smsSent: boolean; errors: string[] };
};

/**
 * Same idea as:
 * `nanoid` → insert `invites` → `https://app/vouch/${token}` → Twilio.
 * Here: `coworker_invites` + `/vouch/:token` + optional email/SMS.
 */
export async function sendInvite({
  userId,
  jobId,
  contact,
  origin: originArg,
  sendMessage = true,
  channels: channelsArg,
}: SendInviteArgs): Promise<SendInviteResult> {
  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, user_id, company_name")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job || (job as { user_id: string }).user_id !== userId) {
    throw new Error("Invalid job or not owned by user");
  }

  const j = job as { id: string; company_name: string | null };
  const { email, phone } = parseContact(contact);
  if (!email && !phone) {
    throw new Error("Valid email or phone required");
  }

  const token = generateInviteToken(16);
  const company_normalized = normalizeCompany(j.company_name);

  const insertPayload: Record<string, unknown> = {
    sender_id: userId,
    invite_token: token,
    status: "pending",
    company_normalized,
    job_id: j.id,
  };
  if (email) insertPayload.email = email;
  if (phone) insertPayload.phone = phone;

  const { data: row, error } = await admin.from("coworker_invites").insert(insertPayload).select("id").single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Already invited this contact");
    }
    throw new Error(error.message);
  }

  const inviteId = (row as { id: string }).id;
  const root = (originArg ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (!root) {
    throw new Error("origin or NEXT_PUBLIC_SITE_URL is required for invite links");
  }

  const link = buildVouchConfirmUrl(root, token);
  const signupUrl = buildSignupWithInviteUrl(root, token);

  let dispatch: SendInviteResult["dispatch"];
  if (sendMessage) {
    let channels = channelsArg;
    if (!channels?.length) {
      channels = [];
      if (email) channels.push("email");
      if (phone) channels.push("sms");
    }
    if (channels.length > 0) {
      const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      const inviterName = ((profile as { full_name?: string } | null)?.full_name ?? "Someone").trim() || "Someone";
      const companyName = (j.company_name ?? "").trim() || "their workplace";
      const d = await dispatchCoworkerVouchInviteMessages({
        inviteId,
        inviteToken: token,
        origin: root,
        inviterName,
        companyName,
        email,
        phone,
        channels,
      });
      dispatch = { emailSent: d.emailSent, smsSent: d.smsSent, errors: d.errors };
    }
  }

  return { link, token, inviteId, signupUrl, dispatch };
}

/** Alias for clearer call sites in app code */
export const sendCoworkerInvite = sendInvite;
