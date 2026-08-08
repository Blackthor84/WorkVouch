import type { AtsProviderId, IntegrationErrorDetails, IntegrationResultStatus } from "./common";

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn"
  | "unknown";

export interface CanonicalLocation {
  country: string;
  state?: string;
}

export interface CanonicalCandidate {
  externalCandidateId: string;
  externalApplicationId?: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  applicationStatus?: ApplicationStatus;
  jobExternalId?: string;
  appliedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CanonicalJob {
  externalJobId: string;
  title: string;
  status: "open" | "closed" | "draft" | "archived";
  department?: string;
  location?: CanonicalLocation;
  openedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CanonicalApplication {
  externalApplicationId: string;
  externalCandidateId: string;
  externalJobId: string;
  status: ApplicationStatus;
  appliedAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface SyncCandidateParams {
  connectionId: string;
  accessToken: string;
  externalCandidateId: string;
  workvouchProfileId?: string;
  direction: "inbound" | "outbound";
  payload?: Partial<CanonicalCandidate>;
}

export interface SyncJobParams {
  connectionId: string;
  accessToken: string;
  externalJobId: string;
  direction: "inbound" | "outbound";
  payload?: Partial<CanonicalJob>;
}

export interface SyncApplicationParams {
  connectionId: string;
  accessToken: string;
  externalApplicationId: string;
  direction: "inbound" | "outbound";
  payload?: Partial<CanonicalApplication>;
}

export interface SyncResult {
  success: boolean;
  externalId: string;
  operation: "create" | "update" | "skip";
  status: IntegrationResultStatus;
  fieldsUpdated?: string[];
  error?: IntegrationErrorDetails;
  durationMs: number;
}
