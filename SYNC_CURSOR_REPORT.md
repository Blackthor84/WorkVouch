# SYNC CURSOR REPORT — Sprint 6A

**Operation Greenhouse · Incremental Sync Cursor Engine**  
**Date:** August 8, 2026  
**Connect Version:** 1.0.0

---

## Executive Summary

Sprint 6A delivers a **provider-agnostic Sync Cursor Engine** that gives every ATS connection durable synchronization memory. Greenhouse Harvest import now supports full, incremental, resume, recovery, and dry-run modes. All 86 integration tests pass with zero regressions.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Connect Runtime                          │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │ Connection   │──│ SyncCursorManager│──│ SyncCursor    │  │
│  │ Manager      │  │                  │  │ Service       │  │
│  └──────────────┘  └────────┬─────────┘  └───────┬───────┘  │
│                              │                     │          │
│  ┌──────────────┐  ┌────────▼─────────┐  ┌───────▼───────┐  │
│  │ Harvest      │  │ SyncCheckpoint   │  │ SyncCursor    │  │
│  │ ImportService│  │                  │  │ Validator     │  │
│  └──────────────┘  └──────────────────┘  └───────────────┘  │
│  ┌──────────────┐  ┌──────────────────┐                     │
│  │ ConnectHealth│  │ ReplayService    │                     │
│  │ Service      │  │ (cursor replay)  │                     │
│  └──────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Supabase / In-Memory │
                    │  connect_sync_cursor  │
                    │  connect_sync_checkpoints │
                    └───────────────────────┘
```

### Design Principles

1. **Build once, reuse forever** — All 20+ future providers use the same cursor engine
2. **Incremental by default** — Full import only when explicitly requested or cursor missing
3. **Every failure recoverable** — Checkpoints + idempotent event store
4. **Native cursors when available** — `providerCursor` stores API-specific tokens; timestamps as fallback

---

## Database Objects

### `connect_sync_cursor`

One row per connection (unique on `connection_id`).

Key fields: timestamps, `sync_cursor` JSONB, `provider_cursor` JSONB, `last_sequence_number`, snapshot refs, retry/error state, `status`.

Indexes: `connection_id`, `provider`, `status`, `next_scheduled_sync`.

### `connect_sync_checkpoints`

Immutable history linked to cursor via `cursor_id`.

Migration: `supabase/migrations/20260808140000_connect_sync_cursor.sql`

---

## Cursor Flow

```
1. initializeCursor(connectionId, provider)
2. resolveSyncMode() → full | incremental | resume | recovery
3. beginSync(connectionId, mode) → status: syncing
4. Provider fetch (updated_after / native cursor)
5. Persist events (idempotent)
6. completeSync(stats) → advance cursor + create checkpoint
7. scheduleNextSync(delayMs) [optional]
```

On failure: `recordCursorError()` → status: error, retry_count++

---

## Checkpoint Flow

After every successful `completeSync()`:

- Checkpoint row created with duration, counts, sequence, replay reference
- Linked to correlation ID for audit/replay
- Performance metrics computed from checkpoint history

---

## Recovery Flow

| Trigger | Mode | Action |
|---------|------|--------|
| No cursor | `full` | Initialize + full import |
| Error state | `recovery` | `recover()` from checkpoint + incremental |
| Paused state | `resume` | Continue from saved cursor pages |
| Normal | `incremental` | `updated_after` / native cursor |

---

## Performance Metrics

Measured via `SyncCursorManager.getPerformanceMetrics()`:

| Metric | Source |
|--------|--------|
| Average sync duration | Checkpoint `durationMs` |
| Average cursor advance | Time between checkpoints |
| Records per minute | Import counts / duration |
| Checkpoint frequency | Checkpoint count |
| Resume speed | Recovery/resume checkpoint durations |
| Cursor accuracy | Validation pass rate |

---

## Test Coverage

**File:** `tests/integrations/connect-sync-cursor.test.ts` (11 tests)

| Area | Tests |
|------|-------|
| Initialization | ✓ |
| Incremental sync | ✓ |
| Resume / recovery | ✓ |
| Crash recovery (error → recovery) | ✓ |
| Cursor validation | ✓ |
| Checkpoint creation | ✓ |
| Replay from cursor | ✓ |
| Performance metrics | ✓ |
| Dry run | ✓ |
| Reset / clone | ✓ |
| Health integration | ✓ |

---

## Regression Results

```
Test Files  8 passed (8)
Tests       86 passed (86)
Duration    ~3s
```

All Sprint 3–5 tests pass unchanged.

---

## Future Provider Compatibility

| Provider | Native Cursor | Fallback |
|----------|---------------|----------|
| Greenhouse | `updated_after` | `lastSuccessfulSync` |
| Lever | Posting API cursor | Timestamp |
| Ashby | Sync token | Timestamp |
| Workday | WWS paging token | Timestamp + sequence |

Providers implement only **fetch logic**. Cursor storage, checkpoints, recovery, health, and replay are shared.

---

## Final Review

### Can incremental synchronization continue at scale without full re-imports?

**YES.** Each connection maintains `providerCursor.updatedAfter` and `lastSuccessfulSync`. Scheduled syncs use incremental mode. At 100M records across 100K companies, each connection syncs only its delta — no global re-import.

### Can synchronization resume after failure without data loss?

**YES.** Event store idempotency keys prevent duplicates. Checkpoints anchor recovery. `recover()` restores cursor from last checkpoint. Error state triggers recovery mode automatically.

### Can providers use native cursors when available and timestamps/sequences when they are not?

**YES.** `providerCursor` accepts any JSON payload (`nativeCursor`, `updatedAfter`, etc.). `resolveIncrementalParams()` checks provider cursor first, then Connect cursor, then timestamp fallback.

---

## Files Added/Modified

### New
- `lib/integrations/connect/sync/` (6 files)
- `lib/integrations/connect/persistence/repositories/sync-cursor-repository.ts`
- `lib/integrations/connect/persistence/repositories/sync-checkpoint-repository.ts`
- `lib/integrations/connect/persistence/in-memory/in-memory-sync-*-repository.ts`
- `lib/integrations/connect/persistence/supabase/supabase-sync-*-repository.ts`
- `supabase/migrations/20260808140000_connect_sync_cursor.sql`
- `tests/integrations/connect-sync-cursor.test.ts`
- `docs/connect/sync-cursor.md`, `checkpoints.md`, `incremental-sync.md`, `recovery.md`

### Modified
- `connect-runtime.ts` — wires `SyncCursorManager`
- `connection-manager.ts` — cursor API surface
- `connect-health-service.ts` — cursor health component
- `replay-service.ts` — cursor replay methods
- `harvest-import-service.ts` — incremental/resume/recovery/dry_run
- `harvest-client.ts` — `updated_after` param

---

## Engineering Principle

> The Sync Cursor is the memory of WorkVouch Connect.  
> Every provider must be resumable.  
> Every synchronization must be incremental.  
> Every failure must be recoverable.  
> **Build once. Reuse forever.**
