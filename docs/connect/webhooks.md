# Webhooks

WorkVouch Connect receives Greenhouse webhooks in real time and processes them through the full Connect pipeline.

## Endpoint

```
POST /api/integrations/v1/webhooks/greenhouse?connectionId={uuid}
```

**Authentication:** HMAC-SHA256 via `Signature: sha256={hex}` header. No session auth.

**Connection resolution:**
1. Query param `connectionId`
2. Header `X-WorkVouch-Connection-Id`
3. Header `X-Greenhouse-Organization-Id` (validated against connection)

## Pipeline

```
Webhook POST
  → Signature verification
  → Payload validation
  → Idempotency check (connect_webhook_log)
  → GreenhouseEventTranslator
  → ConnectPlatform (audit + timeline)
  → Event Store (immutable append)
  → Projection Engine
  → Sync Cursor update (lastWebhookProcessed)
  → 200 OK (< 500ms target)
```

Failed events go to the Dead Letter Queue for replay — never silently discarded.

## Supported Events

| Greenhouse Action | Universal Event |
|-------------------|-----------------|
| `candidate_created` | CandidateCreated |
| `candidate_updated` | CandidateUpdated |
| `application_created` | ApplicationCreated |
| `application_updated` | CandidateMoved |
| `application_stage_changed` | CandidateMoved |
| `job_updated` | JobUpdated |
| `offer_created` | OfferCreated |
| `offer_accepted` | OfferAccepted |
| `offer_rejected` | OfferRejected |
| `hire_candidate` | CandidateHired |
| `reject_candidate` | CandidateRejected |
| `candidate_withdrawn` | CandidateWithdrawn |

## Idempotency

Key format: `{action}:{entity_id}:{updated_at}`

Duplicates return `200 OK` with `{ duplicate: true }` — no reprocessing.

## Configuration

```env
GREENHOUSE_WEBHOOK_SECRET=your-hookshot-secret
```

Configure Greenhouse Hookshot to POST to your webhook URL with the shared secret.

## OAuth Callback

```
GET /api/integrations/v1/connect/greenhouse/callback?code=&state=
```

Completes OAuth PKCE flow, persists encrypted tokens, initializes sync cursor, redirects to employer settings.

## Metrics

`runtime.webhookMetrics.getSnapshot()` returns delivery success/failure, duplicates, validation failures, latency, queue depth, and DLQ count.
