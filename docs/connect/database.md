# Connect Database Schema

Sprint 4 adds **additive-only** migrations for WorkVouch Connect persistence. No existing tables are modified.

## Migration

```
supabase/migrations/20260808120000_connect_event_store.sql
```

## Tables

### connect_event_store

Immutable append-only event history. Primary store for Event Sourcing Lite.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `correlation_id` | TEXT | Request trace ID |
| `provider` | TEXT | ATS provider |
| `provider_version` | TEXT | Provider semver |
| `connect_version` | TEXT | Connect platform semver |
| `company_id` | TEXT | Employer account |
| `connection_id` | UUID | OAuth connection |
| `aggregate_type` | TEXT | Stream type |
| `aggregate_id` | TEXT | Stream ID |
| `sequence_number` | BIGINT | Per-stream sequence |
| `event_type` | TEXT | Universal event type |
| `provider_event_type` | TEXT | Raw provider event |
| `payload` | JSONB | Event data |
| `metadata` | JSONB | Idempotency key, etc. |
| `occurred_at` | TIMESTAMPTZ | Event timestamp |
| `recorded_at` | TIMESTAMPTZ | Persistence timestamp |

**Unique constraint:** `(aggregate_type, aggregate_id, sequence_number)`

### connect_connections

OAuth connection records per employer + provider.

### connect_provider_accounts

Provider-side account metadata linked to connections.

### connect_candidate_map

External candidate ID ↔ WorkVouch profile mapping.

### connect_job_map

External job ID mapping.

### connect_sync_log

Inbound/outbound sync operation log (future use).

### connect_webhook_log

Inbound webhook delivery log with deduplication on `(provider, provider_event_id)`.

### connect_projection_state

Derived read models rebuilt from event store.

| Column | Type | Notes |
|--------|------|-------|
| `aggregate_type` | TEXT | Stream type |
| `aggregate_id` | TEXT | Stream ID |
| `projection_name` | TEXT | e.g. `candidate_current_state` |
| `sequence_number` | BIGINT | Last applied sequence |
| `state` | JSONB | Derived state snapshot |
| `updated_at` | TIMESTAMPTZ | Last rebuild time |

**Unique constraint:** `(aggregate_type, aggregate_id, projection_name)`

## Indexes

- Event store: correlation, company, aggregate stream, event type, occurred_at
- Connections: employer, provider
- Candidate map: email
- Sync log: connection + created_at
- Webhook log: connection + received_at
- Projection state: aggregate

## Security

All tables have RLS enabled. Sprint 4 uses **service role only** — no employer-facing policies. Future sprints may add scoped access.

## Applying Migrations

```bash
supabase db push
# or
supabase migration up
```

## Relationship Diagram

```
connect_connections
  ├── connect_provider_accounts
  ├── connect_candidate_map
  ├── connect_job_map
  ├── connect_sync_log
  └── connect_webhook_log

connect_event_store (standalone — source of truth)
  └── connect_projection_state (derived)
```

Events reference `connection_id` and `company_id` but are not FK-constrained to allow historical retention after connection deletion.
