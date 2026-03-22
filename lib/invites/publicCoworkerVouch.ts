/**
 * Public coworker vouch flow (no account): token in URL → confirm / decline.
 * All DB access uses admin client (API / server components only).
 */

import { admin } from "@/lib/supabase-admin";

const TOKEN_MAX_LEN = 256;

export type PublicInviteState = "pending" | "accepted" | "declined";

export type PublicInvitePreview =
  | {
      ok: true;
      inviterName: string;
      companyName: string;
      status: PublicInviteState;
    }
  | { ok: false; error: "not_found" | "invalid_token" };

export function sanitizeInviteToken(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t || t.length > TOKEN_MAX_LEN) return null;
  return t;
}

function prettyFromNormalized(normalized: string | null | undefined): string {
  const n = (normalized ?? "").trim();
  if (!n) return "their workplace";
  return n
    .split(/\s+/)
    .map((w) => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

type InviteRow = {
  id: string;
  status: string;
  sender_id: string;
  company_normalized: string | null;
  job_id: string | null;
};

/**
 * First time the recipient loads the link: set `invite_opened_at` (invite funnel “opened”).
 * Unlike a fictional `status: "opened"`, pending stays `pending` until yes/no.
 * @returns true if this call was the first open (row updated).
 */
export async function touchCoworkerInviteOpened(token: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("coworker_invites")
    .update({ invite_opened_at: now })
    .eq("invite_token", token)
    .eq("status", "pending")
    .is("invite_opened_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

export async function loadPublicCoworkerInvitePreview(token: string): Promise<PublicInvitePreview> {
  const { data: inv, error } = await admin
    .from("coworker_invites")
    .select("id, status, sender_id, company_normalized, job_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (error || !inv) {
    return { ok: false, error: "not_found" };
  }

  const row = inv as InviteRow;
  const status = row.status as PublicInviteState;
  if (status !== "pending" && status !== "accepted" && status !== "declined") {
    return { ok: false, error: "not_found" };
  }

  const [{ data: profile }, { data: job }] = await Promise.all([
    admin.from("profiles").select("full_name").eq("id", row.sender_id).maybeSingle(),
    row.job_id
      ? admin.from("jobs").select("company_name").eq("id", row.job_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: { company_name?: string } | null }),
  ]);

  const inviterName = (
    (profile as { full_name?: string } | null)?.full_name ?? "Someone"
  ).trim() || "Someone";

  const companyFromJob = (job as { company_name?: string } | null)?.company_name?.trim();
  const companyName = companyFromJob && companyFromJob.length > 0
    ? companyFromJob
    : prettyFromNormalized(row.company_normalized);

  return {
    ok: true,
    inviterName,
    companyName,
    status,
  };
}

export type RespondResult =
  | { ok: true; status: "accepted" | "declined" | "already_accepted" | "already_declined" }
  | { ok: false; error: "not_found" | "invalid" | "already_resolved" };

export async function respondToPublicCoworkerInvite(
  token: string,
  decision: "yes" | "no"
): Promise<RespondResult> {
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("coworker_invites")
    .select("id, status, sender_id, job_id")
    .eq("invite_token", token)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  const ex = existing as { id: string; status: string; sender_id: string; job_id: string | null };

  if (decision === "no") {
    if (ex.status === "declined") {
      return { ok: true, status: "already_declined" };
    }
    if (ex.status === "accepted") {
      return { ok: false, error: "already_resolved" };
    }
    if (ex.status !== "pending") {
      return { ok: false, error: "invalid" };
    }

    const { data: updated, error: updErr } = await admin
      .from("coworker_invites")
      .update({ status: "declined", declined_at: now })
      .eq("id", ex.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updErr || !updated) {
      return { ok: false, error: "invalid" };
    }
    return { ok: true, status: "declined" };
  }

  // yes
  if (ex.status === "accepted") {
    return { ok: true, status: "already_accepted" };
  }
  if (ex.status === "declined") {
    return { ok: false, error: "already_resolved" };
  }
  if (ex.status !== "pending") {
    return { ok: false, error: "invalid" };
  }

  const { data: updated, error: updErr } = await admin
    .from("coworker_invites")
    .update({
      status: "accepted",
      accepted_at: now,
      accepted_user_id: null,
    })
    .eq("id", ex.id)
    .eq("status", "pending")
    .select("id, sender_id, job_id")
    .maybeSingle();

  if (updErr || !updated) {
    const { data: again } = await admin.from("coworker_invites").select("status").eq("id", ex.id).maybeSingle();
    if ((again as { status?: string } | null)?.status === "accepted") {
      return { ok: true, status: "already_accepted" };
    }
    return { ok: false, error: "invalid" };
  }

  const u = updated as { id: string; sender_id: string; job_id: string | null };

  try {
    await admin.rpc("refresh_user_vouch_stats", { p_user_id: u.sender_id });
  } catch {
    /* migration may not be applied */
  }

  await admin.from("notifications").insert({
    user_id: u.sender_id,
    type: "vouch_received",
    title: "Someone vouched for you",
    message: "A coworker confirmed your invite — you got a new vouch 🔥",
    related_user_id: null,
    related_job_id: u.job_id,
  });

  return { ok: true, status: "accepted" };
}
