# Repositories

Connect persistence uses a **repository pattern** — data access only, no business logic.

## Repository Interfaces

| Repository | Interface | Purpose |
|------------|-----------|---------|
| Event Store | `EventStoreRepository` | Append and query immutable events |
| Connection | `ConnectionRepository` | OAuth connection records |
| Candidate Map | `CandidateMapRepository` | External ↔ WorkVouch candidate mapping |
| Job Map | `JobMapRepository` | External ↔ WorkVouch job mapping |
| Projection | `ProjectionRepository` | Derived read model snapshots |
| Webhook | `WebhookRepository` | Inbound webhook delivery log |

## Implementations

### In-Memory (tests & local dev)

```
lib/integrations/connect/persistence/in-memory/
├── in-memory-event-store-repository.ts
├── in-memory-connection-repository.ts
├── in-memory-candidate-map-repository.ts
├── in-memory-job-map-repository.ts
├── in-memory-projection-repository.ts
└── in-memory-webhook-repository.ts
```

### Supabase (production)

```
lib/integrations/connect/persistence/supabase/
├── supabase-event-store-repository.ts
├── supabase-connection-repository.ts
├── supabase-candidate-map-repository.ts
├── supabase-job-map-repository.ts
├── supabase-projection-repository.ts
└── supabase-webhook-repository.ts
```

All Supabase repositories use the **service role** client (`admin` from `@/lib/supabase-admin`). RLS is enabled with no employer policies in Sprint 4.

## Usage

```typescript
import {
  InMemoryEventStoreRepository,
  InMemoryConnectionRepository,
  SupabaseEventStoreRepository,
} from "@/lib/integrations/connect";
import { admin } from "@/lib/supabase-admin";

// Tests
const eventRepo = new InMemoryEventStoreRepository();

// Production
const eventRepo = new SupabaseEventStoreRepository(admin);
```

## Design Rules

1. Repositories perform CRUD only — no validation, mapping, or event bus logic
2. Event store repository is append-only (no update/delete methods)
3. Idempotency is handled at the repository level for event store
4. All repositories return typed row interfaces from `persistence/types.ts`

## Interface Location

```
lib/integrations/connect/persistence/repositories/
├── event-store-repository.ts
├── connection-repository.ts
├── candidate-map-repository.ts
├── job-map-repository.ts
├── projection-repository.ts
└── webhook-repository.ts
```
