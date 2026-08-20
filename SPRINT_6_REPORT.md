# SPRINT 6 REPORT — Live Webhooks & Synchronization

**Operation Greenhouse · Sprint 6**  
**Date:** August 8, 2026

---

## Executive Summary

Sprint 6 delivers **real-time Greenhouse synchronization** via webhooks. A webhook can arrive, validate, translate, store, project, replay, audit, and update health — all automatically. **95 integration tests pass** (9 new webhook tests).

---

## Webhook Coverage

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/integrations/v1/webhooks/greenhouse` | POST | Webhook ingress |
| `/api/integrations/v1/connect/greenhouse/callback` | GET | OAuth callback |

### Supported Events (12 actions)

| Greenhouse Action | Universal Event | Real-Time |
|-------------------|-----------------|-----------|
| candidate_created | CandidateCreated | ✓ |
| candidate_updated | CandidateUpdated | ✓ |
| application_created | ApplicationCreated | ✓ |
| application_updated | CandidateMoved | ✓ |
| application_stage_changed | CandidateMoved | ✓ |
| job_updated | JobUpdated | ✓ |
| offer_created | OfferCreated | ✓ |
| offer_accepted | OfferAccepted | ✓ |
| offer_rejected | OfferRejected | ✓ |
| hire_candidate | CandidateHired | ✓ |
| reject_candidate | CandidateRejected | ✓ |
| candidate_withdrawn | CandidateWithdrawn | ✓ |

---

## Real-Time Pipeline

```
Webhook → Validation → Translation → Universal Event → Event Store
  → Projection → Replay Available → Audit Updated → Cursor Updated
```

Implemented in:
- `WebhookService` — ingress orchestration
- `GreenhouseWebhookProcessor` — real-time pipeline
- `GreenhouseEventTranslator` — mapping (Sprint 3B-2)
- `ConnectPlatform.captureTranslation` — audit + persistence

---

## Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Webhook response | < 500ms | Sync verify + async process |
| Signature verification | timing-safe | HMAC-SHA256 |
| Idempotency | exactly-once practical | DB unique + event store keys |
| Duplicate detection | immediate 200 | `connect_webhook_log` dedup |

Webhook metrics tracked via `WebhookMetrics`:
- Delivery success/failure
- Validation failures
- Duplicates detected
- Average latency
- Queue depth
- DLQ count
- Projection lag

---

## DLQ Statistics

- Failed webhooks → `DeadLetterQueue` + `connect_webhook_log` status `dead_letter`
- Replay via `WebhookService.replayDeadLetter(id)`
- Never silently discard events

---

## Replay Validation

- Connect audit trail per webhook (received → validated → mapped → published → completed)
- Event store idempotency prevents duplicate persistence
- `replayUntilCursor()` replays events up to cursor position
- `replayFromCursor()` replays from connection event index

---

## Test Coverage

**File:** `tests/integrations/connect-sprint6-webhooks.test.ts` (9 tests)

| Area | Status |
|------|--------|
| Signature verification | ✓ |
| Duplicate delivery | ✓ |
| Invalid signature (401) | ✓ |
| Event store persistence | ✓ |
| Cursor update | ✓ |
| Application stage changed | ✓ |
| DLQ on failure | ✓ |
| Metrics tracking | ✓ |
| Provider receiveWebhook | ✓ |

**Total:** 95 integration tests passing, zero regressions.

---

## Final Review

### Can WorkVouch remain synchronized with Greenhouse through webhooks alone for supported event types?

**YES** — for the 12 supported webhook actions, real-time sync is fully operational without polling. Cursor tracks `lastWebhookProcessed` and entity timestamps.

### What still requires scheduled imports?

| Scenario | Requires Harvest Import |
|----------|------------------------|
| Initial connection backfill | **YES** — one-time full import |
| Historical records (pre-webhook) | **YES** |
| `job_created` events | **YES** — not in webhook catalog |
| Greenhouse users/permissions | **YES** — no webhook |
| Long outage catch-up (> webhook retention) | **YES** — incremental/recovery import |
| Custom field bulk reconciliation | **YES** — partial webhook coverage |

**Recommendation:** Enable webhooks for real-time sync; schedule incremental Harvest import every 6–24 hours as safety net.

---

## Files Added/Modified

### New
- `lib/integrations/connect/webhooks/` (4 files)
- `lib/integrations/providers/greenhouse/auth/webhook-signature.ts`
- `lib/integrations/connect/connect-api-runtime.ts`
- `app/api/integrations/v1/webhooks/greenhouse/route.ts`
- `app/api/integrations/v1/connect/greenhouse/callback/route.ts`
- `tests/integrations/connect-sprint6-webhooks.test.ts`
- `docs/connect/webhooks.md`, `dead-letter-queue.md`, `real-time-events.md`

### Modified
- `connect-runtime.ts` — WebhookService wiring
- `greenhouse/provider.ts` — receiveWebhook implementation
- `webhookMapper.ts` — application_stage_changed
- `replay-service.ts` — replayUntilCursor fix
- `CHANGELOG.md`

---

## Remaining Work

1. Per-connection `webhook_secret_encrypted` (currently env-level secret)
2. Persistent DLQ (Supabase-backed, survives restart)
3. Async webhook worker for high-volume decoupling
4. Webhook health dashboard UI (internal)
5. Greenhouse webhook auto-provisioning via Harvest API
