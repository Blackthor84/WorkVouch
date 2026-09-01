import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import { parseContactField } from "@/lib/invites/coworkerVouchContact";
import {
  findInviteByToken,
  markInviteAccepted,
  type CoworkerVouchInvite,
} from "@/lib/invites/coworkerVouchInviteStore";
import { refreshCoworkerVouchStats } from "@/lib/invites/refreshCoworkerVouchStats";
import { phonesLooselyMatch } from "@/lib/invites/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inviteMatchesSignedInUser(
  inv: CoworkerVouchInvite,
  emailLower: string,
  authPhone: string | null | undefined
): boolean {
  const { email, phone } = parseContactField(inv.contact);
  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);
  if (!hasEmail && !hasPhone) return false;

  const emailOk = hasEmail && emailLower.length > 0 && email === emailLower;
  const phoneOk = hasPhone && !!authPhone && phonesLooselyMatch(phone, authPhone);

  if (hasEmail && hasPhone) return emailOk || phoneOk;
  if (hasEmail) return emailOk;
  return phoneOk;
}

async function hasWelcomeNotification(userId: string, inviterId: string): Promise<boolean> {
  const { data } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "coworker_invite_welcome")
    .eq("related_user_id", inviterId)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function refreshMatchesForUser(uid: string): Promise<void> {
  const { data: jobs } = await admin.from("jobs").select("id").eq("user_id", uid).eq("is_private", false);
  for (const j of (jobs ?? []) as { id: string }[]) {
    const { error: rpcErr } = await admin.rpc("detect_coworker_matches", { p_job_id: j.id });
    if (rpcErr) console.warn("detect_coworker_matches", j.id, rpcErr.message);
  }
}

async function sendClaimNotifications(args: {
  inviterId: string;
  inviteeId: string;
  jobId: string | null;
  inviterName: string;
  inviteeName: string;
  vouchAlreadyAccepted: boolean;
}): Promise<void> {
  if (!args.vouchAlreadyAccepted) {
    await admin.from("notifications").insert({
      user_id: args.inviterId,
      type: "vouch_received",
      title: "Someone vouched for you",
      message: `You've been vouched for by ${args.inviteeName} 🔥`,
      related_user_id: args.inviteeId,
      related_job_id: args.jobId,
    });
  }

  const alreadyWelcomed = await hasWelcomeNotification(args.inviteeId, args.inviterId);
  if (!alreadyWelcomed) {
    await admin.from("notifications").insert({
      user_id: args.inviteeId,
      type: "coworker_invite_welcome",
      title: `You're connected with ${args.inviterName}`,
      message:
        "You joined through their invite. Add a job at the same workplace to unlock your coworker match and grow both your trust scores.",
      related_user_id: args.inviterId,
      related_job_id: args.jobId,
    });
  }
}

/**
 * POST /api/invites/claim
 * Body: { token?: string } — token optional if stored in user raw_user_meta_data.coworker_invite_token
 * Links signed-in user to inviter when email/phone matches invite; re-runs match detection for both users' jobs.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || (!user.email && !user.phone)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      if (typeof meta?.coworker_invite_token === "string") token = meta.coworker_invite_token.trim();
    }

    if (!token) {
      return NextResponse.json({ ok: false, reason: "no_token" }, { status: 200 });
    }

    const emailLower = (user.email ?? "").trim().toLowerCase();

    const { invite, error: fetchErr } = await findInviteByToken(token);

    if (fetchErr || !invite) {
      return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 200 });
    }

    const inv = invite;

    if (inv.sender_id === user.id) {
      return NextResponse.json({ ok: false, reason: "self_invite" }, { status: 200 });
    }

    if ((inv.status ?? "").toLowerCase() === "declined") {
      return NextResponse.json({ ok: false, reason: "invite_declined" }, { status: 200 });
    }

    const matches = inviteMatchesSignedInUser(inv, emailLower, user.phone);
    if (!matches) {
      return NextResponse.json({ ok: false, reason: "email_mismatch" }, { status: 200 });
    }

    const statusLower = (inv.status ?? "").toLowerCase();
    const alreadyAccepted = statusLower === "accepted";

    if (!alreadyAccepted) {
      const updErr = await markInviteAccepted(inv.id);
      if (updErr) {
        return NextResponse.json({ error: updErr.message ?? "Could not accept invite" }, { status: 500 });
      }
      await refreshCoworkerVouchStats(inv.sender_id).catch((e) => {
        console.warn("[invites/claim] refreshCoworkerVouchStats", e);
      });
    }

    const { data: inviteeProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const inviteeName =
      ((inviteeProfile as { full_name?: string } | null)?.full_name ?? user.email?.split("@")[0] ?? "Your coworker").trim();

    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", inv.sender_id)
      .maybeSingle();
    const inviterName = ((inviterProfile as { full_name?: string } | null)?.full_name ?? "Someone").trim();

    await sendClaimNotifications({
      inviterId: inv.sender_id,
      inviteeId: user.id,
      jobId: inv.job_id,
      inviterName,
      inviteeName,
      vouchAlreadyAccepted: alreadyAccepted,
    });

    await refreshMatchesForUser(inv.sender_id);
    await refreshMatchesForUser(user.id);

    try {
      const meta = { ...(user.user_metadata as Record<string, unknown>) };
      delete meta.coworker_invite_token;
      await admin.auth.admin.updateUserById(user.id, { user_metadata: meta });
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      reason: alreadyAccepted ? "linked_after_public_vouch" : undefined,
      inviterName,
      inviteeName,
    });
  } catch (e) {
    console.error("invite claim", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
