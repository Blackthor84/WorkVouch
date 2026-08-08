# OAuth Credential Rotation

## Greenhouse OAuth App Credentials

1. Create new credentials in Greenhouse developer portal (or rotate existing)
2. Update `GREENHOUSE_CLIENT_ID` and `GREENHOUSE_CLIENT_SECRET` in hosting env
3. Deploy — no code change required
4. Existing connections continue using stored tokens until expiry
5. `ConnectRecoveryService` refreshes tokens automatically on 401

## Force Reconnect (if secret compromised)

1. Set affected connections to `status = 'reconnect_required'`
2. Clear encrypted tokens (support script — admin only)
3. Employers reconnect via `/employer/integrations/connect`

## ATS Encryption Key Rotation

**High risk** — invalidates all stored OAuth tokens.

1. Export connection list (employer IDs only, no tokens)
2. Generate new base64 AES-256 key
3. Decrypt all tokens with old key, re-encrypt with new key (migration script required)
4. Update `ATS_ENCRYPTION_KEY`
5. Verify one connection health check

If migration script unavailable: force full reconnect for all employers.

## Panel JWT Secret

1. Update `PANEL_JWT_SECRET`
2. Deploy
3. All active panel iframes need new token (15-min TTL — self-healing)

## Webhook Secret

1. Update secret in Greenhouse Hookshot
2. Update `GREENHOUSE_WEBHOOK_SECRET`
3. Deploy
4. Send test webhook; verify signature passes

## Related

- [secret-rotation.md](./secret-rotation.md)
- [../connect/oauth-persistence.md](../connect/oauth-persistence.md)
