# Event Store

WorkVouch Connect uses an **append-only event store** — Event Sourcing Lite. Every provider interaction becomes an immutable historical record. Current state is always derived from history, never overwritten.

## Principles

- **Append only** — events are never updated or deleted
- **Provider agnostic** — one store for all ATS providers
- **Aggregate streams** — events grouped by `aggregateType` + `aggregateId`
- **Correlation** — cross-cutting timelines via `correlationId`

## Event Schema

Every stored event includes:

| Field | Description |
|-------|-------------|
| `id` | Unique event ID (UUID) |
| `correlationId` | Traces a single request/pipeline run |
| `provider` | ATS provider ID (e.g. `greenhouse`) |
| `providerVersion` | Provider package version |
| `connectVersion` | WorkVouch Connect platform version |
| `companyId` | Employer account ID |
| `connectionId` | OAuth connection ID |
| `aggregateType` | `candidate`, `job`, `application`, `connection`, etc. |
| `aggregateId` | External entity ID within the aggregate stream |
| `sequenceNumber` | Monotonic per-stream sequence (1, 2, 3…) |
| `eventType` | Universal event type (e.g. `ats.candidate.created`) |
| `providerEventType` | Raw provider event name |
| `payload` | Full event payload (raw + universal model) |
| `metadata` | Connect record ID, idempotency key, etc. |
| `occurredAt` | When the event happened |
| `recordedAt` | When Connect persisted the event |

## API

```typescript
import { ConnectEventStore, InMemoryEventStoreRepository } from "@/lib/integrations/connect";

const store = new ConnectEventStore(new InMemoryEventStoreRepository());

// Append
await store.appendEvent({ correlationId, provider, ... });

// Load single event
await store.loadEvent(eventId);

// Load aggregate stream (ordered by sequence)
await store.loadStream({ aggregateType: "candidate", aggregateId: "12345" });

// Load timeline (by correlation, company, etc.)
await store.loadTimeline({ correlationId: "corr-abc" });

// Replay stream (dry-run by default)
await store.replayStream("candidate", "12345", { dryRun: true });

// Latest snapshot
await store.getLatestSnapshot("candidate", "12345");
```

## Idempotency

Duplicate events are prevented via `idempotencyKey`. If the same key is appended twice, the original event is returned without creating a duplicate row.

## Production Storage

Production uses `SupabaseEventStoreRepository` backed by the `connect_event_store` table. Tests use `InMemoryEventStoreRepository`.

## Integration with Connect Platform

When `ConnectPlatform` is configured with an `eventStore`, `captureTranslation()` automatically persists published events. Call `await connect.flushPersistence()` to await all pending writes.

## Example Timeline

```
Candidate Created     (seq 1)
  ↓
Candidate Updated     (seq 2)
  ↓
Moved To Interview    (seq 3)
  ↓
Offer Accepted        (seq 4)
  ↓
Candidate Hired       (seq 5)
```

An engineer can reconstruct the entire candidate history from this stream alone.
