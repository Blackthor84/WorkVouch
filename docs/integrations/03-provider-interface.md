# 03 — Provider Interface Contract

> **Sprint:** Operation Greenhouse — Sprint 2 (Design Only)  
> **Last updated:** 2026-08-07

---

## Overview

Every ATS provider implements the **`AtsProvider`** interface. The integration platform interacts exclusively through this contract — never with provider-specific code outside the adapter.

Adding a new provider = implement `AtsProvider` + register in `ProviderRegistry`. No changes to Sync Engine, Event Bus, or API routes.

---

## Interface Definition (Design Specification)

```typescript
// lib/integrations/providers/base/AtsProvider.ts
// DESIGN SPECIFICATION ONLY — not production code

interface AtsProvider {
  // ─── Identity ───────────────────────────────────────────────
  readonly providerId: AtsProviderId
  readonly displayName: string
  readonly supportedFeatures: AtsFeature[]

  // ─── Connection Lifecycle ────────────────────────────────────
  connect(params: ConnectParams): Promise<ConnectResult>
  disconnect(params: DisconnectParams): Promise<void>
  refreshToken(params: RefreshTokenParams): Promise<TokenPair>
  healthCheck(params: HealthCheckParams): Promise<HealthCheckResult>

  // ─── Data Retrieval ──────────────────────────────────────────
  getJobs(params: GetJobsParams): Promise<PaginatedResult<CanonicalJob>>
  getCandidates(params: GetCandidatesParams): Promise<PaginatedResult<CanonicalCandidate>>
  getCandidate(params: GetCandidateParams): Promise<CanonicalCandidate>
  getApplications(params: GetApplicationsParams): Promise<PaginatedResult<CanonicalApplication>>

  // ─── Data Sync (Outbound — WorkVouch → ATS) ─────────────────
  syncCandidate(params: SyncCandidateParams): Promise<SyncResult>
  syncJob(params: SyncJobParams): Promise<SyncResult>
  sendStatus(params: SendStatusParams): Promise<SendStatusResult>

  // ─── Webhooks ────────────────────────────────────────────────
  verifyWebhook(params: VerifyWebhookParams): boolean
  parseWebhookEvent(raw: unknown): ParsedWebhookEvent

  // ─── Custom Fields / Notes ───────────────────────────────────
  upsertCustomFields(params: UpsertCustomFieldsParams): Promise<void>
  addNote(params: AddNoteParams): Promise<void>
}
```

---

## Type Definitions

### Provider Identity

```typescript
type AtsProviderId =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workday'
  | 'bamboohr'
  | 'rippling'
  | 'hibob'
  | 'icims'
  | 'smartrecruiters'

type AtsFeature =
  | 'oauth'
  | 'webhooks'
  | 'candidate_sync'
  | 'job_sync'
  | 'custom_fields'
  | 'notes'
  | 'application_status'
  | 'bulk_export'
```

---

### Connection Types

```typescript
interface ConnectParams {
  employerAccountId: string
  redirectUri: string
  state: string           // CSRF token
  codeVerifier?: string   // PKCE
}

interface ConnectResult {
  connectionId: string
  status: 'connected' | 'pending_webhook_setup'
  providerAccountId?: string
  providerAccountName?: string
  scopes: string[]
  expiresAt?: string
  webhookSetupUrl?: string  // Some providers require manual webhook registration
}

interface DisconnectParams {
  connectionId: string
  employerAccountId: string
  revokeToken: boolean    // Call provider revoke endpoint
}

interface RefreshTokenParams {
  connectionId: string
  refreshToken: string    // Decrypted by TokenStore before passing here
}

interface TokenPair {
  accessToken: string
  refreshToken?: string
  expiresAt: string
  scopes: string[]
}

interface HealthCheckParams {
  connectionId: string
  accessToken: string
}

interface HealthCheckResult {
  healthy: boolean
  latencyMs: number
  providerAccountName?: string
  error?: string
  checkedAt: string
}
```

---

### Data Retrieval Types

```typescript
interface GetJobsParams {
  connectionId: string
  accessToken: string
  status?: 'open' | 'closed' | 'all'
  page?: number
  pageSize?: number       // Default 50, max 100
  updatedSince?: string   // ISO 8601 — incremental sync
}

interface GetCandidatesParams {
  connectionId: string
  accessToken: string
  jobId?: string          // Filter by job
  email?: string          // Lookup by email
  page?: number
  pageSize?: number
  updatedSince?: string
}

interface GetCandidateParams {
  connectionId: string
  accessToken: string
  externalCandidateId: string
}

interface GetApplicationsParams {
  connectionId: string
  accessToken: string
  jobId?: string
  candidateId?: string
  status?: string
  page?: number
  updatedSince?: string
}

interface PaginatedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount?: number
  hasMore: boolean
  nextPage?: number
}
```

---

### Canonical Schema Types

