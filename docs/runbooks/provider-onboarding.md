# Provider Onboarding Guide

> **Sprint:** 3A  
> **Last updated:** 2026-08-07  
> **Audience:** Engineers adding Greenhouse, Lever, Ashby, or Workday

---

## Overview

Every ATS provider plugs into the same platform. The platform never contains provider-specific logic — only the adapter does.

**Sprint 3A delivered:** Platform + MockATS  
**Sprint 3B will deliver:** Greenhouse adapter (first production provider)

---

## Onboarding Process (All Providers)

### Phase 1: Design (before code)

1. Read `docs/integration-contract/02-field-mapping.md` for field mappings
2. Read `docs/integration-contract/04-webhook-contract.md` for webhook events
3. Create provider manifest (capabilities, rate limits, auth type)
4. Register OAuth app with provider developer portal
5. Add feature flag: `{PROVIDER}_ENABLED=false` (default off)

### Phase 2: Adapter implementation

Create `lib/integrations/providers/{provider}/`:

```
providers/greenhouse/
├── GreenhouseAdapter.ts      implements AtsProvider
├── manifest.ts               capabilities constants
├── webhook-parser.ts         normalize webhook payloads
├── types.ts                  provider-specific types (internal only)
└── index.ts                  exports registration factory
```

Implement all `AtsProvider` methods:

| Method | Greenhouse (Harvest API) | Lever | Ashby | Workday |
|--------|------------------------|-------|-------|---------|
| `connect()` | OAuth 2.0 + PKCE | OAuth 2.0 | OAuth 2.0 | OAuth 2.0 |
| `disconnect()` | Token revoke | Token revoke | Token revoke | Token revoke |
| `refreshToken()` | Refresh token | Refresh token | Refresh token | Refresh token |
| `healthCheck()` | GET /v1/users/me | GET /v1/me | GET /api/health | Custom |
| `syncCandidate()` | PATCH custom fields | PUT candidate | PATCH candidate | SOAP/REST |
| `syncJob()` | GET /v1/jobs | GET /v1/postings | GET /api/jobs | Custom |
| `syncApplication()` | GET applications | GET applications | GET applications | Custom |
| `receiveWebhook()` | HMAC-SHA256 | HMAC-SHA256 | HMAC-SHA256 | Polling fallback |
| `getCapabilities()` | From manifest | From manifest | From manifest | From manifest |
| `validateConfiguration()` | clientId, secret | clientId, secret | clientId, secret | tenant URL |
| `testConnection()` | healthCheck wrapper | healthCheck wrapper | healthCheck wrapper | healthCheck wrapper |

### Phase 3: Registration

```typescript
// lib/integrations/registry/ProviderLoader.ts (Sprint 3B)
import { createGreenhouseRegistration } from "../providers/greenhouse";

loadBuiltInProviders(): void {
  const registrations = [
    createMockAtsRegistration(),
    createGreenhouseRegistration(), // Sprint 3B
  ];
  // ...
}
```

### Phase 4: Configuration

Environment variables:

```bash
# Greenhouse
GREENHOUSE_CLIENT_ID=
GREENHOUSE_CLIENT_SECRET=
GREENHOUSE_WEBHOOK_SECRET=
GREENHOUSE_ENABLED=false

# Lever (V2)
LEVER_CLIENT_ID=
LEVER_CLIENT_SECRET=
LEVER_ENABLED=false

# Ashby (V3)
ASHBY_CLIENT_ID=
ASHBY_CLIENT_SECRET=
ASHBY_ENABLED=false

# Workday (V3)
WORKDAY_CLIENT_ID=
WORKDAY_CLIENT_SECRET=
WORKDAY_BASE_URL=
WORKDAY_ENABLED=false
```

### Phase 5: Testing

1. Unit tests: mock HTTP responses, test parser/normalizer
2. Contract tests: `AtsProvider` interface compliance
3. Sandbox E2E: real OAuth + webhook + sync against provider sandbox
4. Acceptance: marketplace demo scenarios

### Phase 6: API routes (Sprint 3B)

Routes live under `/api/integrations/v1/` — they call `IntegrationManager`, never the adapter directly:

```
POST /connect/{provider}
GET  /connect/{provider}/callback
POST /webhooks/{provider}
GET  /status
POST /sync
```

---

## Provider-Specific Notes

### Greenhouse (Sprint 3B)

- **Auth:** OAuth 2.0 + PKCE via `auth.greenhouse.io`
- **API:** Harvest API v1 (`/v1/candidates`, `/v1/jobs`)
- **Webhooks:** Register via `POST /v1/webhook_endpoints` on connect
- **Export:** PATCH candidate custom fields (`workvouch_trust_score`, etc.)
- **Panel:** Partner Sidebar Extension or custom field iframe
- **Rate limit:** 50 requests / 10 seconds
- **Docs:** `docs/integration-contract/` (complete)

### Lever (V2)

- **Auth:** OAuth 2.0
- **API:** REST API v1
- **Webhooks:** HMAC signature in `X-Lever-Signature`
- **Similar to Greenhouse:** Candidate sync + custom fields
- **Registration:** Add `createLeverRegistration()` to ProviderLoader

### Ashby (V3)

- **Auth:** OAuth 2.0
- **API:** Modern GraphQL/REST hybrid
- **Webhooks:** `Ashby-Signature` header
- **Note:** May require GraphQL client for some operations

### Workday (V3)

- **Auth:** OAuth 2.0 (tenant-specific)
- **Webhooks:** Limited — may require polling-only sync
- **Complexity:** Enterprise SOAP/REST; longer implementation (4–6 weeks)
- **Manifest:** Set `supportsWebhooks: false`; use cron polling

---

## Privacy Rules (All Providers)

- **Never export:** vouch text, reference names, verifier identity
- **Location:** country/state only
- **Trust engine:** read-only export; never recalculate during sync

---

## Checklist

Use [Provider Checklist](./provider-checklist.md) before marking provider complete.

---

## Related

- [Adding New Provider](./adding-new-provider.md)
- [Architecture](./architecture.md)
- [docs/decisions/ADR-010-how-future-ats-providers-will-be-added.md](../decisions/ADR-010-how-future-ats-providers-will-be-added.md)
- [docs/mvp/02-v1-v2-v3-roadmap.md](../mvp/02-v1-v2-v3-roadmap.md)
