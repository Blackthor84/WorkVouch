# Diagnostic Bundle Redaction Policy

All diagnostic bundles are redacted **before** export. Support engineers receive only sanitized data.

## Redacted Categories

| Category | Examples | Replacement |
|----------|----------|-------------|
| OAuth tokens | `accessToken`, `refreshToken` | `[REDACTED]` |
| API keys | `apiKey`, `api_key` | `[REDACTED]` |
| Secrets | `clientSecret`, `password` | `[REDACTED]` |
| Authorization | `authorization`, `Bearer …` | `[REDACTED]` |
| Session | `sessionId`, `cookie` | `[REDACTED]` |
| Encryption | `encrypted`, `privateKey` | `[REDACTED]` |
| Credentials | `credential`, `bearer` | `[REDACTED]` |

## Value Pattern Detection

Values matching these patterns are redacted regardless of key name:

- `Bearer …`
- `gho_`, `ghp_` (Greenhouse tokens)
- `sk_` (API key prefixes)
- JWT (`eyJ…`)
- Long opaque strings (>32 chars, base64-like)

## PII Handling

| Field | Treatment |
|-------|-----------|
| Email addresses | Masked: `j***@domain.com` |
| Names | Retained (needed for support context) |
| Candidate IDs | Retained (aggregate IDs, not PII) |

## Redaction Audit

Every redaction is recorded in `bundle.redactions`:

```json
{
  "path": "root.connection.accessToken",
  "reason": "secret_key",
  "originalType": "string"
}
```

## Post-Export Validation

`BundleValidator` runs `scanForSecretLeaks()` on the full bundle. Export fails if:

- Bearer tokens remain in plaintext
- JWT prefixes detected unredacted
- Secret key names hold non-`[REDACTED]` values

## What Is Never Included

- Raw OAuth access or refresh tokens
- Encryption keys or cipher material
- Authorization headers from webhook payloads
- Session cookies or session IDs
- Greenhouse client secrets
- Full email addresses (masked only)

## Support Guidance

If a bundle fails validation during generation, the employer sees an error. Do not request raw tokens from customers — use **Reconnect OAuth** and replay failed events in simulation mode instead.
