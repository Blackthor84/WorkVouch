# 06 — Greenhouse Sandbox Dependencies

**Date:** 2026-08-13

---

## Cannot Verify Until Sandbox Credentials

| Dependency | Why blocked | Owner |
|------------|-------------|-------|
| Partner OAuth client ID | Issued by Greenhouse after partnership agreement | Greenhouse Partner Support |
| Partner OAuth client secret | Same | Greenhouse |
| Redirect URI registration | Must match exact callback URL | Eng + Greenhouse |
| Approved granular V3 scopes | Registered per client application | Greenhouse |
| Correct OAuth URLs (`/authorize` vs `/oauth/authorize`) | Live authorize redirect | Sandbox test |
| Token exchange (Basic auth vs form+PKCE) | Live token response | Sandbox test |
| Authorization code 1-minute expiry | Real user flow timing | Sandbox test |
| Access token 1-hour / refresh 24-hour lifecycle | Real token TTLs | Sandbox test |
| Refresh token rotation | Verify new refresh returned | Sandbox test |
| Harvest V3 API responses | Real JSON schemas | Sandbox |
| Cursor pagination (`Link` header) | Real list responses | Sandbox |
| `updated_after` or V3 incremental equivalent | Real sync behavior | Sandbox |
| Site Admin 403 on non-admin connect | Permission behavior | Sandbox |
| Partner webhook payloads | Real Hookshot/V3 event shapes | Sandbox |
| Webhook signing secret from Greenhouse | Real HMAC validation | Sandbox |
| Partner webhook registration process | Confirm Hookshot vs partner API | Greenhouse docs + sandbox |
| Embedded panel in Greenhouse iframe | Cross-origin + real candidate IDs | Sandbox org |
| Multi-tenant webhook routing | Real org IDs + connection mapping | Sandbox |
| Rate limit headers (`X-RateLimit-Remaining`) | Real 429 behavior | Sandbox |
| Greenhouse review / approval workflow | Partner program process | Greenhouse |

---

## Can Test Now (No Greenhouse)

| Area | Method |
|------|--------|
| Connect event store | Unit/integration tests |
| Webhook signature verification | HMAC tests with fixtures |
| Webhook idempotency + DLQ + replay | Integration tests |
| Employer portal (OAuth wizard UI) | Staging with mock provider |
| Embedded panel demo scenarios | `?demo=1&scenario=*` |
| Hiring Confidence engine | Trust tests |
| Diagnostic bundle | Sprint 8B tests |
| OAuth state CSRF | Unit tests |
| Token encryption | Unit tests |
| Production env validation | Build-time checks |
| Redis rate limiting | Staging with Upstash |
| Sentry logging | Staging with DSN |
| MockATS provider | Full Connect platform tests |
| Marketplace documentation review | Internal QA |

---

## MockATS vs Greenhouse

| Capability | MockATS | Greenhouse Sandbox |
|------------|---------|-------------------|
| OAuth shape | ✅ Simulated | Real partner OAuth |
| Harvest pagination | ✅ Fixed arrays | Cursor-based V3 |
| Webhook delivery | ✅ Test harness | Real Hookshot |
| Candidate/job data | ✅ Synthetic | Real org data |
| Panel linking by email | ✅ Test emails | Real candidates |
| Permission errors | ❌ Not simulated | Site Admin 403 |
| Rate limits | ✅ Simulated 429 | Real limits |

---

## Prerequisites Before Sandbox Day 1

1. Signed partnership agreement (if required for credentials)
2. Staging environment with all Connect env vars set
3. Migration `connect_dead_letter_queue` applied
4. Upstash Redis configured
5. Public HTTPS webhook URL (Vercel production or ngrok for dev)
6. Documented redirect URI to register with Greenhouse
7. Engineering spike plan for Harvest V3 migration (parallel track)

---

## Contact

- Greenhouse Partner Support: `partner-support@greenhouse.io`
- Integration request form: https://www.greenhouse.com/integration-partner#apply-now
