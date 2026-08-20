# ADR-009: Why OAuth Was Selected Over API Keys

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

Greenhouse supports two authentication methods for Harvest API:
1. **API keys** (Basic auth with per-user token)
2. **OAuth 2.0** (authorization code flow with PKCE)

WorkVouch needs to read candidates, write custom fields, and register webhooks on behalf of the employer.

---

## Decision

Use **OAuth 2.0 with PKCE** for Greenhouse connection. API key auth is not supported in V1.

Flow:
1. Employer admin clicks "Connect Greenhouse"
2. Redirect to GH OAuth consent screen
3. Exchange authorization code for access + refresh tokens
4. Store encrypted tokens in `ats_connections`
5. Register webhooks programmatically
6. Refresh tokens proactively (daily cron) and reactively (on 401)

---

## Consequences

**Positive:**
- Greenhouse marketplace requires OAuth for partner integrations
- Employer explicitly grants permission (consent screen)
- Scoped access (read/write only what's needed)
- Token refresh enables long-lived connections without employer action
- Revocation is clean (disconnect zeros tokens)
- Multi-user: any org admin can connect; token serves whole org

**Negative:**
- OAuth flow is more complex than API key paste
- Token refresh adds cron job and failure mode (token expiry)
- Requires GH OAuth app registration (external dependency)
- PKCE adds implementation complexity

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| API key (Basic auth) | Not accepted by GH marketplace; no programmatic webhook registration; per-user not per-org; no refresh |
| API key with manual webhook setup | Poor UX; employer must configure webhooks manually; error-prone |
| OAuth without PKCE | Less secure; GH may require PKCE for marketplace partners |
| Service account / bot token | GH doesn't support service accounts for Harvest API |

---

## Future Impact

- OAuth pattern applies to Lever, Ashby (all modern ATS use OAuth)
- Workday may require different auth (noted in provider manifest)
- Token encryption key rotation procedure documented for ops

---

## Related

- [ADR-005](./ADR-005-why-greenhouse-is-provider-1.md)
- [docs/integrations/06-oauth-design.md](../integrations/06-oauth-design.md)
- [docs/integration-contract/05-api-contract.md](../integration-contract/05-api-contract.md)
