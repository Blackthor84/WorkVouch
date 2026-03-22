import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import {
  buildSignupWithInviteUrl,
  buildVouchConfirmUrl,
  dispatchCoworkerVouchInviteMessages,
} from "@/lib/invites/dispatchCoworkerVouchInvite";
import { generateInviteToken } from "@/lib/invites/inviteToken";
import { normalizeToE164 } from "@/lib/invites/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/invites/coworker
 * Body: {
 *   email?: string,
 *   phone?: string,
 *   company_name?: string,
 *   job_id?: string,
 *   send?: boolean,
 *   channels?: ("email"|"sms")[]  // default: infer from provided email/phone when send=true
 * }
 * Creates a pending coworker_invite; optional SMS/email with short /vouch/:token → confirm UI
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

    const company_normalized = normalizeCompany(body.company_name);
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

    const invite_token = generateInviteToken(16);

    const insertPayload: Record<string, unknown> = {
      sender_id: user.id,
      invite_token,
      status: "pending",
      company_normalized,
      job_id,
    };
    if (email) insertPayload.email = email;
    if (phoneE164) insertPayload.phone = phoneE164;

    const { data: row, error } = await admin
      .from("coworker_invites")
      .insert(insertPayload)
      .select("id, invite_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Already invited this contact" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const inv = row as { id: string; invite_token: string };
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const origin = base || new URL(req.url).origin;
    const root = origin.replace(/\/$/, "");
    const confirmUrl = buildVouchConfirmUrl(root, inv.invite_token);
    const signupUrl = buildSignupWithInviteUrl(root, inv.invite_token);

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
        inviteId: inv.id,
        inviteToken: inv.invite_token,
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
      invite_token: inv.invite_token,
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
