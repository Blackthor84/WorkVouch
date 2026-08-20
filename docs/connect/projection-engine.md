# Projection Engine

The Projection Engine derives **current read models** from immutable event history. It never writes to the event store.

## Supported Projections

| Projection | Aggregate | Description |
|------------|-----------|-------------|
| `candidate_current_state` | `candidate` | Email, name, application status, verification, trust |
| `job_current_state` | `job` | Title, status, external ID |
| `connection_current_state` | `connection` | Provider, connection status |

## How It Works

1. Load all events for an aggregate stream (ordered by `sequenceNumber`)
2. Fold events through a type-specific handler
3. Save derived state to `connect_projection_state` (via `ProjectionRepository`)
4. Return the projection result

Projections are **rebuildable** — delete projection state and re-run `projectState()` to reconstruct from history.

## API

```typescript
import {
  ConnectEventStore,
  ProjectionEngine,
  InMemoryEventStoreRepository,
  InMemoryProjectionRepository,
} from "@/lib/integrations/connect";

const eventStore = new ConnectEventStore(new InMemoryEventStoreRepository());
const engine = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());

const candidate = await engine.projectCandidate("12345");
console.log(candidate.state.applicationStatus); // "hired"

const job = await engine.projectJob("67890");
const connection = await engine.projectConnection("conn-uuid");
```

## Payload Resolution

Projection handlers resolve entity data from stored payloads:

```
payload.universalModel → entity → candidate | job
```

This supports both direct models and wrapped `{ entity: { candidate: ... } }` structures.

## Connect Platform Integration

```typescript
const projection = await connect.projectState("candidate", "12345");
```

Projections are updated automatically when events are persisted via `captureTranslation()` (if `projectionEngine` is configured).

## Future Analytics

Because projections are derived from universal event types, future analytics can:

- Count hires per time period from `ats.candidate.hired` events
- Measure time-to-hire from created → hired sequences
- Track verification completion rates

No schema redesign required — query the event store directly or use pre-built projections.