```typescript
interface CanonicalCandidate {
  externalCandidateId: string
  externalApplicationId?: string
  email: string
  fullName: string
  firstName?: string
  lastName?: string
  phone?: string
  applicationStatus?: ApplicationStatus
  jobExternalId?: string
  appliedAt?: string
  metadata: Record<string, unknown>   // Provider-specific passthrough
}

interface CanonicalJob {
  externalJobId: string
  title: string
  status: 'open' | 'closed' | 'draft' | 'archived'
  department?: string
  location?: CanonicalLocation
  openedAt?: string
  closedAt?: string
  metadata: Record<string, unknown>
}

interface CanonicalLocation {
  country: string           // ISO-2 required
  state?: string            // Required if country === 'US'
  // NO city, zip, lat/lng per location safety rules
}

interface CanonicalApplication {
  externalApplicationId: string
  externalCandidateId: string
  externalJobId: string
  status: ApplicationStatus
  appliedAt?: string
  updatedAt?: string
}

type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'unknown'
```

---

### Sync Types (Outbound)

```typescript
interface SyncCandidateParams {
  connectionId: string
  accessToken: string
  externalCandidateId: string
  workvouchProfileId: string
  trustExport?: CanonicalTrustExport
  verificationExport?: CanonicalVerificationExport
}

interface SyncJobParams {
  connectionId: string
  accessToken: string
  externalJobId: string
  workvouchJobPostingId?: string
}

interface SendStatusParams {
  connectionId: string
  accessToken: string
  externalCandidateId: string
  statusType: 'trust_score_updated' | 'verification_completed' | 'verification_requested'
  payload: CanonicalTrustExport | CanonicalVerificationExport
}

interface CanonicalTrustExport {
  trustScore: number              // 0-100 integer
  trustBand: string               // Low | Moderate | Strong | Exceptional
  verificationCount: number
  vouchCount: number
  profileUrl: string              // Public WorkVouch profile URL
  lastCalculatedAt: string        // ISO 8601
}

interface CanonicalVerificationExport {
  status: 'pending' | 'verified' | 'disputed' | 'none'
  verifiedEmployerCount: number
  lastVerifiedAt?: string
  employmentRecords: Array<{
    companyName: string
    jobTitle: string
    startDate: string
    endDate?: string
    verified: boolean
  }>
}

interface SyncResult {
  success: boolean
  externalId: string
  operation: 'create' | 'update' | 'skip'
  fieldsUpdated?: string[]
  error?: IntegrationError
  durationMs: number
}

interface SendStatusResult {
  success: boolean
  method: 'custom_field' | 'note' | 'tag'
  externalReferenceId?: string
  error?: IntegrationError
}
```

---

### Webhook Types

```typescript
interface VerifyWebhookParams {
  rawBody: string             // Unparsed request body
  headers: Record<string, string>
  webhookSecret: string         // Decrypted from ats_connections
}

interface ParsedWebhookEvent {
  eventId: string               // Provider's unique event ID (for dedup)
  eventType: string             // Normalized event type (see 04-event-system.md)
  provider: AtsProviderId
  externalCandidateId?: string
  externalJobId?: string
  externalApplicationId?: string
  payload: Record<string, unknown>  // Normalized payload
  receivedAt: string
}

interface UpsertCustomFieldsParams {
  connectionId: string
  accessToken: string
  externalCandidateId: string
  fields: Record<string, string | number | boolean>
}

interface AddNoteParams {
  connectionId: string
  accessToken: string
  externalCandidateId: string
  note: string
  visibility?: 'public' | 'private'
}
```

---

## Method Specifications

### `connect(params)`

**Purpose:** Initiate or complete OAuth connection.

**Flow:**
1. If no `code` in params → return authorization URL
2. If `code` present → exchange for tokens
3. Store encrypted tokens in `ats_connections`
4. Register webhook (if provider supports programmatic registration)
5. Return `ConnectResult`

**Errors:** `ProviderAuthError`, `ProviderConfigError`

---

### `disconnect(params)`

**Purpose:** Revoke connection and clean up.

**Flow:**
1. Optionally call provider token revoke endpoint
2. Mark `ats_connections.status = 'disconnected'`
3. Zero out encrypted token fields
4. Do NOT delete `ats_candidate_map` records (audit trail)

---

### `refreshToken(params)`

**Purpose:** Refresh expired access token.

**Called by:** `TokenRefreshWorker` (proactive) or `RetryService` (reactive on 401)

**Returns:** New `TokenPair` — caller updates `ats_connections`

---

### `getJobs(params)` / `getCandidates(params)`

**Purpose:** Paginated retrieval for sync operations.

**Rate limit:** Adapter must respect provider rate limits. Return `RateLimitError` with `retryAfterMs` on 429.

**Location rule:** Strip city/zip/coordinates from location data. Return country/state only.

---

### `syncCandidate(params)`

**Purpose:** Push WorkVouch data to ATS candidate record.

