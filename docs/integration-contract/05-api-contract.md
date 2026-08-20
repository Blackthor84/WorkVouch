# 05 — API Contract

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation  
> **Namespace:** `/api/integrations/v1/` (WorkVouch) + Greenhouse Harvest API v1 (provider)

---

## WorkVouch Integration API

### Global Conventions

**Base URL:** `https://workvouch.com/api/integrations/v1`

**Authentication (employer endpoints):**
```
Cookie: sb-access-token={supabase_session}
```
Plus server-side verification: `getUser()` + employer account ownership.

**Authentication (webhooks):** Provider HMAC signature (see [04-webhook-contract.md](./04-webhook-contract.md)).

**Authentication (cron):**
```
Authorization: Bearer {CRON_SECRET}
```

**Authentication (admin):**
```
Cookie: sb-access-token={supabase_session}
```
Plus `requireAdminForApi()`.

**Content-Type:** `application/json`

**Error format:**
```json
{
  "error": {
    "code": "CONNECTION_NOT_FOUND",
    "message": "Human-readable message.",
    "provider": "greenhouse",
    "retryable": false,
    "docsUrl": "https://docs.workvouch.com/integrations/errors/CONNECTION_NOT_FOUND"
  }
}
```

---

## Endpoint Catalog

### POST /connect/{provider}

Initiate OAuth connection.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session (Org Admin) |
| **Headers** | `Content-Type: application/json` |
| **Body** | `{ "redirectUri": "https://workvouch.com/employer/settings/integrations/greenhouse/callback" }` |
| **Validation** | `provider` must be registered; no existing active connection |
| **Success (200)** | `{ "authorizationUrl": "https://...", "state": "csrf_token", "expiresAt": "2026-08-07T20:15:00Z" }` |
| **Failure (409)** | `{ "error": { "code": "ALREADY_CONNECTED" } }` |
| **Failure (403)** | `{ "error": { "code": "PERMISSION_DENIED" } }` |
| **Retry** | Safe to retry (idempotent if no active connection) |
| **Timeout** | 5s |

---

### GET /connect/{provider}/callback

OAuth callback (redirect from Greenhouse).

| Attribute | Value |
|-----------|-------|
| **Auth** | State token validation (CSRF) |
| **Query** | `code`, `state`, `error?` |
| **Validation** | State matches `ats_oauth_states`; not expired (15 min) |
| **Success** | Redirect 302 → `/employer/settings/integrations/greenhouse?connected=true` |
| **Failure** | Redirect 302 → `?error=access_denied` |
| **Retry** | User-initiated |
| **Timeout** | 10s (includes token exchange) |

---

### DELETE /disconnect/{provider}

Disconnect integration.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session (Org Admin) |
| **Body** | `{ "revokeToken": true }` |
| **Validation** | Active connection exists |
| **Success (200)** | `{ "success": true, "disconnectedAt": "2026-08-07T20:00:00Z" }` |
| **Failure (404)** | `{ "error": { "code": "CONNECTION_NOT_FOUND" } }` |
| **Retry** | Safe to retry |
| **Timeout** | 10s |

---

### GET /status

List all connections for employer.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Query** | None |
| **Success (200)** | `{ "connections": [ConnectionStatus] }` |
| **Pagination** | N/A (max 1 active connection per provider) |
| **Timeout** | 3s |

**ConnectionStatus schema:**
```typescript
{
  provider: "greenhouse",
  displayName: "Greenhouse",
  status: "connected" | "token_expired" | "error" | "disconnected" | "pending",
  providerAccountName: "Acme Corp",
  connectedAt: "2026-08-01T10:00:00Z",
  lastHealthCheckAt: "2026-08-07T19:00:00Z",
  lastHealthCheckStatus: "healthy",
  lastSyncAt: "2026-08-07T19:58:00Z",
  candidateMapCount: 847,
  pendingLinkCount: 12,
  supportedFeatures: ["oauth", "webhooks", "custom_fields", "candidate_sync"]
}
```

---

### POST /webhooks/{provider}

Receive inbound webhooks. See [04-webhook-contract.md](./04-webhook-contract.md).

| Attribute | Value |
|-----------|-------|
| **Auth** | HMAC signature |
| **Body** | Raw GH webhook JSON |
| **Success (200)** | `{ "received": true }` |
| **Failure (401)** | Invalid signature |
| **Failure (404)** | Unknown provider |
| **Timeout** | Must respond within 500ms |

