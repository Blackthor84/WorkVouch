# 11 — Testing Matrix

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Testing Pyramid

```
                    ┌─────────┐
                    │  E2E /  │
                    │Acceptance│  ← 10 scenarios
                   ┌┴─────────┴┐
                   │ Integration │  ← 40 scenarios
                  ┌┴───────────┴┐
                  │   Contract   │  ← 30 scenarios
                 ┌┴─────────────┴┐
                 │     Unit       │  ← 80+ scenarios
                 └───────────────┘
```

---

## Unit Tests

### Provider Adapter (GreenhouseAdapter)

| ID | Test | Input | Expected |
|----|------|-------|----------|
| U-001 | verifyWebhook valid signature | Valid HMAC body + secret | `true` |
| U-002 | verifyWebhook invalid signature | Tampered body | `false` |
| U-003 | verifyWebhook timing-safe compare | Equal digests | `true` (no timing leak) |
| U-004 | parseWebhookEvent candidate_created | GH payload | Normalized event with eventId |
| U-005 | parseWebhookEvent application_updated | GH payload | Stage extracted |
| U-006 | parseWebhookEvent missing id | Invalid payload | Throws parse error |
| U-007 | getCandidates pagination | page=1, per_page=100 | PaginatedResult with hasMore |
| U-008 | getCandidates email filter | email param | Single candidate returned |
| U-009 | syncCandidate custom fields | TrustExport payload | PATCH called with correct fields |
| U-010 | syncCandidate below threshold | score=30, threshold=40 | Band="Profile building", no score |
| U-011 | refreshToken success | Valid refresh token | New TokenPair |
| U-012 | refreshToken expired | Invalid refresh token | ProviderAuthError |
| U-013 | healthCheck valid token | GET /users/me | healthy=true |
| U-014 | healthCheck expired token | 401 response | healthy=false |
| U-015 | Rate limit handling | 429 response | RateLimitError with retryAfterMs |

### Sync Engine

| ID | Test | Input | Expected |
|----|------|-------|----------|
| U-020 | Email auto-link single match | 1 profile matches | auto_linked |
| U-021 | Email auto-link zero matches | 0 profiles | pending |
| U-022 | Email auto-link multiple matches | 2+ profiles | ambiguous |
| U-023 | Email case insensitive | JANE@EMAIL.COM vs jane@email.com | Match |
| U-024 | Trust export read-only | Export triggered | trust_scores not modified |
| U-025 | Trust export band calculation | score=78 | band="Strong" |
| U-026 | Conflict resolution trust | GH field manually edited | WV value re-exported |
| U-027 | Conflict resolution status | GH stage updated | ATS value accepted |
| U-028 | Duplicate GH candidate ID | Same external_id twice | Skip upsert |
| U-029 | External deleted handling | GH 404 | link_status=external_deleted |
| U-030 | Location US without state | country=US, state=null | Record dropped |

### Automation Engine

| ID | Test | Input | Expected |
|----|------|-------|----------|
| U-040 | Auto-invite final interview | Stage change to Final Interview | Invitation sent |
| U-041 | Auto-invite disabled | auto_invite_enabled=false | No invitation |
| U-042 | Auto-invite job filter pass | Job in filter list | Invitation sent |
| U-043 | Auto-invite job filter block | Job not in list | No invitation |
| U-044 | Auto-invite already invited | invited_at set | Skip (idempotent) |
| U-045 | Auto-invite delay | delay_hours=4 | Invitation scheduled |
| U-046 | Trust threshold above | score=78, threshold=60 | Full export |
| U-047 | Trust threshold below | score=30, threshold=40 | "Profile building" only |
| U-048 | Expiration check | invited 31 days ago | Status=expired |

### Error Handling

| ID | Test | Input | Expected |
|----|------|-------|----------|
| U-050 | OAuth state mismatch | Invalid state | OAUTH_STATE_MISMATCH |
| U-051 | Webhook duplicate | Same eventId twice | 200, skip processing |
| U-052 | Sync retry on 429 | Rate limit error | Retry with backoff |
| U-053 | Sync DLQ on mapping error | Invalid custom field | Immediate DLQ |
| U-054 | Token refresh on 401 | Expired access token | Refresh + retry once |

---

## Integration Tests

