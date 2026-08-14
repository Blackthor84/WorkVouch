# 03 — Partner OAuth Audit

**Date:** 2026-08-13  
**Reference:** [Greenhouse Partner OAuth Guide](https://harvestdocs.greenhouse.io/docs/harvest-partner-oauth)  
**Implementation:** `lib/integrations/providers/greenhouse/auth/oauth-service.ts`, `config/manifest.ts`

---

## Executive Answer

**Is our OAuth compatible with Greenhouse Partner OAuth?**  
**PARTIALLY — significant differences that must be validated with Greenhouse before sandbox testing.**

The implementation follows OAuth 2.0 Authorization Code Grant conceptually, but **differs from the official partner guide** on URLs, token authentication method, scopes, and PKCE.

---

## Side-by-Side Comparison

| Aspect | Greenhouse Partner Guide | WorkVouch Implementation | Status |
|--------|-------------------------|------------------------|--------|
| Authorization URL | `https://auth.greenhouse.io/authorize` | `https://auth.greenhouse.io/oauth/authorize` | **MISMATCH** |
| Token URL | `https://auth.greenhouse.io/token` | `https://auth.greenhouse.io/oauth/token` | **MISMATCH** |
| Revoke URL | Not in partner guide | `https://auth.greenhouse.io/oauth/revoke` | **UNKNOWN** |
| Grant type | `authorization_code` | `authorization_code` | ✅ |
| `response_type=code` | Required | Set | ✅ |
| Client ID in authorize | Query param | Query param | ✅ |
| Redirect URI | Registered with partner | Dynamic from request origin + callback path | **VERIFY** |
| Scopes | Granular V3 (e.g. `harvest:candidates:list`) | `harvest:read harvest:write harvest:webhooks` | **MISMATCH** |
| State (CSRF) | Recommended | Required, 15-min TTL, single-use | ✅ |
| PKCE | **Not mentioned** in partner guide | **Required** (S256, code_verifier) | **UNKNOWN** — may be compatible but unverified |
| Token exchange auth | `Authorization: Basic base64(client_id:secret)` | Form body: `client_id`, `client_secret`, `code_verifier` | **MISMATCH** |
| Token exchange params | Query: `grant_type`, `code` | Form body: all params | **MISMATCH** |
| Access token TTL | 1 hour | Parsed from `expires_in` in response | ✅ (if response shape matches) |
| Refresh token TTL | 24 hours | Handled via refresh; reconnect on failure | **PARTIAL** |
| Refresh rotation | New refresh token on each refresh | `updateTokens()` stores new pair | ✅ (if response includes new refresh) |
| Code expiry | 1 minute | No explicit timeout handling documented | **GAP** |
| Token storage | Encrypted at rest | AES-256-GCM via `ATS_ENCRYPTION_KEY` | ✅ |
| Production secrets | Required | Enforced in production | ✅ |
| Disconnect/revoke | Not detailed | `revoke()` POST to revoke URL | **PARTIAL** |
| Error handling | JSON error shapes documented | `IntegrationPlatformError` codes | **PARTIAL** — may not parse partner error JSON |
| Callback errors | `error` + `error_description` query params | State validation; error param handling **not verified** | **GAP** |

---

## Implementation Details

### Authorization (startConnect)

```47:54:lib/integrations/providers/greenhouse/auth/oauth-service.ts
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", this.config.oauth.scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
```

### Token exchange (NOT partner pattern)

```172:179:lib/integrations/providers/greenhouse/auth/oauth-service.ts
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code_verifier: input.codeVerifier,
    });
```

Partner guide expects:

```http
POST https://auth.greenhouse.io/token?grant_type=authorization_code&code=...
Authorization: Basic base64(client_id:client_secret)
```

### Refresh

```125:130:lib/integrations/providers/greenhouse/auth/oauth-service.ts
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
```

Partner guide expects Basic auth header, not form-body client credentials.

### Scopes declared

```4:9:lib/integrations/providers/greenhouse/config/manifest.ts
  scopes: ["harvest:read", "harvest:write", "harvest:webhooks"],
  pkceRequired: true,
```

Partner program expects granular scopes registered at credential issuance time.

---

## PKCE Assessment

**Do not assume PKCE is required** — partner guide does not mention it. WorkVouch implements PKCE unconditionally. This may:

- Be ignored by Greenhouse (harmless)
- Cause authorization failures if partner OAuth rejects unknown params
- Be required for a different OAuth profile (non-partner)

**Status: UNKNOWN UNTIL SANDBOX** — ask Greenhouse partner support explicitly.

---

## Reauthorization Behavior

- `ConnectRecoveryService` refreshes tokens before import/sync
- Refresh failure → connection status `reconnect_required` (employer portal)
- 24-hour refresh TTL per partner guide → proactive refresh scheduling should be verified

---

## Production Secret Handling

- `PANEL_JWT_SECRET`, `ATS_ENCRYPTION_KEY` enforced in production
- OAuth client secret from env
- Tokens encrypted at rest
- Diagnostic bundles redact secrets

---

## Required Changes Before Sandbox (OAuth)

1. Confirm correct authorization/token URLs with Greenhouse (`/authorize` vs `/oauth/authorize`)
2. Switch token exchange to Basic auth per partner guide (or confirm hybrid support)
3. Replace coarse scopes with approved granular V3 scopes
4. Register exact redirect URI(s) with partner support
5. Handle 1-minute authorization code expiry (fast exchange)
6. Parse partner error JSON on authorize redirect and token exchange
7. Confirm PKCE compatibility or remove if rejected
8. Verify refresh token rotation stores new refresh token every hour

---

## What Can Be Tested Now

- State TTL and CSRF logic (unit tests)
- Token encryption/decryption
- Employer auth on connect routes
- Mock OAuth flow in `tests/integrations/greenhouse-provider.test.ts`

## What Must Wait for Greenhouse

- Real authorize redirect
- Real token exchange response shape (`expires_at` vs `expires_in`)
- Scope approval and 403 on unauthorized scopes
- Site Admin authorization requirement for list endpoints
