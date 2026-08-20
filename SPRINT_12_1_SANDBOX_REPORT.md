# Sprint 12.1 — Real Greenhouse Sandbox Validation Report

**Operation Greenhouse — Sprint 12.1**  
**Date:** 2026-08-20  
**Branch validated:** `feature/greenhouse-platform` (local)  
**Production host probed:** `https://tryworkvouch.com`  
**Validation mode:** Pre-flight + automated tests + infrastructure probes (live OAuth/Harvest blocked)

---

## Executive summary

Sprint 12.1 validation **stopped at Phase 1 pre-flight** because the registered OAuth callback route is **not deployed** to production (`404`), and Greenhouse credentials are **not available in the local validation environment** (configured on Vercel only; CLI not authenticated here).

Code-level migration (Partner OAuth, Harvest V3, scopes, pagination, token encryption) is **consistent with Sprint 12 design** and passes **342 unit tests** plus **production build**. None of the live sandbox flows (OAuth consent → token exchange → Harvest reads → incremental sync → event store → health against real tokens) could be executed end-to-end in this session.

**Final verdict: SANDBOX VALIDATION FAILED** (deployment + credential access blockers — not a code regression signal)

---

## Phase 1 — Pre-flight

| # | Check | Result | Classification |
|---|--------|--------|----------------|
| 1 | `GREENHOUSE_CLIENT_ID`, `GREENHOUSE_CLIENT_SECRET`, `GREENHOUSE_REDIRECT_URI` available server-side | **Not verifiable locally** — shell env empty; `.env.local` has no `GREENHOUSE_*` keys; Vercel CLI not authenticated (`vercel login` required) | ⏳ NOT TESTABLE YET |
| 2 | Client secret not exposed to browser | Grep: secret only in server libs, tests, docs — **no** `NEXT_PUBLIC_*` or client component imports | ✅ VERIFIED IN REAL SANDBOX (static code audit) |
| 3 | Callback route deployed at registered URI | `GET https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback?code=x&state=y` → **404**; route exists on feature branch build but **not on `main`** | ❌ FAILED |
| 4 | OAuth authorize URL | `https://auth.greenhouse.io/authorize` in `manifest.ts`; endpoint reachable (400 on invalid client) | ✅ VERIFIED IN REAL SANDBOX |
| 5 | Token exchange URL | `https://auth.greenhouse.io/token` in `manifest.ts`; POST with invalid Basic auth → **400** (endpoint live) | ✅ VERIFIED IN REAL SANDBOX |
| 6 | HTTP Basic auth for token exchange | `GreenhouseOAuthService` uses `Authorization: Basic …` on POST with empty body + query params | ✅ VERIFIED IN REAL SANDBOX (code + endpoint probe) |
| 7 | Seven approved granular scopes | Exact match in `lib/integrations/providers/greenhouse/config/scopes.ts` | ✅ VERIFIED IN REAL SANDBOX (code) |
| 8 | Harvest base URL | Default `https://harvest.greenhouse.io/v3` in `greenhouse-config.ts` | ✅ VERIFIED IN REAL SANDBOX (code) |

### Pre-flight stop condition

Per sprint instructions: **STOP** — items **1** (cannot confirm in this environment) and **3** (production callback missing) block Phases 2–12.

### Additional pre-flight notes

| Topic | Finding |
|-------|---------|
| Registered redirect URI | Sprint specifies `https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback` (no trailing slash) |
| Runtime redirect URI | OAuth start builds `${request.origin}/api/integrations/v1/connect/greenhouse/callback` — correct **when** employers use `tryworkvouch.com` |
| `GREENHOUSE_REDIRECT_URI` env | Defined in `env.mjs` / `connect-env.ts` but **unused** at OAuth start; operator reference only |
| Sprint 12 deployment gap | `git show main:…/callback/route.ts` → **path not in main**; ~582 files diverge on `feature/greenhouse-platform` |

---

## Phase 2 — Real OAuth test

| Item | Result | Classification |
|------|--------|----------------|
| Connect Greenhouse → authorization | Not executed — no deployed callback + no local credentials | ⏳ NOT TESTABLE YET |
| State validation | Unit tests cover `OAUTH_STATE_MISMATCH`; live callback unavailable | ⚠️ PARTIALLY VERIFIED |
| Redirect URI match | Cannot test until route deployed; dynamic origin aligns with registered host when served from `tryworkvouch.com` | ⏳ NOT TESTABLE YET |
| Authorization code exchange | Token endpoint reachable; exchange not run with real code | ⏳ NOT TESTABLE YET |
| Encrypted token persistence | AES-256-GCM via `SecureTokenStorage` → `connect_connections` columns; unit tests pass | ⚠️ PARTIALLY VERIFIED (mocked DB) |
| Connection created + health | Not executed | ⏳ NOT TESTABLE YET |

