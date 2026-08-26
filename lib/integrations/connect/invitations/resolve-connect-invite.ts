import { admin } from "@/lib/supabase-admin";
import {
  hashConnectInviteToken,
  isConnectInviteExpired,
} from "./invite-token";

const TOKEN_MAX_LEN = 128;

export type ConnectInvitePreviewState =
  | "eligible"
  | "expired"
  | "invalid"
  | "cancelled"
  | "claimed"
  | "already_connected";

export type ConnectInvitePreview =
  | {
      ok: false;
      state: "invalid" | "expired" | "cancelled";
    }
  | {
      ok: true;
      state: "eligible";
      candidateName: string | null;
      employerCompanyName: string;
      maskedEmail: string;
      expiresAt: string;
    }
  | {
      ok: true;
      state: "claimed" | "already_connected";
      candidateName: string | null;
      employerCompanyName: string;
      claimedByCurrentUser: boolean;
    };

/** Opaque base64url token from invitation email — no PII embedded. */
export function sanitizeConnectInviteToken(raw: string | undefined | null): string | null {
  const token = (raw ?? "").trim();
  if (!token || token.length > TOKEN_MAX_LEN) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return null;
  return token;
}

export function maskEmailForInviteDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "your invited email";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "your invited email";
  const visible = local.length <= 1 ? local : `${local[0]}***`;
  return `${visible}@${domain}`;
}

export function inviteEmailsMatch(inviteEmail: string, userEmail: string | null | undefined): boolean {
  const invited = inviteEmail.trim().toLowerCase();
  const user = (userEmail ?? "").trim().toLowerCase();
  return invited.length > 0 && user.length > 0 && invited === user;
}

type InviteRow = {
  id: string;
  status: string;
  expires_at: string;
  candidate_email: string;
  connect_candidate_map_id: string;
  employer_account_id: string;
  claimed_profile_id: string | null;
};

async function loadEmployerCompanyName(employerAccountId: string): Promise<string> {
  const sb = admin as any;
  const { data } = await sb
    .from("employer_accounts")
    .select("company_name")
    .eq("id", employerAccountId)
    .maybeSingle();
  const name = (data as { company_name?: string | null } | null)?.company_name?.trim();
  return name || "An employer";
}

async function loadCandidateName(mapId: string): Promise<string | null> {
  const sb = admin as any;
  const { data } = await sb
    .from("connect_candidate_map")
    .select("candidate_name")
    .eq("id", mapId)
    .maybeSingle();
  const name = (data as { candidate_name?: string | null } | null)?.candidate_name?.trim();
  return name || null;
}

async function loadMapProfileId(mapId: string): Promise<string | null> {
  const sb = admin as any;
  const { data } = await sb
    .from("connect_candidate_map")
    .select("workvouch_profile_id")
    .eq("id", mapId)
    .maybeSingle();
  const profileId = (data as { workvouch_profile_id?: string | null } | null)?.workvouch_profile_id;
  return profileId ? String(profileId) : null;
}

/** Server-side invitation lookup from raw URL token — never returns token_hash or internal ids. */
export async function resolveConnectCandidateInvitePreview(
  rawToken: string,
  options?: { profileId?: string | null }
): Promise<ConnectInvitePreview> {
  const token = sanitizeConnectInviteToken(rawToken);
  if (!token) {
    return { ok: false, state: "invalid" };
  }

  const tokenHash = hashConnectInviteToken(token);
  const sb = admin as any;
  const { data, error } = await sb
    .from("connect_candidate_invites")
    .select(
      "id, status, expires_at, candidate_email, connect_candidate_map_id, employer_account_id, claimed_profile_id"
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, state: "invalid" };
  }

  const invite = data as InviteRow;
  const profileId = options?.profileId ? String(options.profileId) : null;

  if (invite.status === "cancelled") {
    return { ok: false, state: "cancelled" };
  }

  if (isConnectInviteExpired(String(invite.expires_at))) {
    if (invite.status !== "expired" && invite.status !== "claimed") {
      await sb
        .from("connect_candidate_invites")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", invite.id);
    }
    return { ok: false, state: "expired" };
  }

  const [employerCompanyName, candidateName, linkedProfileId] = await Promise.all([
    loadEmployerCompanyName(String(invite.employer_account_id)),
    loadCandidateName(String(invite.connect_candidate_map_id)),
    loadMapProfileId(String(invite.connect_candidate_map_id)),
  ]);

  const claimedByCurrentUser =
    !!profileId &&
    (String(invite.claimed_profile_id ?? "") === profileId ||
      String(linkedProfileId ?? "") === profileId);

  if (invite.status === "claimed" || linkedProfileId) {
    return {
      ok: true,
      state: linkedProfileId && !invite.claimed_profile_id ? "already_connected" : "claimed",
      candidateName,
      employerCompanyName,
      claimedByCurrentUser,
    };
  }

  if (invite.status !== "pending" && invite.status !== "sent") {
    return { ok: false, state: "invalid" };
  }

  return {
    ok: true,
    state: "eligible",
    candidateName,
    employerCompanyName,
    maskedEmail: maskEmailForInviteDisplay(String(invite.candidate_email)),
    expiresAt: String(invite.expires_at),
  };
}

/** Server-only: full invite email for authenticated claim authorization. */
export async function loadConnectInviteCandidateEmail(rawToken: string): Promise<string | null> {
  const token = sanitizeConnectInviteToken(rawToken);
  if (!token) return null;

  const sb = admin as any;
  const { data } = await sb
    .from("connect_candidate_invites")
    .select("candidate_email")
    .eq("token_hash", hashConnectInviteToken(token))
    .maybeSingle();

  const email = (data as { candidate_email?: string } | null)?.candidate_email;
  return email ? String(email).trim() : null;
}
