# ADR-006: Why Event-Driven Architecture Was Selected

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform receives webhooks from Greenhouse (real-time), runs scheduled cron jobs (batch sync), and responds to trust score changes (event-driven export). These triggers must be processed reliably without blocking the webhook response.

Greenhouse retries non-200 webhook responses for up to 24 hours. WorkVouch must return 200 within 500ms.

---

## Decision

Use an **event-driven architecture** with:

1. **Webhook endpoint** returns 200 immediately after validation + persistence
2. **Event Bus** (`ats_events` table) queues all async work
3. **Workers** (cron-triggered) process events by priority (P0–P3)
4. **Retry Service** handles failures with exponential backoff (5 attempts)
5. **DLQ** (dead letter queue) for non-retryable or exhausted failures

Event flow: Webhook → Validate → Log → Enqueue → Return 200 → Worker processes async.

---

## Consequences

**Positive:**
- Webhook response always <500ms (marketplace requirement)
- Failed processing doesn't cause GH webhook retries (which could amplify failures)
- Retry logic is centralized, not per-endpoint
- DLQ enables admin replay of failed events
- Priority queue ensures token refresh (P0) before batch export (P2)
- Event log provides complete audit trail

**Negative:**
- Eventual consistency: trust score in GH may lag WV by up to 15 minutes
- `ats_events` table adds storage and processing overhead
- Worker failures require monitoring and alerting
- Debugging async flows is harder than synchronous

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Synchronous webhook processing | Violates 500ms response requirement; GH retries on timeout |
| Message queue (Redis/SQS) | Additional infrastructure; Supabase-based queue sufficient for V1 volume |
| Polling-only (no webhooks) | 15-min minimum lag; misses stage change triggers; poor recruiter experience |
| Serverless functions per event | Cold start latency; harder to debug; team uses Next.js API routes |

---

## Future Impact

- Event bus scales to multiple providers (same queue, provider field)
- Worker concurrency can increase horizontally in V2
- Event replay enables "time travel" debugging for customer issues

---

## Related

- [ADR-007](./ADR-007-why-additive-database-migrations.md)
- [docs/integrations/04-event-system.md](../integrations/04-event-system.md)
- [docs/integration-contract/04-webhook-contract.md](../integration-contract/04-webhook-contract.md)
