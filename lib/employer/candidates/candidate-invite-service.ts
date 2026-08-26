import { randomUUID } from "crypto";
import { admin } from "@/lib/supabase-admin";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { WORKFLOW_EVENT_TYPES } from "@/lib/integrations/connect/orchestration/workflow-event-types";
import { CONNECT_PLATFORM_VERSION } from "@/lib/integrations/connect/version";
import {
  buildConnectInviteClaimUrl,
  connectInviteExpiresAt,
  generateConnectInviteToken,
  hashConnectInviteToken,
  isConnectInviteExpired,
  resolveAppOrigin,
} from "@/lib/integrations/connect/invitations/invite-token";
import {
  dispatchConnectCandidateInviteEmail,
  firstNameFromFullName,
} from "@/lib/integrations/connect/invitations/dispatch-candidate-invite";
import type { InvitationDisplayStatus, PlatformStatus } from "./directory-types";

export type CandidateMapAuthRow = {
  id: string;
  connection_id: string;
  external_candidate_id: string;
  external_application_id: string | null;
  external_job_id: string | null;
  workvouch_profile_id: string | null;
  candidate_email: string | null;
  candidate_name: string | null;
  application_status: string | null;
  metadata: Record<string, unknown> | null;
};

export type SendInviteSuccess = {
  ok: true;
  invitationId: string;
  invitationStatus: InvitationDisplayStatus;
  platformStatus: PlatformStatus;
  alreadySent: boolean;
  directoryId: string;
};

export type SendInviteFailure = {
  ok: false;
  status: number;
  error: string;
};

export type SendInviteResult = SendInviteSuccess | SendInviteFailure;

export type ClaimInviteResult =
  | { ok: true; profileId: string; connectCandidateMapId: string; alreadyClaimed?: boolean }
  | { ok: false; error: string; code?: "not_found" | "expired" | "already_claimed" | "invalid" };

const ACTIVE_INVITE_STATUSES = ["pending", "sent"] as const;

export function parseConnectDirectoryCandidateId(directoryCandidateId: string): string | null {
  const prefix = "connect:";
  if (!directoryCandidateId.startsWith(prefix)) return null;
  const mapId = directoryCandidateId.slice(prefix.length).trim();
  return mapId || null;
}

export function directoryIdForConnectMap(mapId: string): string {
  return `connect:${mapId}`;
}

export function resolvePlatformStatusAfterInvite(
  linked: boolean,
  invitationStatus: InvitationDisplayStatus
): PlatformStatus {
  if (linked) return "linked_in_progress";
  if (invitationStatus === "sent" || invitationStatus === "pending") {
    return "imported_invite_sent";
  }
  return "imported_not_on_workvouch";
}

export async function loadInvitationStatusByMapIds(
  mapIds: string[]
): Promise<Map<string, InvitationDisplayStatus>> {
  const result = new Map<string, InvitationDisplayStatus>();
  if (!mapIds.length) return result;

  const sb = admin as any;
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("connect_candidate_invites")
    .select("connect_candidate_map_id, status, expires_at")
    .in("connect_candidate_map_id", mapIds)
    .in("status", [...ACTIVE_INVITE_STATUSES])
    .gt("expires_at", now);

  if (error) {
    console.error("[candidate-invite] load invitation status failed:", error.message);
    return result;
  }

  for (const row of (data ?? []) as Array<{
    connect_candidate_map_id: string;
    status: string;
    expires_at: string;
  }>) {
    const mapId = String(row.connect_candidate_map_id);
    result.set(mapId, row.status === "pending" ? "pending" : "sent");
  }

  return result;
}

