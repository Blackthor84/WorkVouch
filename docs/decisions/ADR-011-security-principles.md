# ADR-011: Security Principles

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform handles OAuth tokens, webhook secrets, candidate data, and trust scores. It connects to external systems (Greenhouse) and serves embedded UI inside a third-party application. Security failures could expose employer data, candidate PII, or allow forged trust score exports.

---

## Decision

Adopt these **non-negotiable security principles** for the integration platform:

1. **Encrypt all secrets at rest** — OAuth tokens, refresh tokens, webhook secrets (AES-256-GCM)
2. **Verify all inbound webhooks** — HMAC-SHA256 with timing-safe comparison; 401 on failure
3. **Tenant isolation** — RLS on all `ats_*` tables; `employer_account_id` on every query
4. **Read-only access to trust engine** — Integration reads `trust_scores`; never writes or recalculates
5. **Data minimization** — Export aggregate counts only; never vouch text, reference names, or verifier identity
6. **Location safety** — Country/state only; never city, ZIP, lat/lng, GPS
7. **No secrets in logs** — Payload hash only; never log tokens, secrets, or full webhook payloads
8. **Admin client only** — All API routes use `admin` from `@/lib/supabase-admin`
9. **CSRF protection** — OAuth state tokens with 15-min TTL
10. **Panel auth** — JWT with 15-min expiry; signed with server secret; no session cookie in iframe
11. **Rate limiting** — Internal API rate limits per employer
12. **Fail secure** — Invalid auth returns 401/403; never returns data on auth failure

---

## Consequences

**Positive:**
- SOC2-aligned data handling
- Privacy policy enforceable by architecture (not just policy)
- Forged webhooks cannot link wrong candidates
- Token compromise limited to one employer (tenant isolation)
- Marketplace security review passable

**Negative:**
- Encryption adds latency to token read/write
- JWT panel auth requires token refresh logic in iframe
- Data minimization limits some recruiter-requested features (vouch text export)
- RLS adds query complexity

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Store tokens in plaintext | Unacceptable security risk |
| Skip webhook verification | Forged webhooks could trigger invitations and link wrong candidates |
| Export vouch text to GH | Violates privacy policy; reference providers didn't consent to GH export |
| User-scoped Supabase client in API routes | Violates workspace rule; integration needs admin access for cross-table reads |
| Session cookie auth for panel iframe | Cross-origin cookie issues; GH iframe may block third-party cookies |

---

## Future Impact

- KMS migration in V2 replaces env var encryption key
- Penetration test before marketplace submission
- SOC2 Type II audit in V3 uses these principles as controls

---

## Related

- [ADR-009](./ADR-009-why-oauth-over-api-keys.md)
- [docs/integrations/11-security.md](../integrations/11-security.md)
- [.cursor/rules/workvouch-location-safety.mdc](../../.cursor/rules/workvouch-location-safety.mdc)
