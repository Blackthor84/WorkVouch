# Security (Marketplace)

## Authentication

- **OAuth 2.0 with PKCE** for Greenhouse Harvest
- **CSRF state** stored server-side in `connect_oauth_state`
- **Employer session** required for all portal and connection APIs

## Webhook Security

- HMAC-SHA256 signature verification (`GREENHOUSE_WEBHOOK_SECRET`)
- Rejects unsigned or invalid payloads before processing
- Rate limited per IP

## Token Storage

- Access/refresh tokens encrypted at rest (AES-256-GCM)
- Encryption key required in production (`ATS_ENCRYPTION_KEY`)
- No tokens in logs or diagnostic bundles (auto-redacted)

## Panel Security

- Short-lived JWT (15 minutes)
- Token delivered via `Authorization` header — not URL query string
- Demo mode gated in production unless `CONNECT_DEMO_MODE_ENABLED=true`

## RBAC

- Employers can only access their own connections
- Connection ownership verified on every API route
- Service role used server-side only (no client DB access)

## Input Validation

- Zod schemas on API inputs
- Webhook payload validated before event store append

## Rate Limiting

- Connect routes rate limited via in-memory store (upgrade to Redis for multi-instance)

## Data Minimization

- Location: country/state only (no city, ZIP, GPS)
- Diagnostic bundles redact secrets, PII beyond support need

## Compliance Alignment

- SOC2-oriented: least privilege, audit trail, encryption at rest
- Full internal review: [../../SECURITY_REVIEW.md](../../SECURITY_REVIEW.md)

## Reporting Issues

security@workvouch.com — see [support.md](./support.md)
