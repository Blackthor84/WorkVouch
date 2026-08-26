import { admin } from "@/lib/supabase-admin";
import {
  normalizeEmployerMonetizationTier,
  type EmployerMonetizationTier,
} from "@/lib/employer/verifiedWorkersLimits";
import { vouchDisplayFromCount } from "@/lib/employer/vouchStatusDisplay";
import {
  CANDIDATE_PROJECTION_NAME,
  type DirectoryCandidate,
  type DirectoryConnection,
  type DirectoryResponse,
  type DirectorySource,
  type DirectorySourceFilter,
  type InvitationDisplayStatus,
  type LinkStatus,
  type PlatformStatus,
} from "./directory-types";
import { loadInvitationStatusByMapIds } from "./candidate-invite-service";

export type ConnectMapRowInput = {
  id: string;
  connectionId: string;
  provider: string;
  externalCandidateId: string;
  externalApplicationId?: string | null;
  externalJobId?: string | null;
  workvouchProfileId?: string | null;
  candidateEmail?: string | null;
  candidateName?: string | null;
  applicationStatus?: string | null;
  linkStatus?: string | null;
  updatedAt?: string;
};

export type ProfileEnrichment = {
  fullName: string;
  vouchCount: number;
  locationLabel?: string;
  jobTitle?: string;
};

/** Matches production-safe embed used by lib/actions/employer/saved-candidates.ts */
export const SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS = `
  id,
  full_name,
  professional_summary
`.trim();

/** Profile columns available on production for directory enrichment. */
export const DIRECTORY_PROFILE_ENRICHMENT_COLUMNS = "id, full_name";

export type SavedRowInput = {
  candidateId: string;
  profile: ProfileEnrichment;
  savedAt: string;
};

export type MergeDirectoryInput = {
  connectRows: ConnectMapRowInput[];
  projections: Map<string, Record<string, unknown>>;
  jobTitlesByExternalId: Map<string, string>;
  profileEnrichment: Map<string, ProfileEnrichment>;
  savedRows: SavedRowInput[];
  invitationStatusByMapId: Map<string, InvitationDisplayStatus>;
  filters: {
    source?: DirectorySourceFilter;
    connectionId?: string;
    q?: string;
  };
  maskEmails: boolean;
};

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}

function resolveConnectPlatformStatus(
  profileId: string | undefined,
  linkStatus: string | null | undefined,
  vouchCount: number,
  invitationStatus: InvitationDisplayStatus
): PlatformStatus {
  if (profileId) {
    return vouchCount >= 2 ? "verified_on_workvouch" : "linked_in_progress";
  }
  if (linkStatus === "ambiguous") return "ambiguous_link";
  if (invitationStatus === "sent" || invitationStatus === "pending") {
    return "imported_invite_sent";
  }
  return "imported_not_on_workvouch";
}

function resolveLinkStatus(
  row: ConnectMapRowInput
): LinkStatus | null {
  if (row.linkStatus) return row.linkStatus as LinkStatus;
  return row.workvouchProfileId ? "auto_linked" : "pending";
}

function matchesQuery(
  q: string,
  parts: Array<string | null | undefined>
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  return hay.includes(needle);
}

