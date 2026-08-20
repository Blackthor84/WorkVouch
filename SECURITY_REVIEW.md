# WorkVouch Connect — Security Review (Sprint 10)

**Date:** 2026-08-08  
**Scope:** Greenhouse Connect MVP — OAuth, webhooks, event store, employer portal, embedded panel  
**Reviewer:** Engineering (Sprint 10 production hardening)

---

## Executive Summary

WorkVouch Connect implements defense-in-depth appropriate for an enterprise ATS integration. Critical Sprint 10 hardening closed previously open ingress routes, removed production crypto fallbacks, gated demo mode, and moved panel JWT out of URLs.

**Overall Security Posture:** **Strong with known gaps** (distributed rate limiting, persistent DLQ, build-time env validation).

| Area | Status | Severity |
|------|--------|----------|
| OAuth / PKCE | ✅ Pass | — |
| Webhook HMAC | ✅ Pass | — |
| Token encryption | ✅ Pass (prod enforced) | — |
| Panel JWT | ✅ Pass | — |
| RBAC (employer) | ✅ Pass | — |
| Route auth (import/health) | ✅ Fixed Sprint 10 | was P0 |
| Rate limiting | ⚠️ Partial | P2 |
| CSRF (OAuth state) | ✅ Pass | — |
| CORS | ✅ Pass (same-origin API) | — |
| XSS (panel) | ✅ Pass (React, no dangerouslySetInnerHTML) | — |
| Secret management | ⚠️ Partial | P2 |
| Logging / PII | ⚠️ Partial | P2 |

---

## 1. JWT (Panel Tokens)

**Implementation:** `lib/integrations/greenhouse/panel/panel-auth.ts`

- HS256 signed JWT via `jose`
- 15-minute TTL
- Claims: `connectionId`, `employerAccountId`, `externalCandidateId`
- Production: throws if `PANEL_JWT_SECRET` missing
- Delivered via `X-Panel-Token` header (removed from URL query string in Sprint 10)

**Findings:**
- ✅ Short TTL limits exposure window
- ✅ Candidate ID mismatch returns 403
- ⚠️ No token revocation list (acceptable for 15-min TTL)
- ⚠️ Dev fallback to `ATS_ENCRYPTION_KEY` / `dev-panel-secret` only in non-production

**Recommendation:** Rotate `PANEL_JWT_SECRET` per [docs/operations/secret-rotation.md](docs/operations/secret-rotation.md).

---

## 2. OAuth

**Implementation:** Greenhouse Harvest OAuth with PKCE; state stored in `connect_oauth_state`.

- CSRF state validated on callback
- Tokens encrypted at rest (see §4)
- Recovery service refreshes expired tokens with backoff
- Employer-only connect flow via authenticated portal

**Findings:**
- ✅ PKCE + server-side state
- ✅ Redirect URI configurable via env
- ⚠️ OAuth credentials not validated at build time (`env.mjs` gap)

---

## 3. Webhook Verification

**Implementation:** `lib/integrations/providers/greenhouse/auth/webhook-signature.ts`

- HMAC-SHA256 (`Signature: sha256={hex}`)
- Rejects missing/invalid signatures before event processing
- Duplicate detection via payload hash
- Rate limited: 300 req/min per IP on ingress route

**Findings:**
- ✅ Signature verified before DB write
- ✅ Invalid signatures logged, not processed
- ✅ `requireConnectEnabled()` gates webhook when Connect disabled

---

## 4. Encryption & Token Storage

**Implementation:** `lib/integrations/connect/auth/secure-token-storage.ts`, `AES-256-GCM`

- `ATS_ENCRYPTION_KEY` required in production on encrypt
- Tokens stored encrypted in `connect_connections`
- Diagnostic bundle redactor strips tokens, Bearer headers, JWTs

**Findings:**
- ✅ AES-256-GCM with random IV
- ✅ Production throw on missing key
- ⚠️ Key rotation requires re-encryption script (documented in ops runbook)

---

## 5. RBAC

**Implementation:** `lib/employer/integrations/auth.ts`

- All employer routes require session + `employer` role
- `requireConnectionAccess()` verifies `connection.employerAccountId === ctx.employerAccountId`
- Returns 404 (not 403) for cross-tenant access — prevents enumeration