async function loadAuthorizedCandidateMap(
  mapId: string,
  employerAccountId: string
): Promise<{ mapRow: CandidateMapAuthRow; provider: string } | null> {
  const sb = admin as any;
  const { data: mapRow, error: mapError } = await sb
    .from("connect_candidate_map")
    .select(
      "id, connection_id, external_candidate_id, external_application_id, external_job_id, workvouch_profile_id, candidate_email, candidate_name, application_status, metadata"
    )
    .eq("id", mapId)
    .maybeSingle();

  if (mapError || !mapRow) return null;

  const { data: connection, error: connError } = await sb
    .from("connect_connections")
    .select("id, employer_account_id, provider")
    .eq("id", mapRow.connection_id)
    .maybeSingle();

  if (connError || !connection) return null;
  if (String(connection.employer_account_id) !== String(employerAccountId)) {
    return null;
  }

  return {
    mapRow: mapRow as CandidateMapAuthRow,
    provider: String(connection.provider ?? "greenhouse"),
  };
}

async function findActiveInvite(
  connectionId: string,
  externalCandidateId: string
): Promise<Record<string, unknown> | null> {
  const sb = admin as any;
  const now = new Date().toISOString();
  const { data } = await sb
    .from("connect_candidate_invites")
    .select("*")
    .eq("connection_id", connectionId)
    .eq("external_candidate_id", externalCandidateId)
    .in("status", [...ACTIVE_INVITE_STATUSES])
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Record<string, unknown> | null) ?? null;
}

async function appendInvitationSentEvent(input: {
  employerAccountId: string;
  connectionId: string;
  externalCandidateId: string;
  provider: string;
  correlationId: string;
  invitationId: string;
  invitedByUserId: string;
}): Promise<void> {
  const runtime = getConnectApiRuntime();
  await runtime.eventStore.appendEvent({
    correlationId: input.correlationId,
    provider: input.provider as "greenhouse",
    providerVersion: "1.0.0",
    connectVersion: CONNECT_PLATFORM_VERSION,
    companyId: input.employerAccountId,
    connectionId: input.connectionId,
    aggregateType: "candidate",
    aggregateId: input.externalCandidateId,
    eventType: WORKFLOW_EVENT_TYPES.InvitationSent,
    providerEventType: "employer_manual_invite",
    payload: {
      invitationId: input.invitationId,
      invitedByUserId: input.invitedByUserId,
      source: "employer_directory",
    },
    idempotencyKey: `employer-invite:${input.connectionId}:${input.externalCandidateId}:${input.invitationId}`,
  });
}

