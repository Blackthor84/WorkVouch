# 01 — Greenhouse Partner Requirements Audit

**Date:** 2026-08-13  
**Scope:** WorkVouch Connect vs official Greenhouse Partner program requirements  
**Method:** Code inspection + [Harvest Partner OAuth docs](https://harvestdocs.greenhouse.io/docs/harvest-partner-oauth)  
**Code changes:** None (audit only)

---

## Official Partner Requirements (Summary)

Per Greenhouse Harvest Partner documentation:

| Requirement | Official expectation |
|-------------|---------------------|
| API | **Harvest V3** |
| OAuth | Authorization Code Grant; partner client credentials from Greenhouse |
| Partnership | Signed partnership agreement before production credentials |
| Review | Greenhouse review before customer integration |
| Support docs | Required for Partner Directory |
| Demo video | 2–5 minute internal demo (program materials also reference ~90s marketplace video) |
| Beta | Customer beta after Greenhouse approval |
| Directory | Listing after approved docs + successful beta |

---

## WorkVouch Current State vs Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Harvest V3 API | **NOT COMPLIANT** | `HarvestClient` targets `harvest.greenhouse.io/v1` — see `02-harvest-v3-audit.md` |
| Partner OAuth credentials | **BLOCKED** | Uses `GREENHOUSE_CLIENT_ID/SECRET` env vars; no partner credentials issued yet |
| OAuth Authorization Code | **PARTIAL** | Implemented but URL/auth/scopes differ from partner guide — see `03-partner-oauth-audit.md` |
| Partner webhooks | **UNKNOWN / PARTIAL** | Hookshot HMAC ingress exists; partner webhook registration mechanism not verified — see `04-partner-webhook-audit.md` |
| Greenhouse review | **NOT STARTED** | No sandbox credentials; checklist items open in `docs/mvp/03-greenhouse-review-checklist.md` |
| Support documentation | **PARTIAL** | Marketplace package exists (`docs/marketplace/`); provider docs stale |
| Demo video | **MISSING** | Storyboard only — `docs/product-experience/13-marketplace-demo.md`; not produced |
| Customer beta | **NOT STARTED** | Blocked on approval |
| Partner Directory listing | **NOT STARTED** | Blocked on beta + docs |

---

## What Is Built (Connect Platform)

WorkVouch Connect **is feature-complete as an internal integration platform**:

- OAuth connect flow (employer portal wizard)
- Webhook ingress + event store + replay + DLQ
- Incremental Harvest import (jobs, candidates, applications)
- Embedded Greenhouse panel + Hiring Confidence
- Employer portal (health, events, replay, diagnostics)
- Marketplace documentation package (Sprint 10)
- Production hardening (Sprint 10/10.1): env validation, Redis rate limiting, persistent DLQ, Sentry

---

## Critical Compliance Gaps (Pre-Sandbox)

1. **Harvest V1 vs V3** — entire sync layer must migrate before partner certification
2. **OAuth endpoints and scopes** — current config uses legacy `/oauth/*` URLs and coarse `harvest:read/write/webhooks` scopes; partner program uses `/authorize`, `/token`, and granular V3 scopes
3. **Token exchange auth method** — code uses form-body + PKCE; partner guide specifies Basic auth without PKCE
4. **Partner credentials** — no signed agreement / sandbox client yet
5. **Demo assets** — video and screenshots not produced
6. **Provider documentation drift** — `docs/providers/greenhouse/*` describes Sprint 3B-1 state, not current Connect

---

## Recommendation

Treat current Greenhouse integration as a **strong internal MVP on Harvest V1**, not as a **partner-certified V3 integration**. Before sandbox testing, plan a dedicated **Harvest V3 + Partner OAuth migration sprint** after receiving partner credentials and scope approval from `partner-support@greenhouse.io`.

---

## Related Audits

- [02-harvest-v3-audit.md](./02-harvest-v3-audit.md)
- [03-partner-oauth-audit.md](./03-partner-oauth-audit.md)
- [04-partner-webhook-audit.md](./04-partner-webhook-audit.md)
- [07-greenhouse-documentation-audit.md](./07-greenhouse-documentation-audit.md)
