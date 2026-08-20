import type { AtsProviderId } from "../../types/common";

export type SyncCursorStatus = "idle" | "syncing" | "paused" | "error" | "archived";

export type SyncImportMode = "full" | "incremental" | "resume" | "recovery" | "dry_run";

/** Provider-agnostic sync cursor position for a connection. */
export interface ConnectSyncCursor {
  /** Connect cursor payload — pages, timestamps, sequences. */
  syncCursor: SyncCursorPayload;
  /** Provider-native cursor when available (e.g. Greenhouse updated_after). */
  providerCursor: ProviderCursorPayload;
}

export interface SyncCursorPayload {
  mode?: SyncImportMode;
  jobPage?: number;
  candidatePage?: number;
  applicationPage?: number;
  updatedAfter?: string;
  lastImportedAt?: string;
  totalEventsStored?: number;
  [key: string]: unknown;
}

export interface ProviderCursorPayload {
  updatedAfter?: string;
  nativeCursor?: string;
  [key: string]: unknown;
}

export interface ConnectSyncCursorRow {
  id: string;
  connectionId: string;
  provider: AtsProviderId;
  providerVersion: string;
  connectVersion: string;
  lastSuccessfulSync?: string;
  lastCandidateImported?: string;
  lastJobImported?: string;
  lastApplicationImported?: string;
  lastEventReceived?: string;
  lastWebhookProcessed?: string;
  lastProjectionCompleted?: string;
  nextScheduledSync?: string;
  syncCursor: SyncCursorPayload;
  providerCursor: ProviderCursorPayload;
  lastSequenceNumber: number;
  lastSnapshotId?: string;
  lastSnapshotAt?: string;
  lastError?: string;
  lastErrorAt?: string;
  retryCount: number;
  status: SyncCursorStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectSyncCheckpointRow {
  id: string;
  cursorId: string;
  connectionId: string;
  provider: AtsProviderId;
  checkpointAt: string;
  sequenceNumber?: number;
  eventCount: number;
  durationMs: number;
  importedCandidates: number;
  importedJobs: number;
  importedApplications: number;
  snapshotId?: string;
  replayReference?: string;
  syncType: SyncImportMode;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SyncCheckpointInput {
  cursorId: string;
  connectionId: string;
  provider: AtsProviderId;
  sequenceNumber?: number;
  eventCount: number;
  durationMs: number;
  importedCandidates: number;
  importedJobs: number;
  importedApplications: number;
  snapshotId?: string;
  replayReference?: string;
  syncType: SyncImportMode;
  metadata?: Record<string, unknown>;
}

export interface AdvanceCursorInput {
  lastSuccessfulSync?: string;
  lastCandidateImported?: string;
  lastJobImported?: string;
  lastApplicationImported?: string;
  lastEventReceived?: string;
  lastWebhookProcessed?: string;
  lastProjectionCompleted?: string;
  syncCursor?: Partial<SyncCursorPayload>;
  providerCursor?: Partial<ProviderCursorPayload>;
  lastSequenceNumber?: number;
  lastSnapshotId?: string;
  lastSnapshotAt?: string;
  status?: SyncCursorStatus;
  metadata?: Record<string, unknown>;
}

export interface CursorValidationResult {
  valid: boolean;
  status: "healthy" | "behind" | "missing" | "corrupted" | "expired";
  errors: string[];
  warnings: string[];
  estimatedSyncLagMs?: number;
  estimatedObjectsRemaining?: number;
}

export interface CursorComparisonResult {
  equal: boolean;
  differences: string[];
  left: ConnectSyncCursorRow;
  right: ConnectSyncCursorRow;
}

export interface SyncPerformanceMetrics {
  averageSyncDurationMs: number;
  averageCursorAdvanceMs: number;
  recordsPerMinute: number;
  checkpointFrequency: number;
  resumeSpeedMs: number;
  cursorAccuracy: number;
  sampleSize: number;
}