---

## Phase 3 — Harvest V3 endpoint validation

Using real sandbox connection: **not executed**.

| Endpoint | HTTP status | Response shape | Pagination | Mapper | Errors normalized |
|----------|-------------|----------------|------------|--------|-------------------|
| Candidates | — | Mock fixtures + unit tests | Link header in code | `candidateMapper` tested | Code path exists |
| Candidate employments | — | Mock fixtures | Link header in code | Tested in pipeline tests | Code path exists |
| Applications | — | Mock fixtures | Link header in code | Tested | Code path exists |
| Jobs | — | Mock fixtures; health probe `GET /v3/jobs?per_page=1` | Link header in code | Tested | Code path exists |
| Job interview stages | — | Mock fixtures | Link header in code | Tested | Code path exists |
| Custom fields | — | V1 array + V3 object map normalization in mapper | Link header in code | `greenhouse-v3-migration.test.ts` | Code path exists |

**Classification:** ⏳ NOT TESTABLE YET (all six endpoints)

**Documented risk (from Greenhouse docs):** List endpoints may return **403** if authorizing user is not Site Admin — must confirm in sandbox.

---

## Phase 4 — Pagination

| Check | Result | Classification |
|-------|--------|----------------|
| No page/page_size assumptions for V3 cursor | `link-pagination.ts` + `startUrl` resume | ✅ VERIFIED IN REAL SANDBOX (code) |
| Link header `rel="next"` parsing | Unit tests in migration + sync cursor tests | ⚠️ PARTIALLY VERIFIED |
| Provider cursor persisted (`*NextUrl`) | `harvest-import-service.ts` + sync cursor tests | ⚠️ PARTIALLY VERIFIED |
| WorkVouch Sync Cursor separate from API pagination | Architecture preserved in Sprint 12 | ⚠️ PARTIALLY VERIFIED |
| Multi-page live fetch | Not executed | ⏳ NOT TESTABLE YET |

---

## Phase 5 — Incremental sync

| Metric | Result |
|--------|--------|
| Start / completion time | Not recorded |
| Objects discovered / imported / skipped | Not recorded |
| Events created | Not recorded |
| Cursor position after run | Not recorded |
| Second incremental run | Not executed |

**Classification:** ⏳ NOT TESTABLE YET

---

## Phase 6 — Event Store

Pipeline (Greenhouse → V3 model → mapper → universal model → Connect Event → Event Store → Projection → Audit) is covered by **unit/integration tests** (`connect-event-store.test.ts`, `greenhouse-pipeline.test.ts`).

| Check | Live sandbox | Classification |
|-------|--------------|----------------|
| Event creation from real payloads | Not executed | ⏳ NOT TESTABLE YET |
| Correlation / event IDs | Tested with mocks | ⚠️ PARTIALLY VERIFIED |
| Duplicate idempotency | Tested with mocks | ⚠️ PARTIALLY VERIFIED |

---

## Phase 7 — Candidate linking

| Check | Result | Classification |
|-------|--------|----------------|
| Candidate lookup against real GH ID | Not executed | ⏳ NOT TESTABLE YET |
| Mapping + projection + lifecycle | Panel + pipeline unit tests | ⚠️ PARTIALLY VERIFIED |
| Duplicate WorkVouch candidate prevention | Logic in connect layer; not live-tested | ⚠️ PARTIALLY VERIFIED |

---

## Phase 8 — Custom fields

Approved scopes include `harvest:custom_fields:list` and `harvest:candidates:update` only.

| Operation | Live result | Classification |
|-----------|-------------|----------------|
| List custom field definitions | Not executed | ⏳ NOT TESTABLE YET |
| Read candidate custom field values | Not executed | ⏳ NOT TESTABLE YET |
| Update candidate custom fields | Not executed; no field creation attempted (per sprint) | ⏳ NOT TESTABLE YET |

No additional scope gaps identified (sandbox not exercised).

---

## Phase 9 — Token refresh