**Findings:**
- ✅ Consistent ownership checks on connection APIs
- ✅ Panel token endpoint requires employer auth
- ✅ Service role (`admin`) used only server-side in API routes

---

## 6. Input Validation

- Webhook payloads validated by provider adapter before event store append
- API routes use typed JSON parsing with required field checks
- Zod used in employer integration service layer

**Findings:**
- ✅ No raw SQL; Supabase client parameterized queries
- ⚠️ Some routes use manual validation vs Zod — acceptable for MVP

---

## 7. Rate Limiting

**Implementation:** `lib/rateLimit.ts` (in-memory sliding window)

| Route | Limit |
|-------|-------|
| Webhooks | 300/min |
| Panel API | 120/min |
| Import (cron) | 10/min |
| Health | 60/min |

**Findings:**
- ⚠️ **P2:** In-memory limiter is per-instance; multi-instance deployments need Redis/Upstash
- ✅ 429 responses with retry-after semantics

---

## 8. CORS / CSRF

- API routes are same-origin for employer portal
- Panel iframe loads from WorkVouch domain; token via header from parent frame
- OAuth CSRF protected via state parameter
- No cookie-based panel auth (JWT header) — CSRF not applicable to panel API

---

## 9. XSS

- Greenhouse panel uses React with escaped text rendering
- No `dangerouslySetInnerHTML` in panel components
- Diagnostic bundles export JSON/Markdown with redaction

---

## 10. Secret Management

**Required production secrets:**

| Secret | Purpose |
|--------|---------|
| `ATS_ENCRYPTION_KEY` | OAuth token encryption |
| `PANEL_JWT_SECRET` | Panel JWT signing |
| `GREENHOUSE_CLIENT_ID/SECRET` | OAuth |
| `GREENHOUSE_WEBHOOK_SECRET` | Webhook HMAC |
| `CRON_SECRET` | Import/health cron auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server DB access |

**Sprint 10 additions:**
- `validateConnectProductionSecrets()` helper
- `requireCronSecret()` on import route
- Health route requires cron OR employer auth

**Gaps:**
- ⚠️ **P2:** Connect vars not in `env.mjs` build-time schema
- ⚠️ **P2:** No automated secret scanning in CI

---

## 11. Feature Flags

- `ATS_ENABLED`, `GREENHOUSE_ENABLED` via `FeatureFlagService`
- `requireConnectEnabled()` on webhook, panel, import, health routes
- `CONNECT_DEMO_MODE_ENABLED` gates demo in production

**Gap:** Not all employer sub-routes call `requireConnectEnabled()` — low risk (employer auth still required).

---

## 12. Logging

- `StructuredLoggingService` — correlation IDs, no raw webhook payloads in info logs
- Diagnostic bundle redacts PII/secrets

**Gap:** ⚠️ **P2:** No production log sink wired (Datadog/Sentry) — documented in monitoring runbook.

---

## 13. Sprint 10 Remediations Applied

| Issue | Fix |
|-------|-----|
| Unauthenticated `/api/integrations/v1/import` | Cron secret required |
| Unauthenticated `/api/integrations/v1/health` | Cron OR employer + ownership |
| Dev crypto fallbacks in production | Throw on missing secrets |
| Public `demo=1` in production | Gated by `CONNECT_DEMO_MODE_ENABLED` |
| Panel JWT in URL | Removed; header-only delivery |

---

## 14. Residual Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| In-memory DLQ lost on restart | P1 | Migrate to `connect_webhook_log` replay (partially exists); persistent DLQ post-MVP |
| In-memory rate limit bypass (multi-instance) | P2 | Redis rate limiter before scale-out |
| Missing build-time env validation | P2 | Add Connect vars to `env.mjs` |
| No formal penetration test | P2 | Schedule pre-enterprise GA |
| Event store retention unbounded | P2 | Add retention policy + cron purge |

---

## Security Score: **82 / 100**

**Rationale:** Core auth, encryption, and webhook verification are enterprise-grade. Deductions for operational gaps (DLQ persistence, distributed rate limiting, env validation at build time).

---

## Sign-Off

| Role | Status |
|------|--------|
| Engineering | ✅ Approved for marketplace submission with documented P1/P2 mitigations |
| Security (formal) | ⏳ Pending external pen test for enterprise GA |
