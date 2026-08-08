import type { AtsProviderId } from "../../types/common";
import type { SyncCursorRepository } from "../persistence/repositories/sync-cursor-repository";
import type { SyncCheckpointRepository } from "../persistence/repositories/sync-checkpoint-repository";
import { CONNECT_PLATFORM_VERSION } from "../version";
import { nowIso } from "../../utils/correlation";
import type {
  AdvanceCursorInput,
  ConnectSyncCursorRow,
  CursorComparisonResult,
  CursorValidationResult,
  SyncCheckpointInput,
  SyncImportMode,
} from "./types";
import { SyncCursorValidator } from "./sync-cursor-validator";
import { SyncCheckpoint, createCheckpointInput } from "./sync-checkpoint";

export interface InitializeCursorInput {
  connectionId: string;
  provider: AtsProviderId;
  providerVersion?: string;
}

/** Core sync cursor operations — provider agnostic. */
export class SyncCursorService {
  private readonly validator = new SyncCursorValidator();
  readonly checkpoints: SyncCheckpoint;

  constructor(
    private readonly cursors: SyncCursorRepository,
    checkpointRepo: SyncCheckpointRepository
  ) {
    this.checkpoints = new SyncCheckpoint(checkpointRepo);
  }

  async initialize(input: InitializeCursorInput): Promise<ConnectSyncCursorRow> {
    const existing = await this.cursors.getByConnectionId(input.connectionId);
    if (existing) return existing;

    return this.cursors.create({
      connectionId: input.connectionId,
      provider: input.provider,
      providerVersion: input.providerVersion ?? "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      syncCursor: {},
      providerCursor: {},
      lastSequenceNumber: 0,
      retryCount: 0,
      status: "idle",
      metadata: {},
    });
  }

  async getByConnection(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    return this.cursors.getByConnectionId(connectionId);
  }

  async getOrInitialize(input: InitializeCursorInput): Promise<ConnectSyncCursorRow> {
    return (await this.getByConnection(input.connectionId)) ?? this.initialize(input);
  }

  async update(id: string, input: Partial<ConnectSyncCursorRow>): Promise<ConnectSyncCursorRow | null> {
    return this.cursors.update(id, input);
  }

  async advance(id: string, input: AdvanceCursorInput): Promise<ConnectSyncCursorRow | null> {
    return this.cursors.advance(id, input);
  }

  async reset(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) return null;
    return this.cursors.reset(cursor.id);
  }

  async archive(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) return null;
    return this.cursors.archive(cursor.id);
  }

  async clone(sourceConnectionId: string, targetConnectionId: string): Promise<ConnectSyncCursorRow> {
    const source = await this.cursors.getByConnectionId(sourceConnectionId);
    if (!source) throw new Error(`No cursor for connection ${sourceConnectionId}`);
    return this.cursors.clone(source.id, targetConnectionId);
  }

  validate(cursor: ConnectSyncCursorRow | null): CursorValidationResult {
    return this.validator.validate(cursor);
  }

  compare(left: ConnectSyncCursorRow, right: ConnectSyncCursorRow): CursorComparisonResult {
    return this.validator.compare(left, right);
  }

  async markSyncing(connectionId: string, mode: SyncImportMode): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) return null;
    return this.cursors.update(cursor.id, {
      status: "syncing",
      syncCursor: { ...cursor.syncCursor, mode },
    });
  }

  async recordError(connectionId: string, error: string): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) return null;
    await this.cursors.incrementRetry(cursor.id);
    return this.cursors.recordError(cursor.id, error);
  }

  async scheduleNextSync(connectionId: string, delayMs: number): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) return null;
    const next = new Date(Date.now() + delayMs).toISOString();
    return this.cursors.scheduleNextSync(cursor.id, next);
  }

  async createCheckpoint(
    connectionId: string,
    input: Omit<SyncCheckpointInput, "cursorId" | "connectionId" | "provider"> & {
      provider: AtsProviderId;
      correlationId?: string;
    }
  ) {
    const cursor = await this.cursors.getByConnectionId(connectionId);
    if (!cursor) throw new Error(`No cursor for connection ${connectionId}`);

    return this.checkpoints.create(
      createCheckpointInput({
        cursorId: cursor.id,
        connectionId,
        provider: input.provider,
        sequenceNumber: input.sequenceNumber ?? cursor.lastSequenceNumber,
        eventCount: input.eventCount,
        durationMs: input.durationMs,
        importedCandidates: input.importedCandidates,
        importedJobs: input.importedJobs,
        importedApplications: input.importedApplications,
        snapshotId: input.snapshotId,
        syncType: input.syncType,
        metadata: input.metadata,
        correlationId: input.correlationId,
      })
    );
  }

  resolveIncrementalParams(cursor: ConnectSyncCursorRow): {
    updatedAfter?: string;
    startPage: number;
    isFullImport: boolean;
  } {
    const updatedAfter =
      cursor.providerCursor.updatedAfter ??
      cursor.syncCursor.updatedAfter ??
      cursor.lastSuccessfulSync;

    const isFullImport = !updatedAfter || cursor.syncCursor.mode === "full";
    const startPage = isFullImport ? 1 : (cursor.syncCursor.jobPage ?? 1);

    return { updatedAfter: isFullImport ? undefined : updatedAfter, startPage, isFullImport };
  }

  buildAdvanceInput(
    mode: SyncImportMode,
    stats: {
      jobsImported: number;
      candidatesImported: number;
      applicationsImported: number;
      eventsStored: number;
      lastSequenceNumber?: number;
      snapshotId?: string;
      providerCursor?: Record<string, unknown>;
    }
  ): AdvanceCursorInput {
    const now = nowIso();
    return {
      lastSuccessfulSync: now,
      lastJobImported: stats.jobsImported > 0 ? now : undefined,
      lastCandidateImported: stats.candidatesImported > 0 ? now : undefined,
      lastApplicationImported: stats.applicationsImported > 0 ? now : undefined,
      lastEventReceived: stats.eventsStored > 0 ? now : undefined,
      lastProjectionCompleted: now,
      lastSequenceNumber: stats.lastSequenceNumber,
      lastSnapshotId: stats.snapshotId,
      lastSnapshotAt: stats.snapshotId ? now : undefined,
      status: "idle",
      syncCursor: {
        mode,
        lastImportedAt: now,
        totalEventsStored: stats.eventsStored,
        jobPage: 1,
        candidatePage: 1,
        applicationPage: 1,
      },
      providerCursor: {
        updatedAfter: now,
        ...stats.providerCursor,
      },
    };
  }
}
