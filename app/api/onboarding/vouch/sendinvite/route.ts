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
import {
  linkContactToInvite,
  loadOnboardingContacts,
  type OnboardingContactRecord,
} from "@/lib/onboarding/productionSafeOnboardingContacts";
import { isMissingColumnError } from "@/lib/supabase/postgrestErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normCompany(name: string | undefined | null): string | null {
  const t = (name ?? "").trim().toLowerCase();
  return t.length ? t : null;
}

async function markInviteDispatched(inviteId: string): Promise<void> {
  const { error } = await admin
    .from("coworker_invites")
    .update({ invite_sent_at: new Date().toISOString() })
    .eq("id", inviteId);

  if (error && !isMissingColumnError(error)) {
    console.error("[onboarding/vouch/sendinvite] invite_sent_at update", error);
  }
}

async function resolveInviteForContact(
  contact: OnboardingContactRecord,
  userId: string,
  job: { id: string; company_name: string },
  email: string
): Promise<{ inviteId: string; inviteToken: string } | { error: string }> {
  if (contact.storage === "coworker_invites") {
    const { data, error } = await admin
      .from("coworker_invites")
      .select("id, invite_token")
      .eq("id", contact.id)
      .eq("sender_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { error: error?.message ?? "Could not load saved coworker invite" };
    }

    const row = data as { id: string; invite_token: string };
    return { inviteId: row.id, inviteToken: row.invite_token };
  }

  if (contact.coworker_invite_id) {
    const { data, error } = await admin
      .from("coworker_invites")
      .select("id, invite_token")
      .eq("id", contact.coworker_invite_id)
      .maybeSingle();

    if (error || !data) {
      return { error: error?.message ?? "Could not load coworker invite" };
    }

    const row = data as { id: string; invite_token: string };
    return { inviteId: row.id, inviteToken: row.invite_token };
  }

  const invite_token = generateInviteToken(16);
  const { data: row, error } = await admin
    .from("coworker_invites")
    .insert({
      sender_id: userId,
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
      return { error: `${email}: already invited` };
    }
    return { error: error.message };
  }

  const inv = row as { id: string; invite_token: string };
  const linkResult = await linkContactToInvite(contact, inv.id);
  if (linkResult.error) {
    return { error: linkResult.error.message ?? "Could not link coworker invite" };
  }

  return { inviteId: inv.id, inviteToken: inv.invite_token };
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

    const { contacts, error: contactsError } = await loadOnboardingContacts(user.id);
    if (contactsError) {
      return NextResponse.json({ error: contactsError.message ?? "Could not load coworkers" }, { status: 500 });
    }

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

    for (const c of contacts) {
      const email = (c.email ?? "").trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (c.coworker_invite_id) {
        sent.push(email);
        continue;
      }

      const resolved = await resolveInviteForContact(c, user.id, job, email);
      if ("error" in resolved) {
        errors.push(resolved.error);
        continue;
      }

      sent.push(email);

      if (origin) {
        const confirmUrl = buildVouchConfirmUrl(origin, resolved.inviteToken);
        const signupUrl = buildSignupWithInviteUrl(origin, resolved.inviteToken);
        inviteUrls.push({ email, confirmUrl, signupUrl });

        const dispatch = await dispatchCoworkerVouchInviteMessages({
          inviteId: resolved.inviteId,
          inviteToken: resolved.inviteToken,
          origin,
          inviterName,
          companyName: companyDisplay,
          email,
          phone: null,
          channels: ["email"],
        });
        if (dispatch.errors.length) {
          errors.push(`${email}: ${dispatch.errors.join(", ")}`);
        } else {
          await markInviteDispatched(resolved.inviteId);
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
