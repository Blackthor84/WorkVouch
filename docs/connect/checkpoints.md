# Sync Checkpoints

Every successful synchronization creates an **immutable checkpoint** in `connect_sync_checkpoints`. Checkpoints provide audit history and recovery anchors.

## Checkpoint Contents

| Field | Description |
|-------|-------------|
| `checkpointAt` | Timestamp when sync completed |
| `provider` | ATS provider ID |
| `sequenceNumber` | Connection event index at checkpoint |
| `eventCount` | Events stored in this sync |
| `durationMs` | Sync duration |
| `importedCandidates` | Candidates imported |
| `importedJobs` | Jobs imported |
| `importedApplications` | Applications imported |
| `snapshotId` | Optional snapshot reference |
| `replayReference` | Correlation ID for replay |
| `syncType` | `full`, `incremental`, `resume`, `recovery`, `dry_run` |

## Creation

Checkpoints are created automatically by `SyncCursorManager.completeSync()`:

```typescript
await cursorManager.completeSync(connectionId, "greenhouse", "incremental", {
  jobsImported: 12,
  candidatesImported: 45,
  applicationsImported: 8,
  eventsStored: 65,
  durationMs: 4200,
  correlationId: "import-abc123",
  lastSequenceNumber: 1250,
});
```

## Querying

```typescript
const latest = await cursorService.checkpoints.getLatest(cursorId);
const history = await cursorService.checkpoints.listByConnection(connectionId, 50);
const metrics = await cursorManager.getPerformanceMetrics(connectionId);
```

## Performance Metrics

From checkpoint history:

- Average sync duration
- Average cursor advance interval
- Records per minute
- Checkpoint frequency
- Resume speed (recovery/resume sync types)
- Cursor accuracy

## Replay Integration

Checkpoints link to replay via `replayReference`:

```typescript
await replay.replaySinceCheckpoint(connectionId, checkpoint);
```

See [recovery.md](./recovery.md) for failure recovery flows.