/** Pure merge — used by API and unit tests. */
export function mergeEmployerCandidateDirectory(
  input: MergeDirectoryInput
): DirectoryCandidate[] {
  const linkedProfileIds = new Set<string>();
  const results: DirectoryCandidate[] = [];
  const sourceFilter = input.filters.source ?? "all";

  for (const row of input.connectRows) {
    if (row.linkStatus === "external_deleted") continue;
    if (input.filters.connectionId && row.connectionId !== input.filters.connectionId) {
      continue;
    }

    const profileId = row.workvouchProfileId ?? undefined;
    const source: DirectorySource = profileId ? "linked" : "connect";
    if (profileId) linkedProfileIds.add(profileId);

    const projection = input.projections.get(row.externalCandidateId);
    const enriched = profileId ? input.profileEnrichment.get(profileId) : undefined;
    const projectionStatus =
      typeof projection?.applicationStatus === "string"
        ? projection.applicationStatus
        : undefined;

    const jobTitle =
      (row.externalJobId && input.jobTitlesByExternalId.get(row.externalJobId)) ||
      enriched?.jobTitle ||
      projectionStatus ||
      row.applicationStatus ||
      "—";

    const displayName =
      enriched?.fullName?.trim() ||
      row.candidateName?.trim() ||
      "Candidate";

    if (
      !matchesQuery(input.filters.q ?? "", [
        displayName,
        row.candidateEmail,
        row.externalCandidateId,
        row.externalApplicationId,
      ])
    ) {
      continue;
    }

    if (sourceFilter === "connect" && source !== "connect") continue;
    if (sourceFilter === "linked" && source !== "linked") continue;
    if (sourceFilter === "workvouch" || sourceFilter === "saved") continue;

    const vouchCount = enriched?.vouchCount ?? 0;
    const emailRaw = row.candidateEmail?.trim();
    const emailMasked = emailRaw
      ? input.maskEmails
        ? maskEmail(emailRaw)
        : emailRaw
      : undefined;

    const invitationStatus = input.invitationStatusByMapId.get(row.id) ?? "none";
    const platformStatus = resolveConnectPlatformStatus(
      profileId,
      row.linkStatus,
      vouchCount,
      invitationStatus
    );
    const canInvite =
      source === "connect" &&
      invitationStatus === "none" &&
      Boolean(emailRaw);

    results.push({
      directoryId: `connect:${row.id}`,
      source,
      displayName,
      emailMasked,
      jobTitle,
      applicationStatus: row.applicationStatus ?? projectionStatus,
      locationLabel: enriched?.locationLabel,
      platformStatus,
      invitationStatus,
      linkStatus: resolveLinkStatus(row),
      profileId,
      vouchCount: profileId ? vouchCount : undefined,
      verificationBadge: profileId
        ? vouchDisplayFromCount(vouchCount).badge
        : undefined,
      connectionId: row.connectionId,
      provider: row.provider,
      externalCandidateId: row.externalCandidateId,
      externalApplicationId: row.externalApplicationId ?? undefined,
      updatedAt: row.updatedAt,
      canInvite,
    });
  }

  for (const saved of input.savedRows) {
    if (linkedProfileIds.has(saved.candidateId)) continue;
    if (sourceFilter === "connect" || sourceFilter === "linked") continue;

    const displayName = saved.profile.fullName?.trim() || "Worker";
    if (!matchesQuery(input.filters.q ?? "", [displayName])) continue;

    const vouchCount = saved.profile.vouchCount;
    results.push({
      directoryId: `wv:${saved.candidateId}`,
      source: "workvouch",
      displayName,
      jobTitle: saved.profile.jobTitle ?? "—",
      locationLabel: saved.profile.locationLabel,
      platformStatus: "saved_from_search",
      invitationStatus: "none",
      linkStatus: null,
      profileId: saved.candidateId,
      vouchCount,
      verificationBadge: vouchDisplayFromCount(vouchCount).badge,
      updatedAt: saved.savedAt,
      canInvite: false,
    });
  }

  results.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return results;
}

export type FetchDirectoryContext = {
  employerAccountId: string;
  employerUserId: string;
  planTier: EmployerMonetizationTier;
  source?: DirectorySourceFilter;
  connectionId?: string;
  q?: string;
  page?: number;
  limit?: number;
};

type ConnectionRow = { id: string; provider: string; status: string };
type MapRow = {
  id: string;
  connection_id: string;
  external_candidate_id: string;
  external_application_id: string | null;
  external_job_id: string | null;
  workvouch_profile_id: string | null;
  candidate_email: string | null;
  candidate_name: string | null;
  application_status: string | null;
  link_status: string | null;
  updated_at: string;
};
type LocRow = { user_id: string; state: string | null; country: string };
type JobRow = {
  user_id: string;
  company_name: string;
  job_title: string | null;
  title: string | null;
  start_date: string;
  is_private: boolean;
};

