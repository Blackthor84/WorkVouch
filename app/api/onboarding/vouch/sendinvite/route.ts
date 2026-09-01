import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";
import {
  buildSignupWithInviteUrl,
  buildVouchConfirmUrl,
  dispatchCoworkerVouchInviteMessages,
} from "@/lib/invites/dispatchCoworkerVouchInvite";
import {
  createDraftInvite,
  findInviteById,
  inviteWasSent,
} from "@/lib/invites/coworkerVouchInviteStore";
import { isValidEmail } from "@/lib/invites/coworkerVouchContact";
import {
  loadOnboardingContacts,
  type OnboardingContactRecord,
} from "@/lib/onboarding/productionSafeOnboardingContacts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveInviteForContact(
  contact: OnboardingContactRecord,
  userId: string,
  job: { id: string; company_name: string },
  email: string
): Promise<{ inviteId: string; inviteToken: string } | { error: string }> {
  const { invite: existing, error: loadErr } = await findInviteById(contact.id, userId);
  if (loadErr || !existing) {
    return { error: loadErr?.message ?? "Could not load saved coworker invite" };
  }

  if (inviteWasSent(existing.status)) {
    return { inviteId: existing.id, inviteToken: existing.token };
  }

  if (existing.token && existing.email === email) {
    return { inviteId: existing.id, inviteToken: existing.token };
  }

  const { invite: created, error } = await createDraftInvite({
    senderId: userId,
    jobId: job.id,
    email,
    phone: contact.phone,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `${email}: already invited` };
    }
    return { error: error.message ?? "Could not create invite" };
  }

  if (!created) {
    return { error: "Could not create invite" };
  }

  return { inviteId: created.id, inviteToken: created.token };
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
      if (!email || !isValidEmail(email)) continue;

      if (c.inviteSent) {
        const { invite } = await findInviteById(c.id, user.id);
        if (invite?.token) {
          sent.push(email);
          if (origin) {
            inviteUrls.push({
              email,
              confirmUrl: buildVouchConfirmUrl(origin, invite.token),
              signupUrl: buildSignupWithInviteUrl(origin, invite.token),
            });
          }
        }
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
