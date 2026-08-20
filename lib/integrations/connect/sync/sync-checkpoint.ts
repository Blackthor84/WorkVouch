import { randomUUID } from "crypto";
import { nowIso } from "../../utils/correlation";
import type { SyncCheckpointRepository } from "../persistence/repositories/sync-checkpoint-repository";
import type { ConnectSyncCheckpointRow, SyncCheckpointInput, SyncPerformanceMetrics } from "./types";

/** Creates and queries immutable sync checkpoints. */
export class SyncCheckpoint {
  constructor(private readonly repository: SyncCheckpointRepository) {}

  async create(input: SyncCheckpointInput): Promise<ConnectSyncCheckpointRow> {
    return this.repository.create(input);
  }

  async getLatest(cursorId: string): Promise<ConnectSyncCheckpointRow | null> {
    return this.repository.getLatest(cursorId);
  }

  async listHistory(cursorId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    return this.repository.listByCursor(cursorId, limit);
  }

  async listByConnection(connectionId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    return this.repository.listByConnection(connectionId, limit);
  }

  computePerformanceMetrics(checkpoints: ConnectSyncCheckpointRow[]): SyncPerformanceMetrics {
    if (checkpoints.length === 0) {
      return {
        averageSyncDurationMs: 0,
        averageCursorAdvanceMs: 0,
        recordsPerMinute: 0,
        checkpointFrequency: 0,
        resumeSpeedMs: 0,
        cursorAccuracy: 100,
        sampleSize: 0,
      };
    }

    const durations = checkpoints.map((c) => c.durationMs);
    const totalRecords = checkpoints.reduce(
      (sum, c) => sum + c.importedCandidates + c.importedJobs + c.importedApplications,
      0
    );
    const totalDurationMs = durations.reduce((a, b) => a + b, 0);
    const avgDuration = totalDurationMs / checkpoints.length;

    let advanceSum = 0;
    for (let i = 1; i < checkpoints.length; i += 1) {
      advanceSum +=
        new Date(checkpoints[i].checkpointAt).getTime() -
        new Date(checkpoints[i - 1].checkpointAt).getTime();
    }
    const avgAdvance = checkpoints.length > 1 ? advanceSum / (checkpoints.length - 1) : avgDuration;

    const recordsPerMinute = totalDurationMs > 0 ? (totalRecords / totalDurationMs) * 60_000 : 0;
    const resumeCheckpoints = checkpoints.filter((c) => c.syncType === "resume" || c.syncType === "recovery");
    const resumeSpeed =
      resumeCheckpoints.length > 0
        ? resumeCheckpoints.reduce((s, c) => s + c.durationMs, 0) / resumeCheckpoints.length
        : avgDuration;

    return {
      averageSyncDurationMs: Math.round(avgDuration),
      averageCursorAdvanceMs: Math.round(avgAdvance),
      recordsPerMinute: Math.round(recordsPerMinute * 100) / 100,
      checkpointFrequency: checkpoints.length,
      resumeSpeedMs: Math.round(resumeSpeed),
      cursorAccuracy: 100,
      sampleSize: checkpoints.length,
    };
  }

  buildReplayReference(checkpoint: ConnectSyncCheckpointRow): string {
    return checkpoint.replayReference ?? `checkpoint:${checkpoint.id}:${checkpoint.checkpointAt}`;
  }
}

export function createCheckpointInput(
  base: Omit<SyncCheckpointInput, "replayReference"> & { correlationId?: string }
): SyncCheckpointInput {
  return {
    ...base,
    replayReference: base.correlationId
      ? `replay:${base.correlationId}:${nowIso()}`
      : `checkpoint:${randomUUID()}`,
  };
}