| ID | Test | Components | Expected |
|----|------|-----------|----------|
| I-001 | OAuth connect flow | OAuth Service + GH sandbox | Connection created |
| I-002 | OAuth disconnect flow | OAuth Service + GH sandbox | Tokens zeroed |
| I-003 | Webhook receive + process | Webhook EP + Event Bus + Sync | Candidate mapped |
| I-004 | Webhook signature rejection | Webhook EP | 401 returned |
| I-005 | Trust export to GH | Sync Engine + GH API | Custom fields updated |
| I-006 | Verification export to GH | Sync Engine + GH API | Status field updated |
| I-007 | Manual link | API + Sync Engine | manual_linked |
| I-008 | Manual unlink | API + Sync Engine | unlinked |
| I-009 | Auto-invite end-to-end | Webhook + Automation + Email | Invitation sent |
| I-010 | Cron trust export batch | Cron + Sync Engine + GH API | Batch success |
| I-011 | Token refresh cron | Cron + OAuth Service | Token renewed |
| I-012 | DLQ retry | Cron + Event Bus | Event reprocessed |
| I-013 | Catch-up sync on reconnect | OAuth + Sync Engine | All candidates re-exported |
| I-014 | Panel API load | Panel EP + Cache | Response <3s |
| I-015 | Health check endpoint | Health EP + GH API | Status healthy |

---

## Contract Tests

Contract tests validate WorkVouch API responses match documented schemas and GH adapter conforms to `AtsProvider` interface.

| ID | Test | Contract | Validation |
|----|------|----------|------------|
| C-001 | POST /connect response schema | 05-api-contract.md | authorizationUrl, state, expiresAt |
| C-002 | GET /status response schema | 05-api-contract.md | ConnectionStatus fields |
| C-003 | POST /sync response schema | 05-api-contract.md | batchId, status, estimatedItems |
| C-004 | GET /candidates pagination | 05-api-contract.md | items, page, totalCount, hasMore |
| C-005 | Error response format | 09-error-catalog.md | code, message, retryable |
| C-006 | Panel payload schema | 05-api-contract.md | All PanelPayload fields |
| C-007 | AtsProvider interface compliance | 03-provider-interface.md | All methods implemented |
| C-008 | CanonicalCandidate schema | 03-provider-interface.md | Required fields present |
| C-009 | CanonicalTrustExport schema | 03-provider-interface.md | Score 0-100, valid band |
| C-010 | Webhook normalized event schema | 04-webhook-contract.md | eventId, eventType, payload |
| C-011 | Custom field names match spec | 07-custom-fields.md | All 12 name_keys |
| C-012 | Sync log schema | 06-sync-contract.md | All required fields |

**Tool:** Pact or custom schema validation (JSON Schema / Zod).

---

## Webhook Tests

| ID | Test | Event | Expected |
|----|------|-------|----------|
| W-001 | candidate_created | Full payload | auto_link or pending |
| W-002 | candidate_updated | Email changed | Re-evaluate link |
| W-003 | application_created | With job | application_status set |
| W-004 | application_updated stage change | Final Interview | Auto-invite triggered |
| W-005 | hire_candidate | Hired payload | status=hired, logged |
| W-006 | reject_candidate | Rejected payload | status=rejected, logged |
| W-007 | offer_created | Offer payload | Auto-invite if trigger=offer |
| W-008 | Duplicate event | Same eventId | 200, no reprocessing |
| W-009 | Invalid signature | Tampered body | 401 |
| W-010 | Unknown org ID | No matching connection | 200, logged no_connection |
| W-011 | Malformed payload | Missing required fields | 200, logged parse_error |

---

## OAuth Tests

| ID | Test | Scenario | Expected |
|----|------|----------|----------|
| O-001 | Happy path connect | Full OAuth flow | Connection connected |
| O-002 | Access denied | User declines | Redirect with error |
| O-003 | State expired | Callback after 16 min | OAUTH_STATE_MISMATCH |
| O-004 | State tampered | Modified state param | OAUTH_STATE_MISMATCH |
| O-005 | Token refresh success | Expired access token | New token stored |
| O-006 | Token refresh failure | Invalid refresh token | OAUTH_TOKEN_EXPIRED |
| O-007 | Reconnect after expiry | Admin reconnects | Catch-up sync triggered |
| O-008 | Disconnect + reconnect | Full cycle | Maps preserved, sync resumes |

---

## Sync Tests

| ID | Test | Scenario | Expected |
|----|------|----------|----------|
| S-001 | Inbound candidate sync | New GH candidate | Map created |
| S-002 | Outbound trust export | Score change | GH fields updated |
| S-003 | Outbound verification export | Status change | GH fields updated |
| S-004 | Batch export 100 candidates | Cron trigger | 100 success entries |
| S-005 | Partial batch failure | 3 of 100 fail | partial status, 3 DLQ |
| S-006 | Rate limit during batch | GH 429 | Backoff + retry |
| S-007 | Candidate deleted in GH | 404 on export | external_deleted |
| S-008 | No link export attempt | Unlinked candidate | Skipped, logged |
| S-009 | Stale data recovery | >24h since export | Stale badge + re-export |
| S-010 | Full sync on connect | Initial connect | All candidates processed |

---

## UI Tests

