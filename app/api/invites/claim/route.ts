import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase-admin";
import { phonesLooselyMatch } from "@/lib/invites/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InviteRow = {
  id: string;
  sender_id: string;
  email: string | null;
  phone: string | null;
  status: string;
  company_normalized: string | null;
  job_id: string | null;
  accepted_user_id: string | null;
};

function inviteMatchesSignedInUser(inv: InviteRow, emailLower: string, authPhone: string | null | undefined): boolean {
  const em = (inv.email ?? "").trim().toLowerCase();
  const ph = (inv.phone ?? "").trim();
  const hasEmail = em.length > 0;
  const hasPhone = ph.length > 0;
  if (!hasEmail && !hasPhone) return false;

  const emailOk = hasEmail && emailLower.length > 0 && em === emailLower;
  const phoneOk = hasPhone && !!authPhone && phonesLooselyMatch(inv.phone, authPhone);

  if (hasEmail && hasPhone) return emailOk || phoneOk;
  if (hasEmail) return emailOk;
  return phoneOk;
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

    const { data: invite, error: fetchErr } = await admin
      .from("coworker_invites")
      .select("id, sender_id, email, phone, status, company_normalized, job_id, accepted_user_id")
      .eq("invite_token", token)
      .maybeSingle();

    if (fetchErr || !invite) {
      return NextResponse.json({ ok: false, reason: "invalid_token" }, { status: 200 });
    }

    const inv = invite as InviteRow;

    if (inv.sender_id === user.id) {
      return NextResponse.json({ ok: false, reason: "self_invite" }, { status: 200 });
    }

    if (inv.status === "declined") {
      return NextResponse.json({ ok: false, reason: "invite_declined" }, { status: 200 });
    }

    const matches = inviteMatchesSignedInUser(inv, emailLower, user.phone);

    /** Public page already accepted vouch; attach profile when they later sign up. */
    if (inv.status === "accepted" && !inv.accepted_user_id) {
      if (!matches) {
        return NextResponse.json({ ok: false, reason: "contact_mismatch" }, { status: 200 });
      }

      const { error: linkErr } = await admin
        .from("coworker_invites")
        .update({ accepted_user_id: user.id })
        .eq("id", inv.id)
        .eq("status", "accepted")
        .is("accepted_user_id", null);

      if (linkErr) {
        return NextResponse.json({ error: linkErr.message }, { status: 500 });
      }

      const { data: inviteeProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const inviteeName =
        ((inviteeProfile as { full_name?: string } | null)?.full_name ?? user.email?.split("@")[0] ?? "Your coworker").trim();

      const { data: inviterProfile } = await admin.from("profiles").select("full_name").eq("id", inv.sender_id).maybeSingle();
      const inviterName = ((inviterProfile as { full_name?: string } | null)?.full_name ?? "Someone").trim();

      await admin.from("notifications").insert({
        user_id: user.id,
        type: "coworker_invite_welcome",
        title: `You're connected with ${inviterName}`,
        message:
          "You joined through their invite. Add a job at the same workplace to unlock your coworker match and grow both your trust scores.",
        related_user_id: inv.sender_id,
        related_job_id: inv.job_id,
      });

      const refreshMatchesForUser = async (uid: string) => {
        const { data: jobs } = await admin.from("jobs").select("id").eq("user_id", uid).eq("is_private", false);
        for (const j of (jobs ?? []) as { id: string }[]) {
          const { error: rpcErr } = await admin.rpc("detect_coworker_matches", { p_job_id: j.id });
          if (rpcErr) console.warn("detect_coworker_matches", j.id, rpcErr.message);
        }
      };

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
        reason: "linked_after_public_vouch",
        inviterName,
        inviteeName,
      });
    }

    if (inv.status !== "pending") {
      return NextResponse.json({ ok: true, reason: "already_accepted" }, { status: 200 });
    }

    if (!matches) {
      return NextResponse.json({ ok: false, reason: "email_mismatch" }, { status: 200 });
    }

    const now = new Date().toISOString();
    const { error: updErr } = await admin
      .from("coworker_invites")
      .update({
        status: "accepted",
        accepted_at: now,
        accepted_user_id: user.id,
      })
      .eq("id", inv.id)
      .eq("status", "pending");

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    const { data: inviteeProfile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const inviteeName =
      ((inviteeProfile as { full_name?: string } | null)?.full_name ?? user.email?.split("@")[0] ?? "Your coworker").trim();

    const { data: inviterProfile } = await admin.from("profiles").select("full_name").eq("id", inv.sender_id).maybeSingle();
    const inviterName = ((inviterProfile as { full_name?: string } | null)?.full_name ?? "Someone").trim();

    try {
      await admin.rpc("refresh_user_vouch_stats", { p_user_id: inv.sender_id });
    } catch {
      /* migration may not be applied yet */
    }

    await admin.from("notifications").insert({
      user_id: inv.sender_id,
      type: "vouch_received",
      title: "Someone vouched for you",
      message: `You've been vouched for by ${inviteeName} 🔥`,
      related_user_id: user.id,
      related_job_id: inv.job_id,
    });

    await admin.from("notifications").insert({
      user_id: user.id,
      type: "coworker_invite_welcome",
      title: `You're connected with ${inviterName}`,
      message:
        "You joined through their invite. Add a job at the same workplace to unlock your coworker match and grow both your trust scores.",
      related_user_id: inv.sender_id,
      related_job_id: inv.job_id,
    });

    const refreshMatchesForUser = async (uid: string) => {
      const { data: jobs } = await admin.from("jobs").select("id").eq("user_id", uid).eq("is_private", false);
      for (const j of (jobs ?? []) as { id: string }[]) {
        const { error: rpcErr } = await admin.rpc("detect_coworker_matches", { p_job_id: j.id });
        if (rpcErr) console.warn("detect_coworker_matches", j.id, rpcErr.message);
      }
    };

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
      inviterName,
      inviteeName,
    });
  } catch (e) {
    console.error("invite claim", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
