# ADR-007: Why Additive Database Migrations Were Chosen

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch has 206 existing database tables. The integration platform needs 8 new tables for connections, candidate mapping, events, sync logs, and webhook logs.

The question: modify existing tables (add columns to `profiles`, `employer_accounts`) or create new tables?

---

## Decision

**All integration data lives in new `ats_*` tables.** No modifications to existing tables.

New tables:
- `ats_connections` — OAuth connections
- `ats_provider_accounts` — Provider org metadata
- `ats_candidate_map` — GH candidate ↔ WV profile mapping
- `ats_job_map` — GH job metadata (V2)
- `ats_events` — Event bus queue
- `ats_sync_log` — Sync audit log
- `ats_webhook_log` — Webhook receipt log
- `ats_oauth_states` — CSRF state tokens

Rules:
- All tables prefixed `ats_`
- All tables have `employer_account_id` for tenant isolation
- Soft references to existing tables (UUID, no FK constraints that block deletion)
- RLS policies scoped to employer account owner
- Encrypted columns for all secrets

---

## Consequences

**Positive:**
- Zero risk to existing 206 tables and their RLS policies
- Integration tables can be dropped without affecting core product
- Clear ownership: integration team owns `ats_*` exclusively
- Migrations are independently deployable and rollbackable
- No migration conflicts with core product development

**Negative:**
- Some data duplication (candidate email in both `profiles` and `ats_candidate_map`)
- Joins required to get full candidate picture (map + profile)
- 8 new tables increase schema complexity

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Add `greenhouse_candidate_id` column to `profiles` | Modifies protected table; doesn't scale to multi-ATS; couples profile to one provider |
| Add `integration_settings` JSONB to `employer_accounts` | Modifies protected table; JSONB queries are slow; no RLS granularity |
| Single `integrations` table for everything | No separation of concerns; impossible to query efficiently |
| External database for integration data | Operational complexity; breaks Supabase RLS; team is Supabase-native |

---

## Future Impact

- `ats_*` tables become the integration platform's data store permanently
- If integration merges into core, tables remain (proven pattern)
- Provider #2 adds rows to same tables (provider column), not new tables

---

## Related

- [ADR-003](./ADR-003-why-existing-apis-remain-untouched.md)
- [docs/integrations/08-database-design.md](../integrations/08-database-design.md)