export async function sendEmployerCandidateInvite(input: {
  employerAccountId: string;
  employerUserId: string;
  companyName: string;
  directoryCandidateId: string;
}): Promise<SendInviteResult> {
  const mapId = parseConnectDirectoryCandidateId(input.directoryCandidateId);
  if (!mapId) {
    return { ok: false, status: 400, error: "Invalid candidate id" };
  }

  const authorized = await loadAuthorizedCandidateMap(mapId, input.employerAccountId);
  if (!authorized) {
    return { ok: false, status: 404, error: "Candidate not found" };
  }

  const { mapRow, provider } = authorized;

  if (mapRow.workvouch_profile_id) {
    return { ok: false, status: 409, error: "Candidate is already linked to WorkVouch" };
  }

  const email = (mapRow.candidate_email ?? "").trim();
  if (!email) {
    return { ok: false, status: 422, error: "Candidate email is required to send an invitation" };
  }

  const existing = await findActiveInvite(mapRow.connection_id, mapRow.external_candidate_id);
  if (existing) {
    return {
      ok: true,
      invitationId: String(existing.id),
      invitationStatus: existing.status === "pending" ? "pending" : "sent",
      platformStatus: "imported_invite_sent",
      alreadySent: true,
      directoryId: directoryIdForConnectMap(mapId),
    };
  }

  const correlationId = randomUUID();
  const runtime = getConnectApiRuntime();
  const expiresAt = connectInviteExpiresAt();
  const rawToken = generateConnectInviteToken();
  const tokenHash = hashConnectInviteToken(rawToken);
  const claimUrl = buildConnectInviteClaimUrl(resolveAppOrigin(), rawToken);

  const queueItem = await runtime.invitationQueue.enqueue({
    connectionId: mapRow.connection_id,
    employerAccountId: input.employerAccountId,
    externalCandidateId: mapRow.external_candidate_id,
    candidateEmail: email,
    candidateName: mapRow.candidate_name ?? undefined,
    jobExternalId: mapRow.external_job_id ?? undefined,
    status: "pending",
    correlationId,
    metadata: { source: "employer_directory", invitedByUserId: input.employerUserId },
  });

  const sb = admin as any;
  const { data: inviteRow, error: inviteError } = await sb
    .from("connect_candidate_invites")
    .insert({
      invitation_queue_id: queueItem.id,
      connection_id: mapRow.connection_id,
      employer_account_id: input.employerAccountId,
      connect_candidate_map_id: mapRow.id,
      external_candidate_id: mapRow.external_candidate_id,
      external_application_id: mapRow.external_application_id,
      external_job_id: mapRow.external_job_id,
      candidate_email: email,
      token_hash: tokenHash,
      status: "pending",
      expires_at: expiresAt,
      invited_by_user_id: input.employerUserId,
      metadata: {
        provider,
        application_status: mapRow.application_status,
        correlation_id: correlationId,
      },
    })
    .select("id")
    .single();

  if (inviteError) {
    await runtime.invitationQueue.cancel(queueItem.id).catch(() => null);
    if (inviteError.message.includes("idx_connect_candidate_invites_active")) {
      const active = await findActiveInvite(mapRow.connection_id, mapRow.external_candidate_id);
      if (active) {
        return {
          ok: true,
          invitationId: String(active.id),
          invitationStatus: "sent",
          platformStatus: "imported_invite_sent",
          alreadySent: true,
          directoryId: directoryIdForConnectMap(mapId),
        };
      }
    }
    return { ok: false, status: 500, error: "Failed to create invitation" };
  }

  const emailResult = await dispatchConnectCandidateInviteEmail({
    to: email,
    candidateFirstName: firstNameFromFullName(mapRow.candidate_name ?? "there"),
    employerCompanyName: input.companyName || "An employer",
    claimUrl,
    expiresAt,
  });

  if (!emailResult.success) {
    await runtime.invitationQueue.markFailed(queueItem.id, emailResult.error ?? "email_failed");
    await sb
      .from("connect_candidate_invites")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", inviteRow.id);
    return { ok: false, status: 502, error: "Failed to send invitation email" };
  }

  const sentAt = new Date().toISOString();
  await runtime.invitationQueue.markSent(queueItem.id);
  await sb
    .from("connect_candidate_invites")
    .update({ status: "sent", sent_at: sentAt, updated_at: sentAt })
    .eq("id", inviteRow.id);

  await runtime.lifecycleState.upsert({
    connectionId: mapRow.connection_id,
    employerAccountId: input.employerAccountId,
    externalCandidateId: mapRow.external_candidate_id,
    state: "invited",
    previousState: "imported",
    lastEventType: WORKFLOW_EVENT_TYPES.InvitationSent,
    metadata: { invitationId: inviteRow.id, source: "employer_directory" },
  });

  const existingMetadata = (mapRow.metadata ?? {}) as Record<string, unknown>;
  await sb
    .from("connect_candidate_map")
    .update({
      metadata: {
        ...existingMetadata,
        invited_at: sentAt,
        invitation_id: inviteRow.id,
        invitation_correlation_id: correlationId,
      },
      updated_at: sentAt,
    })
    .eq("id", mapRow.id);

  await appendInvitationSentEvent({
    employerAccountId: input.employerAccountId,
    connectionId: mapRow.connection_id,
    externalCandidateId: mapRow.external_candidate_id,
    provider,
    correlationId,
    invitationId: String(inviteRow.id),
    invitedByUserId: input.employerUserId,
  });

  return {
    ok: true,
    invitationId: String(inviteRow.id),
    invitationStatus: "sent",
    platformStatus: "imported_invite_sent",
    alreadySent: false,
    directoryId: directoryIdForConnectMap(mapId),
  };
}

