import type { AtsProviderId } from "../../types/common";
import type { SyncCursorService } from "./sync-cursor-service";
import type {
  ConnectSyncCursorRow,
  CursorValidationResult,
  SyncImportMode,
  SyncPerformanceMetrics,
} from "./types";

/** High-level cursor manager — orchestrates sync state for ConnectionManager. */
export class SyncCursorManager {
  constructor(private readonly service: SyncCursorService) {}

  async getCursor(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    return this.service.getByConnection(connectionId);
  }

  async getOrCreate(connectionId: string, provider: AtsProviderId, providerVersion?: string): Promise<ConnectSyncCursorRow> {
    return this.service.getOrInitialize({ connectionId, provider, providerVersion });
  }

  async updateCursor(connectionId: string, input: Parameters<SyncCursorService["advance"]>[1]): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.service.getByConnection(connectionId);
    if (!cursor) return null;
    return this.service.advance(cursor.id, input);
  }

  async resetCursor(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    return this.service.reset(connectionId);
  }

  async validateCursor(connectionId: string): Promise<CursorValidationResult> {
    const cursor = await this.service.getByConnection(connectionId);
    return this.service.validate(cursor);
  }

  async scheduleNextSync(connectionId: string, delayMs: number): Promise<ConnectSyncCursorRow | null> {
    return this.service.scheduleNextSync(connectionId, delayMs);
  }

  async beginSync(connectionId: string, mode: SyncImportMode): Promise<ConnectSyncCursorRow | null> {
    return this.service.markSyncing(connectionId, mode);
  }

  async completeSync(
    connectionId: string,
    provider: AtsProviderId,
    mode: SyncImportMode,
    stats: Parameters<SyncCursorService["buildAdvanceInput"]>[1] & { durationMs: number; correlationId?: string }
  ): Promise<ConnectSyncCursorRow | null> {
    const cursor = await this.service.getByConnection(connectionId);
    if (!cursor) return null;

    const advanced = await this.service.advance(cursor.id, this.service.buildAdvanceInput(mode, stats));
    if (advanced) {
      await this.service.createCheckpoint(connectionId, {
        provider,
        sequenceNumber: stats.lastSequenceNumber,
        eventCount: stats.eventsStored,
        durationMs: stats.durationMs,
        importedCandidates: stats.candidatesImported,
        importedJobs: stats.jobsImported,
        importedApplications: stats.applicationsImported,
        snapshotId: stats.snapshotId,
        syncType: mode,
        correlationId: stats.correlationId,
      });
    }
    return advanced;
  }

  async recover(connectionId: string): Promise<{ cursor: ConnectSyncCursorRow; checkpoint: Awaited<ReturnType<SyncCursorService["checkpoints"]["getLatest"]>> } | null> {
    const cursor = await this.service.getByConnection(connectionId);
    if (!cursor) return null;
    const checkpoint = await this.service.checkpoints.getLatest(cursor.id);
    if (checkpoint) {
      await this.service.advance(cursor.id, {
        status: "paused",
        syncCursor: { mode: "recovery", resumeFromCheckpoint: checkpoint.id },
      });
    }
    const updated = await this.service.getByConnection(connectionId);
    return updated ? { cursor: updated, checkpoint } : null;
  }

  async recordError(connectionId: string, error: string): Promise<ConnectSyncCursorRow | null> {
    return this.service.recordError(connectionId, error);
  }

  async getPerformanceMetrics(connectionId: string): Promise<SyncPerformanceMetrics> {
    const cursor = await this.service.getByConnection(connectionId);
    if (!cursor) {
      return this.service.checkpoints.computePerformanceMetrics([]);
    }
    const history = await this.service.checkpoints.listByConnection(connectionId, 50);
    return this.service.checkpoints.computePerformanceMetrics(history);
  }

  resolveImportMode(connectionId: string, requestedMode?: SyncImportMode): Promise<SyncImportMode> {
    return this.service.getByConnection(connectionId).then((cursor) => {
      if (requestedMode) return requestedMode;
      if (!cursor) return "full";
      if (cursor.status === "error") return "recovery";
      if (cursor.status === "paused") return "resume";
      if (!cursor.lastSuccessfulSync) return "full";
      return "incremental";
    });
  }
}
