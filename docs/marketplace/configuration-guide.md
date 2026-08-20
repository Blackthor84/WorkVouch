# Configuration Guide

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `ATS_ENABLED` | Master Connect toggle (`true`) |
| `GREENHOUSE_ENABLED` | Greenhouse provider toggle |
| `GREENHOUSE_CLIENT_ID` | OAuth client ID |
| `GREENHOUSE_CLIENT_SECRET` | OAuth client secret |
| `GREENHOUSE_REDIRECT_URI` | OAuth callback URL |
| `GREENHOUSE_WEBHOOK_SECRET` | Hookshot HMAC secret |
| `ATS_ENCRYPTION_KEY` | 32-byte hex for token encryption |
| `PANEL_JWT_SECRET` | Panel session JWT signing |
| `CRON_SECRET` | Protects cron/import/health routes |

## Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `CONNECT_DEMO_MODE_ENABLED` | `false` | Allow `?demo=1` panel in production |
| `CONNECT_RATE_LIMIT_PER_MIN` | `120` | Per-IP rate limit for Connect routes |
| `UPSTASH_REDIS_REST_URL` | — | Upstash Redis REST URL (production rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | — | Upstash Redis REST token |
| `REDIS_URL` | — | Standard Redis URL (alternative to Upstash) |
| `RATE_LIMIT_STORE` | auto | `memory`, `upstash`, or `redis` |
| `SENTRY_DSN` | — | Production error/warning forwarding |

## Employer Settings (Portal)

- **Automation rules** — lifecycle triggers (e.g. on application, on stage change)
- **Sync settings** — incremental import frequency
- **Reconnect** — refresh OAuth when token expires

## Greenhouse-Side Settings

- Webhook events: candidate, application, job (as needed)
- Panel iframe dimensions: recommended 400×600 minimum

## Production Checklist

- [ ] No dev crypto fallbacks (secrets required in production)
- [ ] `CONNECT_DEMO_MODE_ENABLED=false` unless reviewer sandbox
- [ ] Cron jobs configured for import + health

See [../operations/production-deployment.md](../operations/production-deployment.md).
