/**
 * Public coworker vouch flow (no account): token in URL → confirm / decline.
 * All DB access uses admin client (API / server components only).
 */

import {
  findInviteByToken,
  markInviteAccepted,
  markInviteDeclined,
  markInviteOpened,
  resolveCompanyNameForInvite,
  type CoworkerVouchInvite,
} from "@/lib/invites/coworkerVouchInviteStore";
import { refreshCoworkerVouchStats } from "@/lib/invites/refreshCoworkerVouchStats";
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

function normalizePublicStatus(status: string | null | undefined): PublicInviteState | null {
  const s = (status ?? "").toLowerCase();
  if (s === "pending" || s === "opened") return "pending";
  if (s === "accepted") return "accepted";
  if (s === "declined") return "declined";
  return null;
}

/**
 * First time the recipient loads the link — pending → opened (production status).
 */
export async function touchCoworkerInviteOpened(token: string): Promise<boolean> {
  const { invite, error } = await findInviteByToken(token);
  if (error || !invite) return false;
  if ((invite.status ?? "").toLowerCase() !== "pending") return false;
  return markInviteOpened(invite.id);
}

export async function loadPublicCoworkerInvitePreview(token: string): Promise<PublicInvitePreview> {
  const { invite, error } = await findInviteByToken(token);

  if (error || !invite) {
    return { ok: false, error: "not_found" };
  }

  const status = normalizePublicStatus(invite.status);
  if (!status) {
    return { ok: false, error: "not_found" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", invite.sender_id)
    .maybeSingle();

  const inviterName =
    ((profile as { full_name?: string } | null)?.full_name ?? "Someone").trim() || "Someone";
  const companyName = await resolveCompanyNameForInvite(invite);

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

function isRespondableStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "pending" || s === "opened";
}

export async function respondToPublicCoworkerInvite(
  token: string,
  decision: "yes" | "no"
): Promise<RespondResult> {
  const { invite: existing, error: fetchErr } = await findInviteByToken(token);

  if (fetchErr || !existing) {
    return { ok: false, error: "not_found" };
  }

  const ex = existing as CoworkerVouchInvite;
  const statusLower = (ex.status ?? "").toLowerCase();

  if (decision === "no") {
    if (statusLower === "declined") {
      return { ok: true, status: "already_declined" };
    }
    if (statusLower === "accepted") {
      return { ok: false, error: "already_resolved" };
    }
    if (!isRespondableStatus(ex.status)) {
      return { ok: false, error: "invalid" };
    }

    const updErr = await markInviteDeclined(ex.id);
    if (updErr) {
      return { ok: false, error: "invalid" };
    }
    return { ok: true, status: "declined" };
  }

  if (statusLower === "accepted") {
    return { ok: true, status: "already_accepted" };
  }
  if (statusLower === "declined") {
    return { ok: false, error: "already_resolved" };
  }
  if (!isRespondableStatus(ex.status)) {
    return { ok: false, error: "invalid" };
  }

  const updErr = await markInviteAccepted(ex.id);
  if (updErr) {
    const { invite: again } = await findInviteByToken(token);
    if ((again?.status ?? "").toLowerCase() === "accepted") {
      return { ok: true, status: "already_accepted" };
    }
    return { ok: false, error: "invalid" };
  }

  await refreshCoworkerVouchStats(ex.sender_id).catch((e) => {
    console.warn("[respondToPublicCoworkerInvite] refreshCoworkerVouchStats", e);
  });

  await admin.from("notifications").insert({
    user_id: ex.sender_id,
    type: "vouch_received",
    title: "Someone vouched for you",
    message: "A coworker confirmed your invite — you got a new vouch 🔥",
    related_user_id: null,
    related_job_id: ex.job_id,
  });

  return { ok: true, status: "accepted" };
}
