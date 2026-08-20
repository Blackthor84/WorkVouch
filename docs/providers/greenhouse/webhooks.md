# Greenhouse Webhooks (WorkVouch Connect)

## Current implementation

- **Ingress:** `POST /api/integrations/v1/webhooks/greenhouse?connectionId=`
- **Verification:** Hookshot HMAC-SHA256 (`Signature: sha256=...`)
- **Secret:** `GREENHOUSE_WEBHOOK_SECRET`
- **Pipeline:** WebhookService → Event Store → Projection → Sync cursor timestamps

Existing webhook processor and fixtures are **preserved** in Sprint 12.

## Partner webhook model

| Question | Status |
|---|---|
| Partner programmatic registration API | **BLOCKED BY GREENHOUSE** — not verified |
| Partner payload schema vs Hookshot fixtures | **BLOCKED UNTIL SANDBOX** |
| Delivery retries / event IDs | **BLOCKED UNTIL SANDBOX** |

Do not invent partner webhook behavior. Validate against Greenhouse sandbox before claiming production webhook compatibility.

## Operational setup (current)

Webhook endpoints are configured manually in Greenhouse (Hookshot) pointing to WorkVouch ingress URL with shared secret.
