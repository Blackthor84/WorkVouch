# 09 — Error Catalog

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Error Response Format

All integration errors use this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-facing message",
    "developerMessage": "Technical detail for logs",
    "provider": "greenhouse",
    "retryable": true,
    "retryAfterMs": 60000,
    "docsUrl": "https://docs.workvouch.com/integrations/errors/ERROR_CODE"
  }
}
```

---

## Severity Levels

| Level | Definition | Response Time | Alert |
|-------|-----------|---------------|-------|
| **P0 Critical** | Integration down; data loss risk | Immediate | Email + PagerDuty |
| **P1 High** | Feature broken; workaround exists | <1 hour | Email + in-app |
| **P2 Medium** | Degraded; auto-recovery expected | <4 hours | In-app |
| **P3 Low** | Informational; no user impact | Next business day | Log only |

---

## OAuth Errors

### OAUTH_ACCESS_DENIED

| Attribute | Value |
|-----------|-------|
| **Cause** | User declined OAuth consent |
| **User Message** | "Greenhouse connection was cancelled. You can try again anytime." |
| **Developer Message** | `OAuth callback error=access_denied` |
| **Recovery** | User re-initiates connect flow |
| **Severity** | P3 |
| **Logging** | Info level; no alert |

---

### OAUTH_STATE_MISMATCH

| Attribute | Value |
|-----------|-------|
| **Cause** | CSRF state token invalid or expired (>15 min) |
| **User Message** | "Connection session expired. Please try connecting again." |
| **Developer Message** | `OAuth state mismatch: expected={x}, received={y}` |
| **Recovery** | Re-initiate connect flow |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### OAUTH_TOKEN_EXCHANGE_FAILED

| Attribute | Value |
|-----------|-------|
| **Cause** | GH token endpoint returned error |
| **User Message** | "Unable to complete Greenhouse connection. Please try again." |
| **Developer Message** | `Token exchange failed: {gh_error_code} {gh_error_description}` |
| **Recovery** | Retry connect; if persistent, check GH app credentials |
| **Severity** | P1 |
| **Logging** | Error level; alert if 3+ in 1 hour |

---

### OAUTH_TOKEN_EXPIRED

| Attribute | Value |
|-----------|-------|
| **Cause** | Refresh token invalid or expired |
| **User Message** | "Your Greenhouse session has expired. Reconnect to resume syncing." |
| **Developer Message** | `Token refresh returned 401 for connection {id}` |
| **Recovery** | Admin clicks "Reconnect Greenhouse" |
| **Severity** | P0 |
| **Logging** | Error level; immediate admin notification |

---

### OAUTH_INVALID_CLIENT

| Attribute | Value |
|-----------|-------|
| **Cause** | GH client ID/secret misconfigured |
| **User Message** | "Integration configuration error. Contact WorkVouch support." |
| **Developer Message** | `OAuth invalid_client: check GH_CLIENT_ID and GH_CLIENT_SECRET` |
| **Recovery** | Fix environment variables; ops intervention |
| **Severity** | P0 |
| **Logging** | Error level; immediate ops alert |

---

## Webhook Errors

### WEBHOOK_INVALID_SIGNATURE

| Attribute | Value |
|-----------|-------|
| **Cause** | HMAC verification failed |
| **User Message** | N/A (provider-facing: 401 response) |
| **Developer Message** | `Webhook signature mismatch for provider=greenhouse` |
| **Recovery** | Verify webhook secret matches GH endpoint config |
| **Severity** | P1 (if rate >1%) |
| **Logging** | Warn level; count metric |

---

### WEBHOOK_DUPLICATE

| Attribute | Value |
|-----------|-------|
| **Cause** | Event ID already processed |
| **User Message** | N/A (200 response, silent skip) |
| **Developer Message** | `Duplicate webhook: {eventId}` |
| **Recovery** | None needed |
| **Severity** | P3 |
| **Logging** | Debug level |

---

### WEBHOOK_PARSE_ERROR

| Attribute | Value |
|-----------|-------|
| **Cause** | Payload doesn't match expected schema |
| **User Message** | N/A (200 response) |
| **Developer Message** | `Webhook parse failed: {validation_errors}` |
| **Recovery** | Check GH webhook version; update adapter |
| **Severity** | P2 (if rate >5%) |
| **Logging** | Error level; store raw payload |

---

### WEBHOOK_NO_CONNECTION

| Attribute | Value |
|-----------|-------|
| **Cause** | No active connection for GH organization ID |
| **User Message** | N/A (200 response) |
| **Developer Message** | `No connection for provider_account_id={id}` |
| **Recovery** | Employer must connect; or fix org ID mapping |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### WEBHOOK_PROCESSING_FAILED

| Attribute | Value |
|-----------|-------|
| **Cause** | Internal processing error after valid receipt |
| **User Message** | N/A (200 already returned) |
| **Developer Message** | `Webhook processing failed: {error}` |
| **Recovery** | Auto-retry → DLQ → admin replay |
| **Severity** | P1 (if rate >10%) |
| **Logging** | Error level |

---

## API Errors (WorkVouch Integration API)

### CONNECTION_NOT_FOUND

| Attribute | Value |
|-----------|-------|
| **Cause** | No active connection for provider |
| **User Message** | "Greenhouse is not connected. Connect in Settings → Integrations." |
| **Developer Message** | `No ats_connections row for employer={id}, provider=greenhouse` |
| **Recovery** | Connect Greenhouse |
| **Severity** | P2 |
| **Logging** | Info level |

---

### ALREADY_CONNECTED

| Attribute | Value |
|-----------|-------|
| **Cause** | Active connection already exists |
| **User Message** | "Greenhouse is already connected." |
| **Developer Message** | `Connection already active: {connectionId}` |
| **Recovery** | Use existing connection or disconnect first |
| **Severity** | P3 |
| **Logging** | Info level |

---

### SYNC_IN_PROGRESS

| Attribute | Value |
|-----------|-------|
| **Cause** | Batch sync already running |
| **User Message** | "A sync is already in progress. Please wait." |
| **Developer Message** | `Active batch: {batchId}` |
| **Recovery** | Wait for completion; check status endpoint |
| **Severity** | P3 |
| **Logging** | Info level |

---

### CANDIDATE_NOT_FOUND

| Attribute | Value |
|-----------|-------|
| **Cause** | GH candidate ID not found via Harvest API |
| **User Message** | "Candidate not found in Greenhouse." |
| **Developer Message** | `GH GET /v1/candidates/{id} returned 404` |
| **Recovery** | Mark external_deleted; manual unlink |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### PROFILE_ALREADY_LINKED

| Attribute | Value |
|-----------|-------|
| **Cause** | WV profile linked to different GH candidate |
| **User Message** | "This profile is already linked to a different Greenhouse candidate." |
| **Developer Message** | `Profile {profileId} linked to GH {existingId}, attempted {newId}` |
| **Recovery** | Unlink first, then re-link |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### PERMISSION_DENIED

| Attribute | Value |
|-----------|-------|
| **Cause** | User lacks required role |
| **User Message** | "You don't have permission to manage integrations." |
| **Developer Message** | `User {userId} lacks org_admin role for employer {id}` |
| **Recovery** | Contact organization admin |
| **Severity** | P3 |
| **Logging** | Info level |

---

## Sync Errors

### SYNC_PROVIDER_AUTH_ERROR

| Attribute | Value |
|-----------|-------|
| **Cause** | GH API returned 401 during sync |
| **User Message** | "Greenhouse session expired. Reconnect to resume." |
| **Developer Message** | `GH API 401 on {endpoint}; token refresh {result}` |
| **Recovery** | Auto token refresh → retry once → reconnect if fails |
| **Severity** | P0 |
| **Logging** | Error level |

---

### SYNC_PROVIDER_RATE_LIMIT

| Attribute | Value |
|-----------|-------|
| **Cause** | GH API returned 429 |
| **User Message** | N/A (background retry) |
| **Developer Message** | `GH API 429; Retry-After={seconds}` |
| **Recovery** | Backoff per Retry-After header |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### SYNC_PROVIDER_SERVER_ERROR

| Attribute | Value |
|-----------|-------|
| **Cause** | GH API returned 5xx |
| **User Message** | N/A (background retry) |
| **Developer Message** | `GH API {status} on {endpoint}` |
| **Recovery** | Exponential backoff, max 5 attempts |
| **Severity** | P2 |
| **Logging** | Error level |

---

### SYNC_MAPPING_ERROR

| Attribute | Value |
|-----------|-------|
| **Cause** | Custom field not found or invalid type in GH |
| **User Message** | "Sync configuration error. Contact support." |
| **Developer Message** | `GH PATCH custom_fields failed: {field} {error}` |
| **Recovery** | Re-create custom fields; immediate DLQ (no retry) |
| **Severity** | P1 |
| **Logging** | Error level |

---

### SYNC_NO_LINK

| Attribute | Value |
|-----------|-------|
| **Cause** | Export attempted for unlinked candidate |
| **User Message** | "Candidate not linked to WorkVouch." |
| **Developer Message** | `Export skipped: link_status={status}` |
| **Recovery** | Link candidate first |
| **Severity** | P3 |
| **Logging** | Info level |

---

### SYNC_CONFLICT

| Attribute | Value |
|-----------|-------|
| **Cause** | Ambiguous email match or duplicate link |
| **User Message** | "Manual review required for this candidate." |
| **Developer Message** | `Link conflict: {details}` |
| **Recovery** | Manual link/unlink in dashboard |
| **Severity** | P2 |
| **Logging** | Warn level |

---

## Validation Errors

### VALIDATION_INVALID_EMAIL

| Attribute | Value |
|-----------|-------|
| **Cause** | Email format invalid or missing for auto-link |
| **User Message** | "Invalid email address." |
| **Developer Message** | `Email validation failed: {email}` |
| **Recovery** | Fix email in GH; manual link |
| **Severity** | P3 |
| **Logging** | Info level |

---

### VALIDATION_INVALID_LOCATION

| Attribute | Value |
|-----------|-------|
| **Cause** | US location missing state |
| **User Message** | N/A (silent drop) |
| **Developer Message** | `Location dropped: country=US, state=null` |
| **Recovery** | None; record not persisted |
| **Severity** | P3 |
| **Logging** | Debug level |

---

### VALIDATION_INVALID_PROVIDER

| Attribute | Value |
|-----------|-------|
| **Cause** | Unknown provider ID in API request |
| **User Message** | "Integration provider not supported." |
| **Developer Message** | `Unknown provider: {id}` |
| **Recovery** | Use valid provider ID |
| **Severity** | P3 |
| **Logging** | Info level |

---

## Network Errors

### NETWORK_TIMEOUT

| Attribute | Value |
|-----------|-------|
| **Cause** | GH API or WV API call exceeded timeout |
| **User Message** | "Request timed out. Showing cached data." (panel) |
| **Developer Message** | `Timeout after {ms}ms on {endpoint}` |
| **Recovery** | Auto-retry; panel shows stale badge |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### NETWORK_UNREACHABLE

| Attribute | Value |
|-----------|-------|
| **Cause** | DNS or connection failure to GH API |
| **User Message** | "Unable to reach Greenhouse. Retrying..." |
| **Developer Message** | `Network error: {details}` |
| **Recovery** | Exponential backoff retry |
| **Severity** | P1 (if persistent >5 min) |
| **Logging** | Error level |

---

## Duplicate Records

### DUPLICATE_CANDIDATE_EMAIL

| Attribute | Value |
|-----------|-------|
| **Cause** | Multiple WV profiles match GH email |
| **User Message** | "Multiple profiles match this email. Manual review required." |
| **Developer Message** | `Ambiguous email match: {email} → {count} profiles` |
| **Recovery** | Manual link in dashboard |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### DUPLICATE_GH_CANDIDATE_ID

| Attribute | Value |
|-----------|-------|
| **Cause** | GH candidate ID already mapped |
| **User Message** | N/A (silent skip) |
| **Developer Message** | `Duplicate external_candidate_id: {id}` |
| **Recovery** | None; upsert skipped |
| **Severity** | P3 |
| **Logging** | Debug level |

---

## Missing Records

### MISSING_CANDIDATE

| Attribute | Value |
|-----------|-------|
| **Cause** | GH candidate deleted or not found |
| **User Message** | "Candidate removed from Greenhouse." |
| **Developer Message** | `GH candidate {id} returned 404` |
| **Recovery** | Mark external_deleted |
| **Severity** | P2 |
| **Logging** | Warn level |

---

### MISSING_JOB

| Attribute | Value |
|-----------|-------|
| **Cause** | GH job not found for application |
| **User Message** | N/A (automation proceeds without job filter) |
| **Developer Message** | `GH job {id} not found` |
| **Recovery** | Skip job filter; log warning |
| **Severity** | P3 |
| **Logging** | Warn level |

---

### MISSING_PROFILE

| Attribute | Value |
|-----------|-------|
| **Cause** | WV profile not found for export |
| **User Message** | "WorkVouch profile not found." |
| **Developer Message** | `Profile {id} not found in profiles table` |
| **Recovery** | Skip export; log reason |
| **Severity** | P3 |
| **Logging** | Info level |

---

## Error Code Index

| Code | Category | Retryable | Severity |
|------|----------|-----------|----------|
| OAUTH_ACCESS_DENIED | OAuth | No | P3 |
| OAUTH_STATE_MISMATCH | OAuth | No | P2 |
| OAUTH_TOKEN_EXCHANGE_FAILED | OAuth | Yes | P1 |
| OAUTH_TOKEN_EXPIRED | OAuth | No | P0 |
| OAUTH_INVALID_CLIENT | OAuth | No | P0 |
| WEBHOOK_INVALID_SIGNATURE | Webhook | No | P1 |
| WEBHOOK_DUPLICATE | Webhook | No | P3 |
| WEBHOOK_PARSE_ERROR | Webhook | No | P2 |
| WEBHOOK_NO_CONNECTION | Webhook | No | P2 |
| WEBHOOK_PROCESSING_FAILED | Webhook | Yes | P1 |
| CONNECTION_NOT_FOUND | API | No | P2 |
| ALREADY_CONNECTED | API | No | P3 |
| SYNC_IN_PROGRESS | API | No | P3 |
| CANDIDATE_NOT_FOUND | API | No | P2 |
| PROFILE_ALREADY_LINKED | API | No | P2 |
| PERMISSION_DENIED | API | No | P3 |
| SYNC_PROVIDER_AUTH_ERROR | Sync | Yes | P0 |
| SYNC_PROVIDER_RATE_LIMIT | Sync | Yes | P2 |
| SYNC_PROVIDER_SERVER_ERROR | Sync | Yes | P2 |
| SYNC_MAPPING_ERROR | Sync | No | P1 |
| SYNC_NO_LINK | Sync | No | P3 |
| SYNC_CONFLICT | Sync | No | P2 |
| VALIDATION_INVALID_EMAIL | Validation | No | P3 |
| VALIDATION_INVALID_LOCATION | Validation | No | P3 |
| NETWORK_TIMEOUT | Network | Yes | P2 |
| NETWORK_UNREACHABLE | Network | Yes | P1 |
| DUPLICATE_CANDIDATE_EMAIL | Duplicate | No | P2 |
| MISSING_CANDIDATE | Missing | No | P2 |
| MISSING_PROFILE | Missing | No | P3 |

---

## Related Documents

- [04-webhook-contract.md](./04-webhook-contract.md)
- [05-api-contract.md](./05-api-contract.md)
- [06-sync-contract.md](./06-sync-contract.md)
- [docs/product-experience/12-error-handling.md](../product-experience/12-error-handling.md)
