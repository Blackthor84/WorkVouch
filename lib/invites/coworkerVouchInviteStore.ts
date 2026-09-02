/**
 * Central adapter for coworker-vouch invitations backed by production public.invites.
 * Hides contact/token column mapping from the rest of the application.
 *
 * Production status constraint (CHECK): pending | opened | accepted | declined only.
 */

import { ensureLegacyUsersRowForAuthUser } from "@/lib/invites/ensureLegacyUsersRow";
import { admin } from "@/lib/supabase-admin";
import { generateInviteToken } from "@/lib/invites/inviteToken";
import {
  buildContactField,
  displayNameFromContactValue,
  parseContactField,
} from "@/lib/invites/coworkerVouchContact";
import type { PostgrestErrorLike } from "@/lib/supabase/postgrestErrors";

/** Allowed values on production public.invites.status */
export type CoworkerVouchInviteStatus = "pending" | "opened" | "accepted" | "declined";

export type CoworkerVouchInvite = {
  id: string;
  sender_id: string;
  job_id: string | null;
  contact: string;
  token: string;
  status: CoworkerVouchInviteStatus | string | null;
  created_at: string | null;
  email: string | null;
  phone: string | null;
};

const TABLE = "invites";

/** Step 4 draft rows — only `pending` may be replaced before send. */
export const UNSENT_INVITE_STATUSES = ["pending"] as const;

/** Active onboarding rows (saved + in-flight before terminal outcome). */
export const ACTIVE_ONBOARDING_STATUSES = ["pending", "opened"] as const;

/** Statuses where the invite left the initial pending state (opened link or responded). */
export const POST_PENDING_INVITE_STATUSES = ["opened", "accepted", "declined"] as const;

function mapRow(row: {
  id: string;
  sender_id: string | null;
  job_id: string | null;
  contact: string;
  token: string;
  status: string | null;
  created_at: string | null;
}): CoworkerVouchInvite {
  const { email, phone } = parseContactField(row.contact);
  return {
    id: row.id,
    sender_id: row.sender_id ?? "",
    job_id: row.job_id,
    contact: row.contact,
    token: row.token,
    status: row.status,
    created_at: row.created_at,
    email,
    phone,
  };
}

/**
 * True when the invite should not be re-dispatched (email/SMS).
 * Production has no `sent` status — recipient opened the link or responded.
 */
export function inviteWasSent(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "opened" || s === "accepted" || s === "declined";
}

export function isPendingInviteStatus(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase() === "pending";
}

/** Canonical sender id for public.invites (= auth/profile UUID after legacy users sync). */
async function resolveInviteSenderId(
  authUserId: string
): Promise<{ senderId: string; error: PostgrestErrorLike }> {
  const { userId, error } = await ensureLegacyUsersRowForAuthUser(authUserId);
  return { senderId: userId, error };
}

export async function createDraftInvite(args: {
  senderId: string;
  jobId: string | null;
  email?: string | null;
  phone?: string | null;
}): Promise<{ invite: CoworkerVouchInvite | null; error: PostgrestErrorLike }> {
  const contact = buildContactField(args.email, args.phone);
  if (!contact) {
    return { invite: null, error: { message: "Email or phone required" } };
  }

  const { senderId, error: senderError } = await resolveInviteSenderId(args.senderId);
  if (senderError) {
    return { invite: null, error: senderError };
  }

  const token = generateInviteToken(16);

  const { data, error } = await admin
    .from(TABLE)
    .insert({
      sender_id: senderId,
      job_id: args.jobId,
      contact,
      token,
      status: "pending",
    })
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .single();

  if (error) {
    return { invite: null, error };
  }

  return { invite: mapRow(data as Parameters<typeof mapRow>[0]), error: null };
}

export async function findInviteByToken(
  token: string
): Promise<{ invite: CoworkerVouchInvite | null; error: PostgrestErrorLike }> {
  const { data, error } = await admin
    .from(TABLE)
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return { invite: null, error };
  }
  if (!data) {
    return { invite: null, error: null };
  }

  return { invite: mapRow(data as Parameters<typeof mapRow>[0]), error: null };
}

