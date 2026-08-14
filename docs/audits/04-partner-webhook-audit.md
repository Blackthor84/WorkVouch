# 04 — Partner Webhook Audit

**Date:** 2026-08-13  
**Implementation:** `app/api/integrations/v1/webhooks/greenhouse/route.ts`, `webhook-service.ts`, `webhook-signature.ts`

---

## Executive Answer

**Are our webhooks compatible with partner webhook requirements?**  
**PARTIALLY SUPPORTED** — Hookshot-style HMAC ingress is implemented and production-hardened, but **partner-specific webhook registration, payload versioning, and event catalog alignment are unverified** without sandbox.

---

## Current Implementation

### Endpoint

```
POST /api/integrations/v1/webhooks/greenhouse?connectionId={uuid}
```

Optional headers: `X-WorkVouch-Connection-Id`, `X-Greenhouse-Organization-Id`

### Authentication / Signature

| Check | Status |
|-------|--------|
| HMAC-SHA256 over raw body | ✅ SUPPORTED |
| Header: `Signature: sha256={hex}` | ✅ SUPPORTED |
| Fallback headers | ✅ `x-greenhouse-signature`, `x-hub-signature-256` |
| Timing-safe compare | ✅ |
| Secret from env / config | ✅ `GREENHOUSE_WEBHOOK_SECRET` |
| Invalid signature → 401 | ✅ |

### Payload format

- JSON body parsed by `parseGreenhouseWebhook()`
- Expected Hookshot-style envelope with `action`, payload fields
- Fixtures in `lib/integrations/providers/greenhouse/fixtures/greenhouse/`

### Supported actions (13)

| Action | Universal event |
|--------|-----------------|
| `candidate_created` | CandidateCreated |
| `candidate_updated` | CandidateUpdated |
| `application_created` | ApplicationCreated |
| `application_updated` | CandidateMoved |
| `application_stage_changed` | CandidateMoved |
| `job_created` | JobCreated |
| `job_updated` | JobUpdated |
| `offer_created` | OfferCreated |
| `offer_accepted` | OfferAccepted |
| `offer_rejected` | OfferRejected |
| `hire_candidate` | CandidateHired |
| `reject_candidate` | CandidateRejected |
| `candidate_withdrawn` | CandidateWithdrawn |

### Processing pipeline

| Capability | Status |
|------------|--------|
| Idempotency | ✅ SUPPORTED — `{action}:{entity_id}:{updated_at}` |
| Duplicate → 200 | ✅ |
| Event store append | ✅ |
| Projection | ✅ |
| Retry on failure | ✅ |
| Dead letter | ✅ SUPPORTED — `connect_webhook_log` + `connect_dead_letter_queue` |
| Replay | ✅ Employer Replay Center + `replayAsync()` |
| Rate limiting | ✅ 300/min |
| Correlation IDs | ✅ |

---

## Classification Matrix

| Area | Status | Notes |
|------|--------|-------|
| HTTPS endpoint | SUPPORTED | Production URL required |
| HMAC verification | SUPPORTED | Hookshot pattern |
| Partner webhook registration API | NOT SUPPORTED | Manual Hookshot in GH admin |
| Programmatic webhook create (Harvest API) | NOT SUPPORTED | `harvest:webhooks` scope unused |
| Event version header | UNKNOWN UNTIL SANDBOX | Not parsed in code |
| Partner-specific event names (V3) | UNKNOWN UNTIL SANDBOX | Mapped to V1 Hookshot actions |
| Multi-tenant routing | PARTIALLY SUPPORTED | `connectionId` query param required |
| Replay protection (timestamp/nonce) | NOT SUPPORTED | Relies on idempotency key only |
| Greenhouse retry behavior | PARTIALLY SUPPORTED | Returns 200 on accept; internal retry on process fail |

---

## Partner Webhook Mechanism Gap

WorkVouch assumes **manual Hookshot configuration** per `docs/marketplace/installation-guide.md`:

1. Customer creates webhook in Greenhouse admin
2. Points to WorkVouch URL + secret
3. WorkVouch verifies HMAC

Official partner program may require:

- Partner-registered webhook endpoints
- Different signing scheme or headers for V3-era webhooks
- OAuth-scoped webhook management

**Action:** Confirm with Greenhouse partner support whether Hookshot manual setup remains valid for Harvest V3 partner integrations.

---

## Greenhouse-Specific Assumptions

1. Webhook payload shape matches V1 Hookshot fixtures
2. `action` field naming unchanged in partner webhooks
3. Single webhook secret per connection/org
4. `connectionId` passed as query param (not standard Greenhouse behavior)

---

## Recommendations (Documentation Only)

1. Validate real webhook payloads in sandbox against `webhookMapper.ts`
2. Document required Hookshot events for MVP (minimum set)
3. Clarify multi-connection routing in marketplace setup guide
4. Add event version handling if Greenhouse sends `API-Version` or similar header
5. Do not claim programmatic webhook setup until implemented

---

## Test Now vs Sandbox

| Test | Now (Mock) | Sandbox |
|------|------------|---------|
| Signature verification | ✅ | ✅ |
| Idempotency | ✅ | ✅ |
| Event routing | ✅ fixtures | Real payloads |
| Connection resolution | ✅ mocked | Real org IDs |
| Partner webhook registration | ❌ | Required |
