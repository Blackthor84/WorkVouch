import type {
  ConnectSyncCursorRow,
  CursorComparisonResult,
  CursorValidationResult,
} from "./types";

const DEFAULT_STALE_MS = 24 * 60 * 60 * 1000;
const BEHIND_THRESHOLD_MS = 60 * 60 * 1000;

/** Validates sync cursor integrity and freshness. */
export class SyncCursorValidator {
  constructor(private readonly staleThresholdMs = DEFAULT_STALE_MS) {}

  validate(cursor: ConnectSyncCursorRow | null): CursorValidationResult {
    if (!cursor) {
      return {
        valid: false,
        status: "missing",
        errors: ["Sync cursor not initialized for connection"],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!cursor.connectionId) errors.push("connectionId is required");
    if (!cursor.provider) errors.push("provider is required");
    if (cursor.status === "error" && cursor.lastError) {
      warnings.push(`Last error: ${cursor.lastError}`);
    }

    if (this.isCorrupted(cursor)) {
      return {
        valid: false,
        status: "corrupted",
        errors: ["Cursor payload is corrupted or invalid"],
        warnings,
      };
    }

    if (!cursor.lastSuccessfulSync) {
      if (cursor.status === "idle") {
        return {
          valid: true,
          status: "healthy",
          errors: [],
          warnings: ["Cursor initialized — awaiting first sync"],
          estimatedSyncLagMs: 0,
          estimatedObjectsRemaining: 0,
        };
      }
    }

    const lagMs = this.estimateSyncLag(cursor);
    if (this.isExpired(cursor)) {
      return {
        valid: false,
        status: "expired",
        errors: [`Cursor expired — last sync ${cursor.lastSuccessfulSync ?? "never"}`],
        warnings,
        estimatedSyncLagMs: lagMs,
      };
    }

    if (lagMs > BEHIND_THRESHOLD_MS) {
      return {
        valid: true,
        status: "behind",
        errors: [],
        warnings: [`Sync is behind by ${Math.round(lagMs / 60000)} minutes`],
        estimatedSyncLagMs: lagMs,
        estimatedObjectsRemaining: this.estimateObjectsRemaining(cursor),
      };
    }

    return {
      valid: true,
      status: "healthy",
      errors: [],
      warnings,
      estimatedSyncLagMs: lagMs,
      estimatedObjectsRemaining: 0,
    };
  }

  compare(left: ConnectSyncCursorRow, right: ConnectSyncCursorRow): CursorComparisonResult {
    const differences: string[] = [];
    if (left.connectionId !== right.connectionId) differences.push("connectionId");
    if (left.lastSequenceNumber !== right.lastSequenceNumber) differences.push("lastSequenceNumber");
    if (left.lastSuccessfulSync !== right.lastSuccessfulSync) differences.push("lastSuccessfulSync");
    if (JSON.stringify(left.syncCursor) !== JSON.stringify(right.syncCursor)) differences.push("syncCursor");
    if (JSON.stringify(left.providerCursor) !== JSON.stringify(right.providerCursor)) differences.push("providerCursor");
    return { equal: differences.length === 0, differences, left, right };
  }

  private isCorrupted(cursor: ConnectSyncCursorRow): boolean {
    if (typeof cursor.syncCursor !== "object" || cursor.syncCursor === null) return true;
    if (typeof cursor.providerCursor !== "object" || cursor.providerCursor === null) return true;
    if (cursor.lastSequenceNumber < 0) return true;
    return false;
  }

  private isExpired(cursor: ConnectSyncCursorRow): boolean {
    if (!cursor.lastSuccessfulSync) return cursor.status !== "idle";
    const elapsed = Date.now() - new Date(cursor.lastSuccessfulSync).getTime();
    return elapsed > this.staleThresholdMs;
  }

  private estimateSyncLag(cursor: ConnectSyncCursorRow): number {
    if (!cursor.lastSuccessfulSync) return Infinity;
    return Date.now() - new Date(cursor.lastSuccessfulSync).getTime();
  }

  private estimateObjectsRemaining(cursor: ConnectSyncCursorRow): number {
    const pending = cursor.metadata.pendingObjects;
    return typeof pending === "number" ? pending : 0;
  }
}
