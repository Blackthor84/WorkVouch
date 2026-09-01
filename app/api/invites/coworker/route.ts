import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import { buildContactField } from "@/lib/invites/coworkerVouchContact";
import { createDraftInvite } from "@/lib/invites/coworkerVouchInviteStore";
import {
  buildSignupWithInviteUrl,
  buildVouchConfirmUrl,
  dispatchCoworkerVouchInviteMessages,
} from "@/lib/invites/dispatchCoworkerVouchInvite";
import { normalizeToE164 } from "@/lib/invites/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/invites/coworker
 * Body: {
 *   email?: string,
 *   phone?: string,
 *   company_name?: string,
 *   job_id?: string,
 *   send?: boolean,
 *   channels?: ("email"|"sms")[]
 * }
 * Creates a pending invite in public.invites; optional SMS/email with short /vouch/:token → confirm UI
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw : "";
    const phoneE164 = phoneRaw ? normalizeToE164(phoneRaw) : null;

    if (!email && !phoneE164) {
      return NextResponse.json({ error: "Valid email or phone required" }, { status: 400 });
    }

    if (email && email === (user.email ?? "").toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    const job_id = typeof body.job_id === "string" && body.job_id.length >= 30 ? body.job_id : null;

    if (job_id) {
      const { data: job } = await admin.from("jobs").select("id, user_id").eq("id", job_id).maybeSingle();
      if (!job || (job as { user_id: string }).user_id !== user.id) {
        return NextResponse.json({ error: "Invalid job" }, { status: 400 });
      }
    }

    const send = body.send === true;
    const channelsIn = Array.isArray(body.channels) ? body.channels : null;
    let channels: ("email" | "sms")[] = [];
    if (send) {
      if (channelsIn?.length) {
        channels = channelsIn.filter((c) => c === "email" || c === "sms") as ("email" | "sms")[];
      } else {
        if (email) channels.push("email");
        if (phoneE164) channels.push("sms");
      }
      if (channels.length === 0) {
        return NextResponse.json({ error: "No delivery channel (add email or phone)" }, { status: 400 });
      }
    }

    const contact = buildContactField(email || null, phoneE164);
    if (!contact) {
      return NextResponse.json({ error: "Valid email or phone required" }, { status: 400 });
    }

    const { invite, error } = await createDraftInvite({
      senderId: user.id,
      jobId: job_id,
      email: email || null,
      phone: phoneE164,
    });

    if (error || !invite) {
      if (error?.code === "23505") {
        return NextResponse.json({ error: "Already invited this contact" }, { status: 409 });
      }
      return NextResponse.json({ error: error?.message ?? "Failed to create invite" }, { status: 500 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const origin = base || new URL(req.url).origin;
    const root = origin.replace(/\/$/, "");
    const confirmUrl = buildVouchConfirmUrl(root, invite.token);
    const signupUrl = buildSignupWithInviteUrl(root, invite.token);

    let dispatch: Awaited<ReturnType<typeof dispatchCoworkerVouchInviteMessages>> | null = null;

    if (send && channels.length > 0) {
      const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const inviterName = ((profile as { full_name?: string } | null)?.full_name ?? "Someone").trim() || "Someone";

      let companyName = "";
      if (job_id) {
        const { data: j } = await admin.from("jobs").select("company_name").eq("id", job_id).maybeSingle();
        companyName = ((j as { company_name?: string } | null)?.company_name ?? "").trim();
      }
      if (!companyName && body.company_name) {
        companyName = String(body.company_name).trim();
      }

      dispatch = await dispatchCoworkerVouchInviteMessages({
        inviteId: invite.id,
        inviteToken: invite.token,
        origin: root,
        inviterName,
        companyName: companyName || "their workplace",
        email: email || null,
        phone: phoneE164,
        channels,
      });
    }

    return NextResponse.json({
      ok: true,
      invite_token: invite.token,
      inviteUrl: signupUrl,
      confirmUrl,
      signupUrl,
      dispatch: dispatch
        ? { emailSent: dispatch.emailSent, smsSent: dispatch.smsSent, errors: dispatch.errors }
        : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