| ID | Test | Screen | Expected |
|----|------|--------|----------|
| UI-001 | Connect button | Settings → Integrations | OAuth redirect |
| UI-002 | Connected badge | Settings → Integrations | Green "Connected" |
| UI-003 | Automation presets | Settings → Automation | Preset fills fields |
| UI-004 | Health dashboard | Integration dashboard | 3 green indicators |
| UI-005 | Panel loaded state | GH panel | Trust score visible <3s |
| UI-006 | Panel not linked | GH panel | "Not linked" + link button |
| UI-007 | Panel stale badge | GH panel | Amber "Stale" badge |
| UI-008 | Panel error state | GH panel | Cached data + retry |
| UI-009 | Manual link flow | GH panel → confirm | Panel populates |
| UI-010 | Disconnect confirm | Settings | Modal + success message |

---

## Load Tests

| ID | Test | Load | Target |
|----|------|------|--------|
| L-001 | Webhook throughput | 50 webhooks/min | All processed <1 min |
| L-002 | Panel API concurrent | 100 concurrent requests | p99 <3s |
| L-003 | Trust export batch | 1000 candidates | Complete <30 min |
| L-004 | Cron event processing | 500 pending events | Processed <5 min |
| L-005 | OAuth connect | 10 simultaneous connects | All succeed |

---

## Failure Tests

| ID | Test | Failure Injected | Expected |
|----|------|-----------------|----------|
| F-001 | GH API down | 503 responses | Retry + stale badge |
| F-002 | Token expired mid-sync | 401 during export | Refresh + retry |
| F-003 | Webhook secret mismatch | Wrong secret | 401, no processing |
| F-004 | Database timeout | Slow query | Graceful error, no data loss |
| F-005 | Email service down | Invitation fails | Logged, retry later |
| F-006 | AI service timeout | Summary generation | Structured fallback |
| F-007 | Supabase Storage down | Payload storage fails | Log hash only, continue |
| F-008 | Concurrent sync attempt | Two manual syncs | 409 SYNC_IN_PROGRESS |

---

## Recovery Tests

| ID | Test | Scenario | Expected |
|----|------|----------|----------|
| R-001 | DLQ replay | Failed event in DLQ | Reprocessed successfully |
| R-002 | Reconnect catch-up | Disconnect → reconnect | All candidates re-exported |
| R-003 | Expired link recovery | Candidate clicks expired link | Re-invite flow |
| R-004 | Manual link after ambiguous | Admin resolves ambiguous | manual_linked |
| R-005 | Token refresh recovery | Proactive refresh before expiry | No interruption |

---

## Regression Tests

| ID | Test | Scope | Trigger |
|----|------|-------|---------|
| RG-001 | Existing employer dashboard | No regression | Every PR |
| RG-002 | Existing candidate flows | No regression | Every PR |
| RG-003 | Existing trust score API | No regression | Every PR |
| RG-004 | Existing verification flow | No regression | Every PR |
| RG-005 | Existing auth/session | No regression | Every PR |
| RG-006 | Location safety policy | No city/zip stored | Every PR touching sync |

---

## Acceptance Tests (Marketplace Demo)

| ID | Test | Actor | Expected |
|----|------|-------|----------|
| A-001 | Demo connect in <2 min | Reviewer | Connected + candidates linked |
| A-002 | Demo panel load | Reviewer | Trust score visible <3s |
| A-003 | Demo verified candidate | Reviewer | Score 82, AI summary, timeline |
| A-004 | Demo pending candidate | Reviewer | "Invitation Sent" state |
| A-005 | Demo needs review | Reviewer | Risk flag visible |
| A-006 | Demo custom field in GH list | Reviewer | Trust score column visible |
| A-007 | Demo mobile candidate flow | Reviewer | 4-step completion |
| A-008 | Demo disconnect/reconnect | Reviewer | Maps preserved, sync resumes |

---

## Test Environment Requirements

| Environment | Purpose | GH Access |
|-------------|---------|-----------|
| **Unit** | Adapter, engine, automation | MockAtsAdapter |
| **Integration** | API + sync flows | GH sandbox |
| **Contract** | Schema validation | Mock + GH sandbox |
| **Staging** | Full E2E | GH sandbox |
| **Demo** | Marketplace review | Pre-seeded demo data |

---

## CI Pipeline

```
PR opened →
  Unit tests (MockAtsAdapter) →
  Contract tests (schema validation) →
  Integration tests (GH sandbox, staging only) →
  Regression tests →
  Merge
```

**Nightly:** Load tests + full E2E acceptance suite against GH sandbox.

---

## Related Documents

- [05-api-contract.md](./05-api-contract.md)
- [09-error-catalog.md](./09-error-catalog.md)
- [12-marketplace-readiness.md](./12-marketplace-readiness.md)
- [14-implementation-checklist.md](./14-implementation-checklist.md)
