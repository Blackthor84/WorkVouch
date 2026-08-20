# Event Store Snapshots

Snapshots accelerate projection rebuild and replay for long aggregate streams.

## Configuration

Default: automatic snapshot every **50 events**.

```typescript
const snapshots = new SnapshotService(eventStore, snapshotRepo, projections, {
  eventsPerSnapshot: 50,
});
```

## Operations

| Operation | Method | Description |
|-----------|--------|-------------|
| Create | `createSnapshot()` | Manual or automatic snapshot |
| Load | `loadSnapshot()` | Get latest snapshot |
| Restore | `restoreSnapshot()` | Rebuild state from snapshot + tail events |
| Auto | `maybeCreateAutomaticSnapshot()` | Create if event count hits threshold |
| Replay | `replayFromSnapshot()` | Combine restore + dry-run replay |

## Table

`connect_event_snapshots` stores:

- `aggregate_type`, `aggregate_id`
- `sequence_number` — last event included
- `state` — projected state at snapshot point
- `event_count` — total events at snapshot time
- `snapshot_type` — `automatic` or `manual`

## Projection Rebuild

Without snapshots: replay all N events (O(n)).

With snapshots: load snapshot state + replay events after `sequence_number` (O(n - snapshot)).

## Example

```typescript
// After 50 events appended
const snapshot = await snapshots.maybeCreateAutomaticSnapshot("candidate", "12345");

// Rebuild from snapshot
const restored = await snapshots.restoreSnapshot("candidate", "12345");
console.log(restored.tailEventsApplied); // events after snapshot
```

## Migration

Added in `20260808130000_connect_oauth_snapshots.sql`.
