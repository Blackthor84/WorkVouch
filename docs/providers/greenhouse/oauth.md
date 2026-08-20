# Greenhouse Provider — OAuth

## Flow

Greenhouse uses OAuth 2.0 with PKCE (S256).

1. **Start connect** — `GreenhouseProvider.connect()` without `code`
   - Generates `code_verifier` + `code_challenge`
   - Stores state in `OAuthStateStore`
   - Returns authorization URL

2. **User authorization** — redirect to `https://auth.greenhouse.io/oauth/authorize`

3. **Callback** — `connect()` with `code` + `state`
   - Validates and consumes state (CSRF protection)
   - Exchanges code for tokens at `https://auth.greenhouse.io/oauth/token`
   - Persists encrypted tokens in `TokenStore`

4. **Refresh** — `refreshToken()` uses refresh token grant

5. **Disconnect** — revokes access token at `https://auth.greenhouse.io/oauth/revoke`, deletes connection

## Scopes

| Scope | Purpose |
|-------|---------|
| `harvest:read` | Read Harvest API resources |
| `harvest:write` | Write Harvest API resources |
| `harvest:webhooks` | Manage webhooks (future sprint) |

## PKCE

- `code_verifier`: 32-byte random, base64url
- `code_challenge`: SHA-256 hash of verifier, base64url
- Method: `S256`

## State Validation

- State expires after 15 minutes
- Single-use (consumed on callback)
- Employer account ID must match stored state

## Token Storage

Sprint 3B-1 uses in-memory stores with optional AES-256-GCM encryption via `ATS_ENCRYPTION_KEY`. Database-backed storage ships in Sprint 3B-2.

## Error Codes

| Code | When |
|------|------|
| `OAUTH_CODE_MISSING` | Callback without authorization code |
| `OAUTH_STATE_MISMATCH` | Invalid or expired state |
| `OAUTH_TOKEN_EXCHANGE_FAILED` | Token endpoint error |
| `OAUTH_TOKEN_EXPIRED` | Refresh token invalid |