function locationLabel(country: string, state: string | null): string {
  if (country === "US" && state) return state;
  return country || "—";
}

async function loadConnections(employerAccountId: string): Promise<ConnectionRow[]> {
  const sb = admin as any;
  const { data, error } = await sb
    .from("connect_connections")
    .select("id, provider, status")
    .eq("employer_account_id", employerAccountId);
  if (error) throw new Error(`Failed to load connections: ${error.message}`);
  return (data ?? []) as ConnectionRow[];
}

async function loadConnectMaps(
  connectionIds: string[],
  connectionIdFilter?: string
): Promise<{ rows: MapRow[]; providerByConnection: Map<string, string> }> {
  if (!connectionIds.length) {
    return { rows: [], providerByConnection: new Map() };
  }

  const sb = admin as any;
  const ids =
    connectionIdFilter && connectionIds.includes(connectionIdFilter)
      ? [connectionIdFilter]
      : connectionIdFilter
        ? []
        : connectionIds;

  if (!ids.length) {
    return { rows: [], providerByConnection: new Map() };
  }

  const { data, error } = await sb
    .from("connect_candidate_map")
    .select(
      "id, connection_id, external_candidate_id, external_application_id, external_job_id, workvouch_profile_id, candidate_email, candidate_name, application_status, link_status, updated_at"
    )
    .in("connection_id", ids)
    .or("link_status.is.null,link_status.neq.external_deleted");

  if (error) throw new Error(`Failed to load imported candidates: ${error.message}`);
  return { rows: (data ?? []) as MapRow[], providerByConnection: new Map() };
}

async function loadProjections(
  externalCandidateIds: string[]
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!externalCandidateIds.length) return map;

  const sb = admin as any;
  const chunkSize = 100;
  for (let i = 0; i < externalCandidateIds.length; i += chunkSize) {
    const chunk = externalCandidateIds.slice(i, i + chunkSize);
    const { data, error } = await sb
      .from("connect_projection_state")
      .select("aggregate_id, state")
      .eq("aggregate_type", "candidate")
      .eq("projection_name", CANDIDATE_PROJECTION_NAME)
      .in("aggregate_id", chunk);
    if (error) throw new Error(`Failed to load projections: ${error.message}`);
    for (const row of (data ?? []) as Array<{ aggregate_id: string; state: Record<string, unknown> }>) {
      map.set(String(row.aggregate_id), row.state ?? {});
    }
  }
  return map;
}

async function loadJobTitles(
  connectionIds: string[],
  externalJobIds: string[]
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  const uniqueJobIds = [...new Set(externalJobIds.filter(Boolean))];
  if (!connectionIds.length || !uniqueJobIds.length) return titles;

  const sb = admin as any;
  const { data, error } = await sb
    .from("connect_job_map")
    .select("external_job_id, job_title")
    .in("connection_id", connectionIds)
    .in("external_job_id", uniqueJobIds);
  if (error) throw new Error(`Failed to load job titles: ${error.message}`);

  for (const row of (data ?? []) as Array<{ external_job_id: string; job_title: string | null }>) {
    const title = (row.job_title ?? "").trim();
    if (title) titles.set(String(row.external_job_id), title);
  }
  return titles;
}

