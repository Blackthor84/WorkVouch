# 09 — API Design

> **Sprint:** Operation Greenhouse — Sprint 2 (Design Only)  
> **Last updated:** 2026-08-07  
> **Rule:** New APIs only under `/api/integrations/v1/` — do not modify existing routes

---

## Namespace

```
/api/integrations/v1/          ← All new integration APIs
/api/cron/ats-*                ← New cron endpoints (additive)
```

**Versioning:** `/v1/` in path. Breaking changes require `/v2/`.

---

## Authentication

All employer-facing endpoints require:
1. Valid Supabase session (`getUser()`)
2. Employer account ownership verification
3. `admin` Supabase client for DB access

Webhook endpoints: Provider signature verification only (no session).

Admin endpoints: `requireAdminForApi()`.

Cron endpoints: `CRON_SECRET` Bearer token.

---

## API Reference

### Connection Management

#### `POST /api/integrations/v1/connect/{provider}`

Initiate OAuth connection flow.

| | |
|---|---|
| **Auth** | Employer session |
| **Input** | `{ redirectUri?: string }` |
| **Output** | `{ authorizationUrl: string, state: string, expiresAt: string }` |
| **Errors** | 400 invalid provider, 409 already connected, 403 not employer |

---

#### `GET /api/integrations/v1/connect/{provider}/callback`

OAuth callback handler (redirect from provider).

| | |
|---|---|
| **Auth** | None (state-validated) |
| **Input** | Query: `code`, `state`, `error?` |
| **Output** | Redirect to `/employer/settings/integrations/{provider}?connected=true` |
| **Errors** | Redirect with `?error=access_denied` on failure |

---

#### `DELETE /api/integrations/v1/disconnect/{provider}`

Disconnect ATS provider.

| | |
|---|---|
| **Auth** | Employer session |
| **Input** | `{ revokeToken?: boolean }` (default true) |
| **Output** | `{ success: true, disconnectedAt: string }` |
| **Errors** | 404 no connection found |

---

#### `GET /api/integrations/v1/status`

List all connections for current employer.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `{ connections: ConnectionStatus[] }` |

```typescript
interface ConnectionStatus {
  provider: AtsProviderId
  displayName: string
  status: 'connected' | 'token_expired' | 'error' | 'disconnected' | 'pending'
  providerAccountName?: string
  connectedAt?: string
  lastHealthCheckAt?: string
  lastHealthCheckStatus?: 'healthy' | 'unhealthy'
  lastSyncAt?: string
  candidateMapCount: number
  pendingLinkCount: number
  supportedFeatures: AtsFeature[]
}
```

---

#### `GET /api/integrations/v1/status/{provider}`

Single provider connection status.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `ConnectionStatus` (same as above, single) |

---

### Webhooks

#### `POST /api/integrations/v1/webhooks/{provider}`

Receive inbound ATS webhooks.

| | |
|---|---|
| **Auth** | Provider signature verification |
| **Input** | Raw provider webhook payload |
| **Output** | `{ received: true }` (always 200 for valid webhooks) |
| **Errors** | 401 invalid signature, 404 unknown provider |

---

### Sync Operations

#### `POST /api/integrations/v1/sync`

Trigger manual sync for a connection.

| | |
|---|---|
| **Auth** | Employer session |
| **Input** | `{ provider: string, syncType: 'full' | 'candidates' | 'trust_export' | 'verification_export' }` |
| **Output** | `{ batchId: string, status: 'queued', estimatedItems: number }` |
| **Errors** | 404 no connection, 409 sync already in progress |

---

#### `POST /api/integrations/v1/sync/{entity}`

Entity-specific sync trigger.

| Entity | Path | Input |
|--------|------|-------|
| Candidates | `/sync/candidates` | `{ provider, externalCandidateId? }` |
| Jobs | `/sync/jobs` | `{ provider }` |
| Trust | `/sync/trust` | `{ provider, profileId? }` |
| Verification | `/sync/verification` | `{ provider, profileId? }` |

---

### Candidate Management

#### `GET /api/integrations/v1/candidates`

List mapped candidates for current employer.

| | |
|---|---|
| **Auth** | Employer session |
| **Query** | `provider?, linkStatus?, page?, pageSize?` |
| **Output** | `{ items: CandidateMapEntry[], page, totalCount, hasMore }` |

```typescript
interface CandidateMapEntry {
  id: string
  provider: AtsProviderId
  externalCandidateId: string
  externalApplicationId?: string
  workvouchProfileId?: string
  candidateEmail?: string
  candidateName?: string
  linkStatus: string
  linkMethod?: string
  applicationStatus?: string
  lastTrustExportAt?: string
  lastVerificationExportAt?: string
  linkedAt?: string
}
```

---

#### `GET /api/integrations/v1/candidates/{profileId}`

Sync status for a specific WorkVouch profile.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `{ linked: boolean, mappings: CandidateMapEntry[], lastSyncAt?: string }` |

---

#### `POST /api/integrations/v1/candidates/{profileId}/link`

Manually link a WorkVouch profile to an ATS candidate.

| | |
|---|---|
| **Auth** | Employer session |
| **Input** | `{ provider: string, externalCandidateId: string }` |
| **Output** | `{ success: true, mapping: CandidateMapEntry }` |
| **Errors** | 404 candidate not found in ATS, 409 already linked to different profile |

