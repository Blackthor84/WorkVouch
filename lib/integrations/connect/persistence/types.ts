import type { AtsProviderId } from "../../types/common";

/** Connect aggregate types for event sourcing streams. */
export type ConnectAggregateType =
  | "candidate"
  | "job"
  | "application"
  | "connection"
  | "webhook"
  | "sync"
  | "offer";

/** Immutable event store record. */
export interface ConnectStoredEvent {
  id: string;
  correlationId: string;
  provider: AtsProviderId;
  providerVersion: string;
  connectVersion: string;
  companyId: string;
  connectionId?: string;
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  sequenceNumber: number;
  eventType: string;
  providerEventType?: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  occurredAt: string;
  recordedAt: string;
}

export interface AppendConnectEventInput {
  id?: string;
  correlationId: string;
  provider: AtsProviderId;
  providerVersion: string;
  connectVersion: string;
  companyId: string;
  connectionId?: string;
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  eventType: string;
  providerEventType?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
  idempotencyKey?: string;
}

export interface ConnectConnectionRow {
  id: string;
  employerAccountId: string;
  provider: AtsProviderId;
  providerAccountId?: string;
  providerAccountName?: string;
  status: string;
  oauthScopes: string[];
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: string;
  tokenStatus?: string;
  lastHealthCheckAt?: string;
  lastHealthStatus?: string;
  lastSyncAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectCandidateMapRow {
  id: string;
  connectionId: string;
  externalCandidateId: string;
  workvouchProfileId?: string;
  candidateEmail?: string;
  candidateName?: string;
  applicationStatus?: string;
  employerAccountId?: string;
  externalApplicationId?: string;
  externalJobId?: string;
  linkStatus?: string;
  linkMethod?: string;
  linkedAt?: string;
  linkedByUserId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectJobMapRow {
  id: string;
  connectionId: string;
  externalJobId: string;
  jobTitle?: string;
  status?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectProjectionStateRow {
  id: string;
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  projectionName: string;
  sequenceNumber: number;
  state: Record<string, unknown>;
  updatedAt: string;
}

export interface ConnectWebhookLogRow {
  id: string;
  connectionId?: string;
  provider: AtsProviderId;
  providerEventId: string;
  providerEventType: string;
  normalizedEventType?: string;
  status: string;
  payloadHash?: string;
  receivedAt: string;
  processedAt?: string;
  durationMs?: number;
  metadata: Record<string, unknown>;
}

export interface ConnectSyncLogRow {
  id: string;
  connectionId?: string;
  provider: AtsProviderId;
  syncType: string;
  externalId: string;
  direction: "inbound" | "outbound";
  status: string;
  durationMs?: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConnectProviderAccountRow {
  id: string;
  connectionId: string;
  provider: AtsProviderId;
  externalAccountId: string;
  accountName?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EventStreamFilter {
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  fromSequence?: number;
  limit?: number;
}

export interface ConnectEventSnapshotRow {
  id: string;
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  sequenceNumber: number;
  state: Record<string, unknown>;
  eventCount: number;
  snapshotType: "automatic" | "manual";
  createdAt: string;
}

export interface SnapshotConfig {
  eventsPerSnapshot: number;
}

export interface TimelineFilter {
  correlationId?: string;
  companyId?: string;
  connectionId?: string;
  aggregateType?: ConnectAggregateType;
  aggregateId?: string;
  fromOccurredAt?: string;
  toOccurredAt?: string;
  limit?: number;
}