---

### POST /sync

Trigger manual sync.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session (Org Admin) |
| **Body** | `{ "provider": "greenhouse", "syncType": "full" | "candidates" | "trust_export" | "verification_export" }` |
| **Validation** | Connection connected; no sync in progress |
| **Success (202)** | `{ "batchId": "uuid", "status": "queued", "estimatedItems": 847 }` |
| **Failure (409)** | `{ "error": { "code": "SYNC_IN_PROGRESS" } }` |
| **Rate limit** | 5 per hour per employer |
| **Timeout** | 5s (async processing) |

---

### GET /candidates

List mapped candidates.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Query** | `provider?, linkStatus?, page=1, pageSize=50` |
| **Success (200)** | `{ "items": [CandidateMapEntry], "page": 1, "totalCount": 847, "hasMore": true }` |
| **Pagination** | Offset-based; max pageSize 100 |
| **Rate limit** | 100/min |
| **Timeout** | 5s |

---

### POST /candidates/{profileId}/link

Manual link.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Body** | `{ "provider": "greenhouse", "externalCandidateId": "12345" }` |
| **Validation** | GH candidate exists (Harvest API lookup); profile not linked elsewhere |
| **Success (200)** | `{ "success": true, "mapping": CandidateMapEntry }` |
| **Failure (404)** | GH candidate not found |
| **Failure (409)** | Profile already linked to different GH candidate |
| **Rate limit** | 50/hour |
| **Timeout** | 10s |

---

### POST /candidates/{profileId}/export

Push trust/verification to GH.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Body** | `{ "provider": "greenhouse", "exportTypes": ["trust_score", "verification", "vouch_count"] }` |
| **Success (200)** | `{ "results": [{ "exportType": "trust_score", "success": true, "fieldsUpdated": ["workvouch_trust_score"] }] }` |
| **Failure (404)** | Not linked |
| **Rate limit** | 20/hour |
| **Timeout** | 15s |

---

### GET /health

Connection health.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Success (200)** | `{ "platform": "healthy", "connections": [ConnectionHealth] }` |
| **Timeout** | 10s (includes live GH ping) |

---

### GET /events

Event log.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Query** | `provider?, status?, eventType?, page=1, pageSize=50` |
| **Success (200)** | `{ "items": [AtsEventSummary], "page": 1, "totalCount": 100, "hasMore": false }` |
| **Pagination** | Offset-based |
| **Timeout** | 5s |

---

### POST /events/{eventId}/replay

Replay failed event.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session (Org Admin) |
| **Success (200)** | `{ "success": true, "eventId": "uuid", "status": "pending" }` |
| **Failure (400)** | Event not in replayable state |
| **Timeout** | 5s |

---

### GET /providers

Provider registry.

| Attribute | Value |
|-----------|-------|
| **Auth** | Employer session |
| **Success (200)** | `{ "providers": [AtsProviderSummary] }` |
| **Timeout** | 2s |

---

## Greenhouse Harvest API (Provider Contract)

### Authentication

```
Authorization: Basic {base64(api_token:)}
```
Or OAuth Bearer token (preferred for marketplace):
```
Authorization: Bearer {access_token}
```

### Rate Limits

| Limit | Value |
|-------|-------|
| Requests per 10 seconds | 50 |
| Requests per 10 minutes | 500 |
| On 429 | Respect `Retry-After` header |

**WorkVouch policy:** Adapter returns `RateLimitError` with `retryAfterMs`. Sync engine backs off accordingly.

---

### GET /v1/candidates/{id}

Fetch single candidate.

| Attribute | Value |
|-----------|-------|
| **Auth** | Bearer token |
| **Success (200)** | GH candidate object |
| **Failure (404)** | Candidate deleted → mark `external_deleted` |
| **Failure (401)** | Refresh token → retry once |
| **Timeout** | 10s |

---

### GET /v1/candidates

List candidates (paginated).

| Attribute | Value |
|-----------|-------|
| **Query** | `page=1, per_page=100, updated_after={iso8601}` |
| **Pagination** | Page-based; max 500 per page |
| **Timeout** | 30s |

---

### PATCH /v1/candidates/{id}

Update custom fields (trust export).