async function loadProfileEnrichment(
  profileIds: string[]
): Promise<Map<string, ProfileEnrichment>> {
  const enrichment = new Map<string, ProfileEnrichment>();
  if (!profileIds.length) return enrichment;

  const sb = admin as any;
  const chunkSize = 120;

  const profiles: Array<{
    id: string;
    full_name: string | null;
    vouch_count: number | null;
  }> = [];

  for (let i = 0; i < profileIds.length; i += chunkSize) {
    const chunk = profileIds.slice(i, i + chunkSize);
    const { data, error } = await sb
      .from("profiles")
      .select(DIRECTORY_PROFILE_ENRICHMENT_COLUMNS)
      .in("id", chunk);
    if (error) throw new Error(`Failed to load profiles: ${error.message}`);
    profiles.push(...((data ?? []) as typeof profiles));
  }

  const { data: locRows } = await sb
    .from("user_locations")
    .select("user_id, state, country")
    .in("user_id", profileIds)
    .eq("country", "US");

  const locByUser = new Map<string, LocRow>();
  for (const row of (locRows ?? []) as LocRow[]) {
    if (!locByUser.has(row.user_id)) locByUser.set(row.user_id, row);
  }

  const { data: jobsRaw } = await sb
    .from("jobs")
    .select("user_id, company_name, job_title, title, start_date, is_private")
    .in("user_id", profileIds)
    .eq("is_private", false)
    .order("start_date", { ascending: false });

  const latestJobByUser = new Map<string, string>();
  for (const job of (jobsRaw ?? []) as JobRow[]) {
    if (latestJobByUser.has(job.user_id)) continue;
    const title = (job.job_title || job.title || "").trim();
    if (title) latestJobByUser.set(job.user_id, title);
  }

  for (const profile of profiles) {
    const loc = locByUser.get(profile.id);
    enrichment.set(profile.id, {
      fullName: (profile.full_name || "Worker").trim(),
      vouchCount: Math.max(0, Number(profile.vouch_count ?? 0)),
      locationLabel: loc ? locationLabel(loc.country, loc.state) : undefined,
      jobTitle: latestJobByUser.get(profile.id),
    });
  }

  return enrichment;
}

async function loadSavedRows(employerUserId: string): Promise<SavedRowInput[]> {
  const sb = admin as any;
  try {
    const { data, error } = await sb
      .from("saved_candidates")
      .select(
        `
      candidate_id,
      saved_at,
      profiles:candidate_id (
        ${SAVED_CANDIDATES_DIRECTORY_PROFILE_COLUMNS}
      )
    `
      )
      .eq("employer_id", employerUserId)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("[employer/candidates/directory] saved candidates query failed:", error.message);
      return [];
    }

    type SavedDbRow = {
      candidate_id: string;
      saved_at: string;
      profiles: {
        id: string;
        full_name: string | null;
        professional_summary: string | null;
      } | null;
    };

    const rows = (data ?? []) as SavedDbRow[];
    const candidateIds = rows.map((r) => r.candidate_id).filter(Boolean);
    const enrichment = await loadProfileEnrichment(candidateIds);

    return rows
      .filter((row) => row.profiles?.id)
      .map((row) => {
        const profileId = row.candidate_id;
        const enriched = enrichment.get(profileId);
        return {
          candidateId: profileId,
          savedAt: row.saved_at,
          profile: enriched ?? {
            fullName: (row.profiles?.full_name || "Worker").trim(),
            vouchCount: 0,
          },
        };
      });
  } catch (error) {
    console.error("[employer/candidates/directory] saved candidates load failed:", error);
    return [];
  }
}

