# Secret Rotation

## Rotation Schedule

| Secret | Recommended Interval | Impact |
|--------|---------------------|--------|
| `GREENHOUSE_WEBHOOK_SECRET` | 90 days | Update Hookshot + env |
| `PANEL_JWT_SECRET` | 90 days | Panel tokens refresh in 15 min |
| `CRON_SECRET` | 90 days | Update cron jobs |
| `GREENHOUSE_CLIENT_SECRET` | Per Greenhouse policy | OAuth refresh handles |
| `ATS_ENCRYPTION_KEY` | Avoid unless breach | Requires token migration |

## Storage

- **Never** commit secrets to git
- Use Vercel encrypted env vars or AWS Secrets Manager
- Separate secrets per environment (staging / production)

## Validation After Rotation

```bash
# Health check (employer session or cron)
curl -H "Authorization: Bearer $CRON_SECRET" \
  "$APP_URL/api/integrations/v1/health?connectionId=..."

# Webhook test via Greenhouse sandbox
```

## Production Guard

Sprint 10 hardening enforces:

- `ATS_ENCRYPTION_KEY` required in production (token encrypt throws without it)
- `PANEL_JWT_SECRET` required in production (JWT sign throws without it)

## Related

- [oauth-credential-rotation.md](./oauth-credential-rotation.md)
- [SECURITY_REVIEW.md](../../SECURITY_REVIEW.md)