/** Claim flow for candidate invitation pages — idempotent for the same profile. */
export async function claimConnectCandidateInvite(
  token: string,
  profileId: string
): Promise<ClaimInviteResult> {
  const tokenHash = hashConnectInviteToken(token);
  const sb = admin as any;

  const { data: invite, error } = await sb
    .from("connect_candidate_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !invite) {
    return { ok: false, error: "Invitation not found", code: "not_found" };
  }

  const mapId = String(invite.connect_candidate_map_id);
  const { data: mapRow } = await sb
    .from("connect_candidate_map")
    .select("workvouch_profile_id")
    .eq("id", mapId)
    .maybeSingle();

  const linkedProfileId = (mapRow as { workvouch_profile_id?: string | null } | null)
    ?.workvouch_profile_id;

  if (linkedProfileId) {
    if (String(linkedProfileId) === String(profileId)) {
      return {
        ok: true,
        profileId,
        connectCandidateMapId: mapId,
        alreadyClaimed: true,
      };
    }
    return {
      ok: false,
      error: "Invitation already claimed",
      code: "already_claimed",
    };
  }

  if (invite.status === "claimed") {
    if (String(invite.claimed_profile_id ?? "") === String(profileId)) {
      return {
        ok: true,
        profileId,
        connectCandidateMapId: mapId,
        alreadyClaimed: true,
      };
    }
    return {
      ok: false,
      error: "Invitation already claimed",
      code: "already_claimed",
    };
  }

  if (invite.status === "cancelled" || invite.status === "expired") {
    return { ok: false, error: "Invitation is no longer valid", code: "invalid" };
  }

  if (isConnectInviteExpired(String(invite.expires_at))) {
    await sb
      .from("connect_candidate_invites")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invite.id);
    return { ok: false, error: "Invitation has expired", code: "expired" };
  }

  const claimedAt = new Date().toISOString();
  await sb
    .from("connect_candidate_invites")
    .update({
      status: "claimed",
      claimed_at: claimedAt,
      claimed_profile_id: profileId,
      updated_at: claimedAt,
    })
    .eq("id", invite.id);

  await sb
    .from("connect_candidate_map")
    .update({
      workvouch_profile_id: profileId,
      link_status: "manual_linked",
      link_method: "invite_claim",
      linked_at: claimedAt,
      updated_at: claimedAt,
    })
    .eq("id", invite.connect_candidate_map_id);

  const runtime = getConnectApiRuntime();
  await runtime.lifecycleState.upsert({
    connectionId: String(invite.connection_id),
    employerAccountId: String(invite.employer_account_id),
    externalCandidateId: String(invite.external_candidate_id),
    state: "account_created",
    previousState: "invited",
    lastEventType: WORKFLOW_EVENT_TYPES.InvitationAccepted,
    metadata: { profileId, invitationId: invite.id },
  });

  await runtime.eventStore.appendEvent({
    correlationId: String((invite.metadata as Record<string, unknown>)?.correlation_id ?? randomUUID()),
    provider: "greenhouse",
    providerVersion: "1.0.0",
    connectVersion: CONNECT_PLATFORM_VERSION,
    companyId: String(invite.employer_account_id),
    connectionId: String(invite.connection_id),
    aggregateType: "candidate",
    aggregateId: String(invite.external_candidate_id),
    eventType: WORKFLOW_EVENT_TYPES.InvitationAccepted,
    providerEventType: "invite_claim",
    payload: {
      invitationId: invite.id,
      profileId,
      externalApplicationId: invite.external_application_id,
      externalJobId: invite.external_job_id,
    },
    idempotencyKey: `employer-invite-claim:${invite.id}:${profileId}`,
  });

  return {
    ok: true,
    profileId,
    connectCandidateMapId: String(invite.connect_candidate_map_id),
  };
}