export async function fetchEmployerCandidateDirectory(
  ctx: FetchDirectoryContext
): Promise<DirectoryResponse> {
  const source: DirectorySourceFilter = ctx.source ?? "all";
  const page = Math.max(1, ctx.page ?? 1);
  const limit = Math.min(100, Math.max(1, ctx.limit ?? 50));
  const maskEmails = ctx.planTier === "free";

  const connections = await loadConnections(ctx.employerAccountId);
  const connectionIds = connections.map((c) => c.id);
  const providerByConnection = new Map(connections.map((c) => [c.id, c.provider]));

  if (ctx.connectionId && !connectionIds.includes(ctx.connectionId)) {
    return emptyDirectoryResponse(source, ctx.connectionId, ctx.q ?? null, connections, ctx.planTier);
  }

  const { rows: mapRows } = await loadConnectMaps(connectionIds, ctx.connectionId);

  const connectRows: ConnectMapRowInput[] = mapRows.map((row) => ({
    id: row.id,
    connectionId: row.connection_id,
    provider: providerByConnection.get(row.connection_id) ?? "greenhouse",
    externalCandidateId: row.external_candidate_id,
    externalApplicationId: row.external_application_id,
    externalJobId: row.external_job_id,
    workvouchProfileId: row.workvouch_profile_id,
    candidateEmail: row.candidate_email,
    candidateName: row.candidate_name,
    applicationStatus: row.application_status,
    linkStatus: row.link_status,
    updatedAt: row.updated_at,
  }));

  const externalCandidateIds = connectRows.map((r) => r.externalCandidateId);
  const externalJobIds = connectRows
    .map((r) => r.externalJobId)
    .filter((id): id is string => Boolean(id));

  const [projections, jobTitlesByExternalId, savedRows] = await Promise.all([
    loadProjections(externalCandidateIds),
    loadJobTitles(connectionIds, externalJobIds),
    loadSavedRows(ctx.employerUserId),
  ]);

  const linkedProfileIds = connectRows
    .map((r) => r.workvouchProfileId)
    .filter((id): id is string => Boolean(id));
  const savedProfileIds = savedRows.map((r) => r.candidateId);
  const allProfileIds = [...new Set([...linkedProfileIds, ...savedProfileIds])];
  const profileEnrichment = await loadProfileEnrichment(allProfileIds);
  const invitationStatusByMapId = await loadInvitationStatusByMapIds(
    connectRows.map((row) => row.id)
  );

  const merged = mergeEmployerCandidateDirectory({
    connectRows,
    projections,
    jobTitlesByExternalId,
    profileEnrichment,
    savedRows,
    invitationStatusByMapId,
    filters: {
      source,
      connectionId: ctx.connectionId,
      q: ctx.q,
    },
    maskEmails,
  });

  const total = merged.length;
  const start = (page - 1) * limit;
  const candidates = merged.slice(start, start + limit);

  return {
    candidates,
    total,
    connections: connections.map((c) => ({
      id: c.id,
      provider: c.provider,
      status: c.status,
    })),
    filters: {
      source,
      connectionId: ctx.connectionId ?? null,
      q: ctx.q?.trim() || null,
    },
    meta: {
      connectCount: merged.filter((c) => c.source === "connect").length,
      workvouchCount: merged.filter((c) => c.source === "workvouch").length,
      linkedCount: merged.filter((c) => c.source === "linked").length,
    },
    monetizationTier: ctx.planTier,
  };
}

function emptyDirectoryResponse(
  source: DirectorySourceFilter,
  connectionId: string,
  q: string | null,
  connections: ConnectionRow[],
  planTier: EmployerMonetizationTier
): DirectoryResponse {
  return {
    candidates: [],
    total: 0,
    connections: connections.map((c) => ({
      id: c.id,
      provider: c.provider,
      status: c.status,
    })),
    filters: { source, connectionId, q },
    meta: { connectCount: 0, workvouchCount: 0, linkedCount: 0 },
    monetizationTier: planTier,
  };
}

export function parseDirectoryQueryParams(url: URL): {
  source: DirectorySourceFilter;
  connectionId?: string;
  q?: string;
  page: number;
  limit: number;
} {
  const sourceRaw = (url.searchParams.get("source") || "all").toLowerCase();
  const source: DirectorySourceFilter = [
    "all",
    "connect",
    "workvouch",
    "saved",
    "linked",
  ].includes(sourceRaw)
    ? (sourceRaw as DirectorySourceFilter)
    : "all";

  const connectionId = url.searchParams.get("connectionId") || undefined;
  const q = url.searchParams.get("q") || undefined;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || "50") || 50));

  return { source, connectionId, q, page, limit };
}

export function resolveDirectoryPlanTier(
  role: string,
  planTierRaw: string | null | undefined
): EmployerMonetizationTier {
  if (role === "superadmin") return "pro";
  return normalizeEmployerMonetizationTier(planTierRaw);
}