---

#### `POST /api/integrations/v1/candidates/{profileId}/export`

Push trust score and verification to ATS.

| | |
|---|---|
| **Auth** | Employer session |
| **Input** | `{ provider: string, exportTypes: ('trust_score' | 'verification' | 'vouch_count')[] }` |
| **Output** | `{ results: ExportResult[] }` |

```typescript
interface ExportResult {
  exportType: string
  success: boolean
  fieldsUpdated?: string[]
  error?: string
}
```

---

### Job Management

#### `GET /api/integrations/v1/jobs`

List mapped jobs for current employer.

| | |
|---|---|
| **Auth** | Employer session |
| **Query** | `provider?, status?, page?` |
| **Output** | `{ items: JobMapEntry[], page, totalCount, hasMore }` |

---

### Event Log

#### `GET /api/integrations/v1/events`

Paginated event log for employer.

| | |
|---|---|
| **Auth** | Employer session |
| **Query** | `provider?, status?, eventType?, page?, pageSize?` |
| **Output** | `{ items: AtsEventSummary[], page, totalCount, hasMore }` |

---

#### `POST /api/integrations/v1/events/{eventId}/replay`

Replay a failed or DLQ event.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `{ success: true, eventId: string, status: 'pending' }` |
| **Errors** | 404 event not found, 400 event not in replayable state |

---

### Health

#### `GET /api/integrations/v1/health`

Platform and connection health for current employer.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `{ platform: 'healthy', connections: ConnectionHealth[] }` |

```typescript
interface ConnectionHealth {
  provider: AtsProviderId
  status: 'healthy' | 'degraded' | 'unhealthy'
  latencyMs?: number
  lastCheckedAt?: string
  issues: string[]
  metrics: {
    eventsProcessedLast24h: number
    syncFailuresLast24h: number
    dlqCount: number
    pendingLinkCount: number
  }
}
```

---

### Admin

#### `GET /api/integrations/v1/admin/dlq`

List dead letter queue events (admin only).

| | |
|---|---|
| **Auth** | Admin guard |
| **Query** | `provider?, employerAccountId?, page?` |
| **Output** | `{ items: AtsEventSummary[], totalCount }` |

---

#### `POST /api/integrations/v1/admin/dlq/{eventId}/replay`

Admin replay of DLQ event.

| | |
|---|---|
| **Auth** | Admin guard |
| **Output** | `{ success: true }` |

---

### Provider Registry

#### `GET /api/integrations/v1/providers`

List available ATS providers and their status.

| | |
|---|---|
| **Auth** | Employer session |
| **Output** | `{ providers: AtsProviderSummary[] }` |

```typescript
interface AtsProviderSummary {
  providerId: AtsProviderId
  displayName: string
  logoUrl: string
  status: 'available' | 'coming_soon' | 'beta'
  supportedFeatures: AtsFeature[]
  docsUrl: string
}
```

---

## Cron Endpoints (New)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/cron/ats-process-events` | POST | CRON_SECRET | Process pending events |
| `/api/cron/ats-trust-export` | POST | CRON_SECRET | Export changed trust scores |
| `/api/cron/ats-verification-export` | POST | CRON_SECRET | Export verification statuses |
| `/api/cron/ats-candidate-sync` | POST | CRON_SECRET | Pull new ATS candidates |
| `/api/cron/ats-job-sync` | POST | CRON_SECRET | Pull job updates |
| `/api/cron/ats-retry-dlq` | POST | CRON_SECRET | Retry DLQ events |
| `/api/cron/ats-refresh-tokens` | POST | CRON_SECRET | Refresh OAuth tokens |
| `/api/cron/ats-health-check` | POST | CRON_SECRET | Provider health checks |
| `/api/cron/ats-cleanup-oauth-states` | POST | CRON_SECRET | Delete expired OAuth states |

---

## Error Response Format

All integration API errors follow a consistent format:

```json
{
  "error": {
    "code": "CONNECTION_NOT_FOUND",
    "message": "No active Greenhouse connection found for this employer account.",
    "provider": "greenhouse",
    "retryable": false,
    "docsUrl": "https://docs.workvouch.com/integrations/errors/CONNECTION_NOT_FOUND"
  }
}
```

| HTTP Status | When |
|-------------|------|
| 400 | Invalid input, unknown provider |
| 401 | Invalid session or webhook signature |
| 403 | Not employer account owner |
| 404 | Connection, candidate, or event not found |
| 409 | Already connected, sync in progress, already linked |
| 429 | Rate limit (internal) |
| 500 | Unexpected error (logged, alert sent) |

---

## Rate Limiting (Internal)

| Endpoint | Limit |
|----------|-------|
| `POST /sync` | 5 per hour per employer |
| `POST /candidates/{id}/export` | 20 per hour per employer |
| `POST /candidates/{id}/link` | 50 per hour per employer |
| `GET /candidates` | 100 per minute per employer |
| Webhook endpoints | No limit (provider-controlled) |

---

## Related Documents

- [03-provider-interface.md](./03-provider-interface.md)
- [06-oauth-design.md](./06-oauth-design.md)
- [10-ui-specification.md](./10-ui-specification.md)
- [docs/architecture/04-api-map.md](../architecture/04-api-map.md)