| Check | Result | Classification |
|-------|--------|----------------|
| Refresh via Basic auth + query params | Code matches partner guide; not run with real refresh token | ⚠️ PARTIALLY VERIFIED |
| Encrypted replacement + expiry update | `connection-manager.refreshTokens` + encryption | ⚠️ PARTIALLY VERIFIED |
| Connection remains healthy after refresh | Not executed | ⏳ NOT TESTABLE YET |

---

## Phase 10 — Health

Connect Health service probes OAuth config, token expiry, `GET /v3/jobs?per_page=1`, scopes, webhook secret presence.

| Dimension | Live result | Classification |
|-----------|-------------|----------------|
| OAuth | Not run against real connection | ⏳ NOT TESTABLE YET |
| Harvest V3 connectivity | Not run | ⏳ NOT TESTABLE YET |
| Permissions / 403 detection | Not run | ⏳ NOT TESTABLE YET |
| Sync cursor / event store / projection | Mocked tests only | ⚠️ PARTIALLY VERIFIED |
| Webhook configuration status | Secret optional warning in config validator | ⚠️ PARTIALLY VERIFIED |

---

## Phase 11 — Webhook investigation

| Question | Finding | Classification |
|----------|---------|----------------|
| Partner programmatic webhook registration | Greenhouse Partner OAuth docs describe **customer authorization** and Harvest API access; webhook setup for Hookshot-style HMAC ingress is **UI/manual**, not part of partner OAuth app registration | 🟡 REQUIRES GREENHOUSE |
| Registration method | Per existing docs + third-party partner guides: configure HTTPS endpoint + shared secret in Greenhouse UI (not via Harvest V3 list API) | 🟡 REQUIRES GREENHOUSE |
| Expected endpoint | WorkVouch: `POST /api/integrations/v1/webhooks/greenhouse?connectionId=` | ✅ VERIFIED IN REAL SANDBOX (code) |
| Authentication | Hookshot HMAC-SHA256 `Signature: sha256=…` | ✅ VERIFIED IN REAL SANDBOX (code) |
| Payload format / event ID / retries | Fixtures preserved; **not validated** against live partner delivery | 🟡 REQUIRES GREENHOUSE |

**Webhook status:** **BLOCKED BY GREENHOUSE** for partner programmatic registration; manual Hookshot configuration may still be possible per customer sandbox but was **not tested** in this sprint.

---

## Phase 12 — Failure testing

| Scenario | Live sandbox | Unit/mock coverage |
|----------|--------------|-------------------|
| Invalid OAuth state | Callback 404 on prod | ✅ Tests |
| Invalid / expired token | Not live-tested | ✅ Error normalization tests |
| Insufficient scope / 401 / 403 | Not live-tested | ✅ Mapper/error tests |
| 429 + Retry-After | Not live-tested | ✅ Client retry policy in code |
| Timeout / malformed response | Not live-tested | ✅ Error normalization |
| Duplicate event / interrupted sync | Not live-tested | ✅ Sync cursor + event store tests |

**Classification:** ⚠️ PARTIALLY VERIFIED (automated only)

---

## Phase 13 — Feature creep

No Lever, Ashby, AI, analytics, Trust Engine, Verification, or unrelated Greenhouse features were added during this validation sprint.

---

## Phase 14 — Automated test & build results

### Automated tests

```
npm test
Test Files  37 passed (37)
Tests       342 passed | 1 skipped (343)
Duration    ~4s
```

Skipped: `greenhouse-sandbox-smoke.test.ts` live case (requires `GREENHOUSE_SANDBOX_SMOKE=true` + credentials).

### Sandbox smoke tests

```
GREENHOUSE_SANDBOX_SMOKE=true npm test -- tests/integrations/greenhouse-sandbox-smoke.test.ts
```

**Not run** — `GREENHOUSE_CLIENT_ID` / `GREENHOUSE_CLIENT_SECRET` absent locally.

### Production build

```
npm run build
PASS (Next.js 16.1.6)
Route present in build output: ƒ /api/integrations/v1/connect/greenhouse/callback
```

### Real API results

| Probe | Result |
|-------|--------|
| `auth.greenhouse.io/authorize` (invalid client) | 400 |
| `auth.greenhouse.io/token` (invalid Basic auth) | 400 |
| Production OAuth callback | **404** |

### Failures

1. Production OAuth callback route not deployed (`404`)
2. Cannot access Vercel env vars from validation environment
3. Full sandbox OAuth + Harvest validation not completed

### Warnings