export async function findInviteById(
  inviteId: string,
  senderId?: string
): Promise<{ invite: CoworkerVouchInvite | null; error: PostgrestErrorLike }> {
  let q = admin
    .from(TABLE)
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .eq("id", inviteId);

  if (senderId) {
    q = q.eq("sender_id", senderId);
  }

  const { data, error } = await q.maybeSingle();

  if (error) {
    return { invite: null, error };
  }
  if (!data) {
    return { invite: null, error: null };
  }

  return { invite: mapRow(data as Parameters<typeof mapRow>[0]), error: null };
}

export async function findInvitesForSender(
  senderId: string,
  options?: { statuses?: string[]; limit?: number }
): Promise<{ invites: CoworkerVouchInvite[]; error: PostgrestErrorLike }> {
  let q = admin
    .from(TABLE)
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .eq("sender_id", senderId)
    .order("created_at", { ascending: true });

  if (options?.statuses?.length) {
    q = q.in("status", options.statuses);
  }

  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;

  if (error) {
    return { invites: [], error };
  }

  return {
    invites: ((data ?? []) as Parameters<typeof mapRow>[0][]).map(mapRow),
    error: null,
  };
}

export async function findInviteForContact(
  senderId: string,
  contact: string
): Promise<{ invite: CoworkerVouchInvite | null; error: PostgrestErrorLike }> {
  const normalized = buildContactField(contact, null) ?? contact.trim().toLowerCase();

  const { data, error } = await admin
    .from(TABLE)
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .eq("sender_id", senderId)
    .eq("contact", normalized)
    .in("status", [...ACTIVE_ONBOARDING_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { invite: null, error };
  }
  if (!data) {
    return { invite: null, error: null };
  }

  return { invite: mapRow(data as Parameters<typeof mapRow>[0]), error: null };
}

export async function deleteUnsentInvitesForSender(senderId: string): Promise<PostgrestErrorLike> {
  const { error } = await admin
    .from(TABLE)
    .delete()
    .eq("sender_id", senderId)
    .in("status", [...UNSENT_INVITE_STATUSES]);

  return error;
}

/** First time the recipient loads the vouch link — pending → opened. */
export async function markInviteOpened(inviteId: string): Promise<boolean> {
  const { data, error } = await admin
    .from(TABLE)
    .update({ status: "opened" })
    .eq("id", inviteId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.warn("[coworkerVouchInviteStore] markInviteOpened", error.message);
    return false;
  }

  return Boolean(data);
}

export async function markInviteAccepted(inviteId: string): Promise<PostgrestErrorLike> {
  const { error } = await admin
    .from(TABLE)
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .in("status", ["pending", "opened"]);
  return error;
}

export async function markInviteDeclined(inviteId: string): Promise<PostgrestErrorLike> {
  const { error } = await admin
    .from(TABLE)
    .update({ status: "declined" })
    .eq("id", inviteId)
    .in("status", ["pending", "opened"]);
  return error;
}

export async function countAcceptedInvites(senderId: string): Promise<number> {
  const { count, error } = await admin
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("sender_id", senderId)
    .eq("status", "accepted");

  if (error) {
    console.warn("[coworkerVouchInviteStore] countAcceptedInvites", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function countInvitesForSender(
  senderId: string,
  filter?: { status?: string }
): Promise<number> {
  let q = admin.from(TABLE).select("id", { count: "exact", head: true }).eq("sender_id", senderId);

  if (filter?.status) {
    q = q.eq("status", filter.status);
  }

  const { count, error } = await q;
  if (error) {
    console.warn("[coworkerVouchInviteStore] countInvitesForSender", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function findRecentInvites(
  senderId: string,
  limit = 10
): Promise<{ invites: CoworkerVouchInvite[]; error: PostgrestErrorLike }> {
  const { data, error } = await admin
    .from(TABLE)
    .select("id, sender_id, job_id, contact, token, status, created_at")
    .eq("sender_id", senderId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { invites: [], error };
  }

  return {
    invites: ((data ?? []) as Parameters<typeof mapRow>[0][]).map(mapRow),
    error: null,
  };
}

export async function resolveCompanyNameForInvite(invite: CoworkerVouchInvite): Promise<string> {
  if (!invite.job_id) return "their workplace";

  const { data } = await admin.from("jobs").select("company_name").eq("id", invite.job_id).maybeSingle();

  const name = ((data as { company_name?: string } | null)?.company_name ?? "").trim();
  return name || "their workplace";
}

export { displayNameFromContactValue };