**Implementation (Greenhouse):**
1. Upsert custom fields: `workvouch_trust_score`, `workvouch_trust_band`, `workvouch_profile_url`
2. Optionally add note with verification summary
3. Return `SyncResult`

**Rule:** Read trust data from `trust_scores` table only. Never recalculate.

---

### `verifyWebhook(params)`

**Purpose:** Validate inbound webhook authenticity.

**Returns:** `boolean` — false causes immediate 401 response, no processing.

**Greenhouse:** HMAC-SHA256 of body with webhook secret, compare to `Signature` header.

---

### `parseWebhookEvent(raw)`

**Purpose:** Normalize provider-specific webhook payload to `ParsedWebhookEvent`.

**Rule:** Must extract `eventId` for deduplication. Must map provider event names to canonical event types.

---

### `healthCheck(params)`

**Purpose:** Verify connection is alive and token is valid.

**Called by:** `/api/integrations/v1/health` and daily cron.

**Returns:** `{ healthy: false }` triggers employer notification and status badge update.

---

## Provider Registry

```typescript
// Design specification only
class ProviderRegistry {
  static get(providerId: AtsProviderId): AtsProvider
  static list(): AtsProviderSummary[]
  static isSupported(providerId: string): boolean
}

interface AtsProviderSummary {
  providerId: AtsProviderId
  displayName: string
  logoUrl: string
  supportedFeatures: AtsFeature[]
  status: 'available' | 'coming_soon' | 'beta'
  docsUrl: string
}
```

**Registration (at app startup):**
```
ProviderRegistry.register('greenhouse', GreenhouseAdapter)
ProviderRegistry.register('mock', MockAtsAdapter)  // test only
// Future: ProviderRegistry.register('lever', LeverAdapter)
```

---

## Greenhouse Adapter Feature Matrix

| Method | Greenhouse implementation | Sprint |
|--------|--------------------------|--------|
| `connect()` | OAuth 2.0 via Harvest API | Sprint 3 |
| `disconnect()` | Token revoke | Sprint 3 |
| `refreshToken()` | Refresh token flow | Sprint 3 |
| `healthCheck()` | GET /v1/users/me | Sprint 3 |
| `getCandidates()` | GET /v1/candidates | Sprint 4 |
| `getCandidate()` | GET /v1/candidates/{id} | Sprint 4 |
| `getJobs()` | GET /v1/jobs | Sprint 5 |
| `syncCandidate()` | PATCH custom fields | Sprint 3 |
| `sendStatus()` | POST /v1/candidates/{id}/activity_feed/notes | Sprint 4 |
| `verifyWebhook()` | HMAC-SHA256 signature | Sprint 3 |
| `parseWebhookEvent()` | Map GH event types | Sprint 3 |
| `upsertCustomFields()` | PATCH /v1/candidates/{id} | Sprint 3 |
| `addNote()` | POST activity feed notes | Sprint 4 |

---

## Error Hierarchy

```typescript
class IntegrationError extends Error {
  code: IntegrationErrorCode
  provider?: AtsProviderId
  retryable: boolean
  retryAfterMs?: number
}

type IntegrationErrorCode =
  | 'PROVIDER_AUTH_ERROR'       // 401/403 — refresh token or alert
  | 'PROVIDER_RATE_LIMIT'       // 429 — retry with backoff
  | 'PROVIDER_SERVER_ERROR'     // 5xx — retry
  | 'PROVIDER_NOT_FOUND'        // 404 — do not retry
  | 'MAPPING_ERROR'             // Schema mismatch — DLQ immediately
  | 'CONNECTION_NOT_FOUND'      // No ats_connections row
  | 'CONNECTION_DISCONNECTED'   // Status != connected
  | 'SYNC_CONFLICT'             // Conflict resolution needed
  | 'WEBHOOK_INVALID_SIGNATURE' // Reject webhook
  | 'WEBHOOK_DUPLICATE'         // Already processed — skip silently
  | 'TOKEN_ENCRYPTION_ERROR'    // Internal — alert ops
```

---

## Testing Contract

Every provider adapter must pass the **`AtsProviderContractTest`** suite:

```
✓ connect() returns valid ConnectResult
✓ disconnect() marks connection disconnected
✓ refreshToken() returns new TokenPair
✓ verifyWebhook() rejects invalid signature
✓ verifyWebhook() accepts valid signature
✓ parseWebhookEvent() extracts eventId
✓ syncCandidate() calls upsertCustomFields
✓ healthCheck() returns healthy with valid token
✓ getCandidates() returns PaginatedResult
✓ Rate limit error includes retryAfterMs
```

Run against `MockAtsAdapter` in CI. Run against Greenhouse sandbox in staging.

---

## Related Documents

- [04-event-system.md](./04-event-system.md)
- [05-sync-engine.md](./05-sync-engine.md)
- [06-oauth-design.md](./06-oauth-design.md)
- [13-provider-roadmap.md](./13-provider-roadmap.md)
