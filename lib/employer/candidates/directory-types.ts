export type LinkStatus =
  | "pending"
  | "auto_linked"
  | "manual_linked"
  | "ambiguous"
  | "unlinked"
  | "external_deleted";

export type DirectorySource = "connect" | "workvouch" | "linked";

export type DirectorySourceFilter = "all" | "connect" | "workvouch" | "saved" | "linked";

export type PlatformStatus =
  | "imported_not_on_workvouch"
  | "imported_invite_sent"
  | "linked_in_progress"
  | "verified_on_workvouch"
  | "ambiguous_link"
  | "saved_from_search";

export type InvitationDisplayStatus = "none" | "pending" | "sent" | "expired" | "claimed";

export type DirectoryCandidate = {
  directoryId: string;
  source: DirectorySource;
  displayName: string;
  emailMasked?: string;
  jobTitle: string;
  applicationStatus?: string;
  locationLabel?: string;
  platformStatus: PlatformStatus;
  invitationStatus: InvitationDisplayStatus;
  linkStatus: LinkStatus | null;
  profileId?: string;
  vouchCount?: number;
  verificationBadge?: string;
  connectionId?: string;
  provider?: string;
  externalCandidateId?: string;
  externalApplicationId?: string;
  updatedAt?: string;
  canInvite: boolean;
};

export type DirectoryConnection = {
  id: string;
  provider: string;
  status: string;
};

export type DirectoryResponse = {
  candidates: DirectoryCandidate[];
  total: number;
  connections: DirectoryConnection[];
  filters: {
    source: DirectorySourceFilter;
    connectionId: string | null;
    q: string | null;
  };
  meta: {
    connectCount: number;
    workvouchCount: number;
    linkedCount: number;
  };
  monetizationTier: string;
};

export const CANDIDATE_PROJECTION_NAME = "candidate_current_state";
