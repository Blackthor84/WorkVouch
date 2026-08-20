# Greenhouse Provider — Future Work

## Sprint 3B-2 — Persistence

- `ats_connections` table migration
- Database-backed `TokenStore` and `OAuthStateStore`
- Connection lifecycle API routes

## Sprint 3B-3 — Webhooks

- `receiveWebhook()` implementation
- Signature validation with `GREENHOUSE_WEBHOOK_SECRET`
- Event normalization and platform event dispatch

## Sprint 3B-4 — Sync

- `syncCandidate()`, `syncJob()`, `syncApplication()`
- Field mapping layer
- Idempotency and conflict resolution
- Dead letter queue integration for sync failures

## Sprint 3B-5 — Employer Experience

- Connect/disconnect UI in employer settings
- Connection health dashboard
- Manual sync triggers

## Platform

- Lever provider (copy Greenhouse folder pattern)
- Provider marketplace listing
- Observability dashboards for Greenhouse-specific metrics