1. `GREENHOUSE_REDIRECT_URI` env var unused at runtime — rely on request origin
2. Redirect URI audit doc references `workvouch.com`; sprint + registered URI use `tryworkvouch.com` — confirm single canonical employer origin
3. Site Admin authorization may be required for list endpoints (403 risk)
4. `GREENHOUSE_WEBHOOK_SECRET` optional at startup — webhooks fail closed without it

---

## Results matrix (requested 20 items)

| # | Area | Classification | Notes |
|---|------|----------------|-------|
| 1 | OAuth result | ⏳ NOT TESTABLE YET | Blocked: callback 404 + no credentials |
| 2 | Token persistence result | ⚠️ PARTIALLY VERIFIED | Encryption + adapter tested; no live DB write |
| 3 | Candidates result | ⏳ NOT TESTABLE YET | |
| 4 | Candidate employments result | ⏳ NOT TESTABLE YET | |
| 5 | Applications result | ⏳ NOT TESTABLE YET | |
| 6 | Jobs result | ⏳ NOT TESTABLE YET | |
| 7 | Interview stages result | ⏳ NOT TESTABLE YET | |
| 8 | Custom fields result | ⏳ NOT TESTABLE YET | |
| 9 | Pagination result | ⚠️ PARTIALLY VERIFIED | Code + unit tests only |
| 10 | Incremental sync result | ⏳ NOT TESTABLE YET | |
| 11 | Event Store result | ⚠️ PARTIALLY VERIFIED | Mock pipeline tests |
| 12 | Projection result | ⚠️ PARTIALLY VERIFIED | Mock pipeline tests |
| 13 | Candidate mapping result | ⚠️ PARTIALLY VERIFIED | Unit tests only |
| 14 | Health result | ⏳ NOT TESTABLE YET | |
| 15 | Token refresh result | ⚠️ PARTIALLY VERIFIED | Code matches spec; not live-tested |
| 16 | Webhook result | 🟡 REQUIRES GREENHOUSE | Partner API registration not verified |
| 17 | Error handling result | ⚠️ PARTIALLY VERIFIED | Unit tests; no live 401/403/429 |
| 18 | Security result | ✅ VERIFIED IN REAL SANDBOX | No client secret in browser bundle |
| 19 | Test results | ✅ VERIFIED IN REAL SANDBOX | 342 passed, 1 skipped |
| 20 | Production build result | ✅ VERIFIED IN REAL SANDBOX | Build PASS on feature branch |

---

## Security result (detail)

| Control | Status |
|---------|--------|
| `GREENHOUSE_CLIENT_SECRET` server-only | ✅ |
| Token encryption at rest (AES-256-GCM) | ✅ (code + persistence tests) |
| OAuth state CSRF | ✅ (mandatory consume-on-use) |
| PKCE disabled for partner flow | ✅ (per Greenhouse partner guide) |
| No token values logged in validation | ✅ |

---

## Unblock checklist (required before re-run)

1. **Merge and deploy** `feature/greenhouse-platform` → `main` → Vercel production so callback returns **400** (invalid state), not **404**.
2. **Confirm Vercel production env:** `GREENHOUSE_CLIENT_ID`, `GREENHOUSE_CLIENT_SECRET`, `GREENHOUSE_REDIRECT_URI=https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback`, plus `ATS_ENCRYPTION_KEY`.
3. **Manual OAuth** from `https://tryworkvouch.com/employer/integrations/connect` using Greenhouse **testing** client only.
4. **Re-run validation:** `vercel login` → `vercel env pull` (gitignored) → `GREENHOUSE_SANDBOX_SMOKE=true npm test -- tests/integrations/greenhouse-sandbox-smoke.test.ts` and manual checklist in `docs/providers/greenhouse/sandbox-testing.md`.
5. **Site Admin:** Ensure sandbox authorizing user has permissions for list endpoints.

---

## Final verdict

### **SANDBOX VALIDATION FAILED**

**Reason:** Pre-flight deployment failure (production OAuth callback **404**) and inability to access Vercel-hosted credentials in this validation environment prevented real Partner OAuth and Harvest V3 sandbox execution.

**Not claimed:**

- Marketplace readiness  
- Production readiness based solely on unit tests  
- Live sandbox proof of Connect against Greenhouse  

**Engineering confidence:** Sprint 12 **code migration** remains internally consistent (342 tests, build pass, Greenhouse auth endpoints reachable). **Live sandbox proof is still outstanding** and requires deploy + credential access + manual OAuth completion.

---

*Report generated for Operation Greenhouse Sprint 12.1. No credentials were printed, exposed, or committed.*
