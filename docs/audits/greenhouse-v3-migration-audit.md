# Greenhouse Harvest V3 + Partner OAuth Migration Audit

**Sprint:** 12 (Operation Greenhouse)  
**Date:** 2026-08-20  
**Status:** Migration implemented — sandbox verification pending

## Executive summary

WorkVouch Connect Greenhouse integration was built against **Harvest V1** assumptions (`/v1/`, page pagination, coarse scopes, PKCE + form-body token exchange). Sprint 12 migrates to **Partner OAuth 2.0 Authorization Code Grant** and **Harvest V3** per [official documentation](https://harvestdocs.greenhouse.io/docs/harvest-partner-oauth).

---

## 1. OAuth authorization

| | Current (pre-Sprint 12) | Official V3 requirement | Gap | Required change |
|---|---|---|---|---|
| Authorize URL | `auth.greenhouse.io/oauth/authorize` | `auth.greenhouse.io/authorize` | High | Update manifest + oauth-service |
| Token URL | `auth.greenhouse.io/oauth/token` | `auth.greenhouse.io/token` | High | Update manifest + oauth-service |
| Token auth | Form body `client_id` + `client_secret` + PKCE | HTTP Basic + query params | High | Rewrite exchange/refresh |
| PKCE | Required (S256) | Not in partner guide | Medium | Disable for partner flow; keep state CSRF |
| Scopes | `harvest:read`, `harvest:write`, `harvest:webhooks` | Granular partner scopes (7 approved) | High | Replace scope list |

**Files affected:** `config/manifest.ts`, `auth/oauth-service.ts`, `config/scopes.ts`  
**Risk:** OAuth redirect failures until Greenhouse client matches new URLs/scopes  
**Test strategy:** Unit tests with MockHttpClient; manual sandbox OAuth checklist

---

## 2. Harvest API

| | Pre-Sprint 12 | V3 requirement | Gap | Required change |
|---|---|---|---|---|
| Base URL | `harvest.greenhouse.io/v1` | `harvest.greenhouse.io/v3/` | Critical | Default base URL + client |
| Pagination | `page` / `per_page` | Link header `rel="next"` + opaque `cursor` | Critical | New pagination helper + client |
| Incremental filter | `updated_after` | `updated_at` (V3) | Medium | Import service filter param |
| Health | `GET /v1/users/me` | No `/users/me`; probe list endpoint | High | Health via `GET /v3/jobs?per_page=1` |
| Single resource | `GET /v1/candidates/:id` | `GET /v3/candidates?ids=` | Medium | Client retrieve methods |

**Files affected:** `api/harvest-client.ts`, `api/link-pagination.ts`, `sync/harvest-import-service.ts`, `health/greenhouse-health-service.ts`, `provider.ts`  
**Risk:** Mapper field drift on V3 payloads  
**Test strategy:** Fixture-based import tests; V3 unit tests

---

## 3. Token storage

| Requirement | Status |
|---|---|
| Access token encrypted at rest | ✅ Existing ConnectSecureTokenStorage |
| Refresh token encrypted at rest | ✅ Existing |
| Client secret never logged | ✅ No logging added |
| Client secret never in API responses | ✅ Unchanged |
| Refresh token rotation on refresh | ✅ oauth-service replaces both tokens |
| `expires_at` support | ✅ Added to token parser |

**Files affected:** `auth/oauth-service.ts`, `types/index.ts`  
**Risk:** Low — architecture preserved

---

## 4. Sync cursor architecture

| Layer | Role |
|---|---|
| WorkVouch Sync Cursor | Incremental sync state, checkpoints, replay |
| Provider API cursor | `jobsNextUrl`, `candidatesNextUrl`, etc. in `providerCursor` |
| `updated_at` filter | First-page incremental filter on V3 list endpoints |

**Files affected:** `sync/harvest-import-service.ts`, `connect/sync/types.ts` (unchanged schema; extended providerCursor keys)  
**Risk:** Partial sync if maxPages truncates before completion — surfaced as `paginationTruncated`  
**Test strategy:** connect-sync-cursor.test.ts, connect-sprint5.test.ts

---

## 5. Webhooks

| Item | Status |
|---|---|
| Hookshot ingress (`POST /api/integrations/v1/webhooks/greenhouse`) | ✅ Preserved |
| HMAC signature verification | ✅ Preserved |
| Partner webhook registration API | **BLOCKED** — not verified in sandbox |
| Partner payload catalog vs Hookshot fixtures | **BLOCKED UNTIL SANDBOX** |

**Files affected:** None (audit only)  
**Risk:** Production webhook compatibility unverified against partner delivery model  
**Test strategy:** Existing connect-sprint6-webhooks.test.ts; sandbox webhook registration TBD

---

## 6. Custom fields

| Scope | Capability |
|---|---|
| `harvest:custom_fields:list` | Read field definitions catalog |
| `harvest:candidates:update` | Update candidate custom field values (not auto-write in Sprint 12) |

V3 represents candidate `custom_fields` as an **object map** (not V1 array). Mapper updated to normalize both.

**Files affected:** `mappers/customFieldMapper.ts`, `models/index.ts`  
**Risk:** Field name mapping requires sandbox catalog validation  
**Test strategy:** Import catalogs custom fields count; sandbox mapping checklist

---

## 7. Approved testing client

| Setting | Value |
|---|---|
| Redirect URI | `https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback` |
| Environment | Testing |
| Scopes | 7 partner scopes (see `config/scopes.ts`) |

---

## 8. Files changed (Sprint 12 implementation)

### Core
- `lib/integrations/providers/greenhouse/config/manifest.ts`
- `lib/integrations/providers/greenhouse/config/scopes.ts` (new)
- `lib/integrations/providers/greenhouse/config/greenhouse-config.ts`
- `lib/integrations/providers/greenhouse/auth/oauth-service.ts`
- `lib/integrations/providers/greenhouse/api/harvest-client.ts`
- `lib/integrations/providers/greenhouse/api/link-pagination.ts` (new)
- `lib/integrations/providers/greenhouse/sync/harvest-import-service.ts`
- `lib/integrations/providers/greenhouse/health/greenhouse-health-service.ts`
- `lib/integrations/providers/greenhouse/provider.ts`
- `lib/integrations/providers/greenhouse/types/index.ts`
- `lib/integrations/providers/greenhouse/models/index.ts`
- `lib/integrations/providers/greenhouse/mappers/customFieldMapper.ts`
- `lib/integrations/providers/greenhouse/fixtures/responses.ts`

### Tests
- `tests/integrations/greenhouse-provider.test.ts`
- `tests/integrations/greenhouse-v3-migration.test.ts` (new)
- `tests/integrations/greenhouse-sandbox-smoke.test.ts` (new)
- `tests/integrations/connect-sprint5.test.ts`
- `tests/integrations/connect-sync-cursor.test.ts`

### Docs
- `docs/providers/greenhouse/oauth-v3.md`
- `docs/providers/greenhouse/harvest-v3.md`
- `docs/providers/greenhouse/pagination.md`
- `docs/providers/greenhouse/sandbox-testing.md`
- `docs/providers/greenhouse/webhooks.md`
- `docs/providers/greenhouse/custom-fields.md`
- `SPRINT_12_REPORT.md`

---

## 9. Out of scope (preserved)

- Trust Engine, Verification Engine, Billing, Auth core
- MockATS provider
- `/demo` and unrelated application routes
- Greenhouse embedded panel UI (unchanged)