| Attribute | Value |
|-----------|-------|
| **Body** | `{ "custom_fields": [{ "name_key": "workvouch_trust_score", "value": 78 }] }` |
| **Success (200)** | Updated candidate |
| **Failure (422)** | Invalid custom field → log MAPPING_ERROR → DLQ |
| **Timeout** | 10s |

---

### POST /v1/candidates/{id}/activity_feed/notes

Add note (optional verification export).

| Attribute | Value |
|-----------|-------|
| **Body** | `{ "body": "WorkVouch verification completed.", "visibility": "public" }` |
| **Success (201)** | Note created |
| **Timeout** | 10s |

---

### GET /v1/jobs

List jobs.

| Attribute | Value |
|-----------|-------|
| **Query** | `page=1, per_page=100, status=open` |
| **Pagination** | Page-based |
| **Timeout** | 30s |

---

### GET /v1/users/me

Health check / token validation.

| Attribute | Value |
|-----------|-------|
| **Success (200)** | `{ "id": 123, "name": "API User" }` |
| **Failure (401)** | Token expired |
| **Timeout** | 5s |

---

### POST /v1/webhook_endpoints

Register webhooks (on connect).

| Attribute | Value |
|-----------|-------|
| **Body** | See [04-webhook-contract.md](./04-webhook-contract.md) |
| **Success (201)** | Webhook endpoint object |
| **Timeout** | 10s |

---

## Panel API (Embedded in Greenhouse)

### GET /api/integrations/v1/panel/{provider}/{externalCandidateId}

Serves embedded panel data for GH sidebar iframe.

| Attribute | Value |
|-----------|-------|
| **Auth** | Signed panel token (JWT, 15-min expiry) OR employer session |
| **Headers** | `X-Panel-Token: {jwt}` |
| **Success (200)** | PanelPayload (see below) |
| **Failure (404)** | Candidate not linked |
| **Cache** | 15 min server-side; `Cache-Control: private, max-age=60` |
| **Timeout** | 3s (cached) / 8s (fresh) |

**PanelPayload:**
```typescript
{
  linkStatus: "synced",
  trustScore: 78,
  trustBand: "Strong",
  verificationStatus: "verified",
  vouchCount: 5,
  verificationCount: 2,
  aiSummary: "Jane has 4 years verified...",
  aiSummaryGeneratedAt: "2026-08-07T19:00:00Z",
  employmentTimeline: [{ company: "Acme Corp", title: "Sr Engineer", verified: true, start: "2020-01", end: "2024-06" }],
  vouchSummary: { count: 5, avgRating: 4.6, wouldRehire: "yes", consensus: "strong" },
  syncStatus: { lastSyncedAt: "2026-08-07T19:58:00Z", status: "synced" },
  profileUrl: "https://workvouch.com/v/jane-chen",
  actions: { canRequestVerification: true, canSendReminder: true, canViewProfile: true }
}
```

---

## HTTP Status Code Reference

| Code | WorkVouch API | GH API | Meaning |
|------|--------------|--------|---------|
| 200 | Success | Success | |
| 201 | Created | Created | |
| 202 | Accepted (async) | — | Sync queued |
| 400 | Invalid input | — | |
| 401 | Invalid session/signature | Token expired | |
| 403 | Not employer/admin | Forbidden | |
| 404 | Not found | Candidate deleted | |
| 409 | Conflict | — | Already connected/linked |
| 422 | — | Invalid field | Mapping error |
| 429 | Rate limited | Rate limited | Retry with backoff |
| 500 | Internal error | GH server error | Retry |

---

## Retry Rules Summary

| Context | Retry | Max Attempts | Backoff |
|---------|-------|-------------|---------|
| GH API 429 | Yes | 5 | Retry-After header |
| GH API 5xx | Yes | 5 | 1s, 2s, 4s, 8s, 16s |
| GH API 401 | Refresh token + 1 retry | 2 | Immediate |
| GH API 404 | No | 0 | Mark external_deleted |
| WV sync queue | Yes | 5 | 1m, 5m, 15m, 1h, 4h |
| WV webhook receipt | No (return 200) | — | Internal retry |

---

## Related Documents

- [04-webhook-contract.md](./04-webhook-contract.md)
- [06-sync-contract.md](./06-sync-contract.md)
- [09-error-catalog.md](./09-error-catalog.md)
- [docs/integrations/09-api-design.md](../integrations/09-api-design.md)
