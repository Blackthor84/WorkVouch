import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import {
  buildSignupWithInviteUrl,
  buildVouchConfirmUrl,
  dispatchCoworkerVouchInviteMessages,
} from "@/lib/invites/dispatchCoworkerVouchInvite";
import { generateInviteToken } from "@/lib/invites/inviteToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: jobRow } = await admin
      .from("jobs")
      .select("id, company_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const job = jobRow as { id: string; company_name: string } | null;
    if (!job?.id) {
      return NextResponse.json({ error: "Add a job first" }, { status: 400 });
    }

    const { data: contacts } = await admin
      .from("worker_onboarding_contacts")
      .select("id, email, coworker_invite_id")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    const list = (contacts ?? []) as Array<{
      id: string;
      email: string | null;
      coworker_invite_id: string | null;
    }>;

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
    const origin =
      baseUrl || (typeof req.url === "string" ? new URL(req.url).origin : "");

    const sent: string[] = [];
    const errors: string[] = [];
    const inviteUrls: { email: string; confirmUrl: string; signupUrl: string }[] = [];

    const { data: senderProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const inviterName =
      ((senderProfile as { full_name?: string } | null)?.full_name ?? "Someone").trim() || "Someone";
    const companyDisplay = (job.company_name ?? "").trim() || "their workplace";

    for (const c of list) {
      const email = (c.email ?? "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (c.coworker_invite_id) {
        sent.push(email);
        continue;
      }

      const invite_token = generateInviteToken(16);
      const { data: row, error } = await admin
        .from("coworker_invites")
        .insert({
          sender_id: user.id,
          email,
          invite_token,
          status: "pending",
          company_normalized: normCompany(job.company_name),
          job_id: job.id,
        })
        .select("id, invite_token")
        .single();

      if (error) {
        if (error.code === "23505") {
          errors.push(`${email}: already invited`);
          continue;
        }
        errors.push(error.message);
        continue;
      }

      const inv = row as { id: string; invite_token: string };
      await admin.from("worker_onboarding_contacts").update({ coworker_invite_id: inv.id }).eq("id", c.id);
      sent.push(email);

      if (origin) {
        const confirmUrl = buildVouchConfirmUrl(origin, inv.invite_token);
        const signupUrl = buildSignupWithInviteUrl(origin, inv.invite_token);
        inviteUrls.push({ email, confirmUrl, signupUrl });

        const dispatch = await dispatchCoworkerVouchInviteMessages({
          inviteId: inv.id,
          inviteToken: inv.invite_token,
          origin,
          inviterName,
          companyName: companyDisplay,
          email,
          phone: null,
          channels: ["email"],
        });
        if (dispatch.errors.length) {
          errors.push(`${email}: ${dispatch.errors.join(", ")}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      sentCount: sent.length,
      sentEmails: sent,
      inviteUrls,
      errors: errors.length ? errors : undefined,
      message:
        sent.length > 0
          ? "Invite sent — once they confirm, your profile becomes verified"
          : "No email addresses to send — add an email for a coworker or continue.",
    });
  } catch (e) {
    console.error("[onboarding/vouch/sendinvite]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
