# Sync Cursor Engine

The Sync Cursor Engine is the **memory of WorkVouch Connect**. Every provider connection stores exactly where synchronization stopped so future imports request only changes since the last successful sync.

## Components

| Component | Location | Role |
|-----------|----------|------|
| `SyncCursorService` | `lib/integrations/connect/sync/sync-cursor-service.ts` | Core cursor CRUD: initialize, advance, reset, archive, clone |
| `SyncCursorManager` | `lib/integrations/connect/sync/sync-cursor-manager.ts` | High-level orchestration: begin/complete sync, recovery, performance |
| `SyncCursorValidator` | `lib/integrations/connect/sync/sync-cursor-validator.ts` | Health validation and cursor comparison |
| `SyncCheckpoint` | `lib/integrations/connect/sync/sync-checkpoint.ts` | Immutable checkpoint history after each successful sync |
| `SyncCursorRepository` | `lib/integrations/connect/persistence/repositories/` | Persistence (in-memory + Supabase) |

## Cursor Fields

Each connection has one cursor row (`connect_sync_cursor`) tracking:

- **Timestamps**: `lastSuccessfulSync`, `lastCandidateImported`, `lastJobImported`, `lastApplicationImported`, `lastEventReceived`, `lastWebhookProcessed`, `lastProjectionCompleted`
- **Scheduling**: `nextScheduledSync`
- **Position**: `syncCursor` (Connect payload), `providerCursor` (native API cursor), `lastSequenceNumber`
- **Snapshots**: `lastSnapshotId`, `lastSnapshotAt`
- **Recovery**: `lastError`, `lastErrorAt`, `retryCount`, `status`

## Operations

```typescript
const cursorManager = runtime.cursorManager;

// Initialize on first connect
await cursorManager.getOrCreate(connectionId, "greenhouse", "1.0.0");

// Before sync
await cursorManager.beginSync(connectionId, "incremental");

// After successful sync (creates checkpoint automatically)
await cursorManager.completeSync(connectionId, "greenhouse", "incremental", stats);

// Admin reset (forces next sync to full import)
await cursorManager.resetCursor(connectionId);

// Validate health
const validation = await cursorManager.validateCursor(connectionId);
```

## Provider-Agnostic Design

Providers never implement cursor storage directly. They:

1. Call `ConnectionManager.resolveSyncMode()` to determine import mode
2. Read `providerCursor.updatedAfter` or `lastSuccessfulSync` for incremental params
3. Write native cursors back via `completeSync()` → `providerCursor`

Greenhouse uses Harvest `updated_after`. Webhooks update `lastWebhookProcessed` and entity-specific timestamps in real time.

## Webhook Cursor Updates

After each successful webhook:

```typescript
await cursorManager.updateCursor(connectionId, {
  lastWebhookProcessed: now,
  lastEventReceived: now,
  providerCursor: { lastWebhookAction: action, lastEventId },
});
```

## Connection Manager Integration

`ConnectionManager` exposes:

- `getCursor()`, `updateCursor()`, `resetCursor()`
- `scheduleNextSync()`, `validateCursor()`
- `initializeCursor()`, `resolveSyncMode()`

## Health Integration

`ConnectHealthService` reports cursor component status:

| Status | Meaning |
|--------|---------|
| `healthy` | Cursor valid, sync current |
| `behind` | Sync lag exceeds threshold |
| `missing` | No cursor initialized |
| `corrupted` | Invalid cursor payload |
| `expired` | Last sync too stale |

Includes `estimatedSyncLagMs` and `estimatedObjectsRemaining`.
