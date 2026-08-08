# Greenhouse Provider — Troubleshooting

## Provider disabled

**Symptom:** `Provider greenhouse is disabled by feature flag`

**Fix:** Set `ATS_ENABLED=true` and `GREENHOUSE_ENABLED=true`.

## Configuration missing

**Symptom:** `Greenhouse configuration missing. Set GREENHOUSE_CLIENT_ID...`

**Fix:** Provide client ID and secret via environment or `ProviderConfiguration`.

## OAuth state mismatch

**Symptom:** `OAuth state is invalid or expired`

**Fix:** Complete callback within 15 minutes. Do not reuse state values. Ensure employer account ID matches.

## Token exchange failed

**Symptom:** `OAUTH_TOKEN_EXCHANGE_FAILED`

**Fix:** Verify redirect URI matches Greenhouse app settings. Confirm PKCE verifier matches original connect request.

## Harvest 401/403

**Symptom:** Health check or test connection fails with auth error

**Fix:** Refresh token. Verify scopes include `harvest:read`. Confirm token not expired.

## Rate limiting

**Symptom:** Intermittent failures with 429

**Fix:** Client auto-retries with backoff. Reduce request frequency in sync sprints.

## Health check unhealthy with valid token

**Symptom:** Token present but health fails

**Fix:** Check network egress to `harvest.greenhouse.io`. Verify base URL configuration.

## Encryption warnings

**Symptom:** Tokens stored with base64 fallback

**Fix:** Set `ATS_ENCRYPTION_KEY` (32-byte key, base64-encoded) in production.
