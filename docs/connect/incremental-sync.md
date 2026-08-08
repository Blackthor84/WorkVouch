# Incremental Sync

WorkVouch Connect **never performs a full import unless explicitly requested**. After the first sync, all imports default to incremental mode.

## Import Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `full` | Admin request or no cursor | Import all records |
| `incremental` | Scheduled sync | Only records after cursor |
| `resume` | Cursor status `paused` | Continue from saved page/cursor |
| `recovery` | Cursor status `error` | Restore from last checkpoint, retry |
| `dry_run` | Preview | Fetch and count without persisting |

## Mode Resolution

```typescript
const mode = await connections.resolveSyncMode(connectionId);
// Priority: explicit request → error → paused → no prior sync → incremental
```

## Greenhouse Harvest Example

`HarvestImportService` supports all modes:

```typescript
await harvestImport.importFull({ connectionId, employerAccountId });
await harvestImport.importIncremental({ connectionId, employerAccountId });
await harvestImport.resumeImport({ connectionId, employerAccountId });
await harvestImport.recoveryImport({ connectionId, employerAccountId });
await harvestImport.dryRunImport({ connectionId, employerAccountId });
```

Incremental Harvest calls pass `updated_after` from the saved cursor:

```typescript
const updatedAfter = cursor.providerCursor.updatedAfter ?? cursor.lastSuccessfulSync;
await harvest.listJobs(token, page, perPage, updatedAfter);
```

## Provider Implementation Guide

Future providers (Lever, Ashby, Workday) must:

1. Inject `SyncCursorManager` via runtime
2. Call `beginSync()` before fetch, `completeSync()` after success
3. On failure, call `recordCursorError()`
4. Use `resolveIncrementalParams()` for cursor/timestamp resolution
5. Store native cursors in `providerCursor` (e.g. `{ nativeCursor: "abc" }`)

```typescript
const params = cursorService.resolveIncrementalParams(cursor);
if (params.isFullImport) {
  // full fetch
} else {
  // fetch with params.updatedAfter or native cursor
}
```

## Dry Run

Dry runs fetch data and return counts but do **not**:

- Persist events
- Advance cursor
- Create checkpoints

Use for pre-sync validation and admin previews.
