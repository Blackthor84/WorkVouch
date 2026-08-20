# Connect Production Deployment

## Prerequisites

- Node.js 20+
- Supabase project with all Connect migrations applied
- Vercel (or equivalent) deployment target
- Greenhouse Harvest + Hookshot credentials

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATS_ENABLED` | Yes | Master Connect switch |
| `GREENHOUSE_ENABLED` | Yes | Greenhouse provider |
| `ATS_ENCRYPTION_KEY` | Yes (prod) | Base64 AES-256 key for OAuth tokens |
| `PANEL_JWT_SECRET` | Yes (prod) | Panel iframe JWT signing |
| `GREENHOUSE_CLIENT_ID` | Yes | OAuth client ID |
| `GREENHOUSE_CLIENT_SECRET` | Yes | OAuth client secret |
| `GREENHOUSE_WEBHOOK_SECRET` | Yes | Hookshot HMAC secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side DB access |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL for OAuth callbacks |
| `CRON_SECRET` | Yes | Internal import/health cron auth |
| `CONNECT_DEMO_MODE_ENABLED` | Optional | Enable demo panel in production (reviewers only) |

## Migration Order

Apply in sequence:

1. `20260808120000_connect_event_store.sql`
2. `20260808130000_connect_oauth_snapshots.sql`
3. `20260808140000_connect_sync_cursor.sql`
4. `20260808150000_connect_lifecycle_orchestration.sql`
5. `20260808160000_connect_hiring_intelligence.sql`

## Deployment Steps

1. Set all environment variables in hosting platform
2. Run `npm run build`
3. Apply Supabase migrations: `supabase db push`
4. Verify health: authenticated employer → `/employer/integrations/health`
5. Configure Greenhouse Hookshot webhook URL: `{APP_URL}/api/integrations/v1/webhooks/greenhouse`
6. Configure OAuth redirect: `{APP_URL}/api/integrations/v1/connect/greenhouse/callback`
7. Smoke test OAuth connect flow from employer portal
8. Send test webhook; verify `connect_webhook_log` entry

## Post-Deploy Verification

- [ ] OAuth connect completes
- [ ] Webhook signature validates
- [ ] Panel loads with JWT or employer session
- [ ] Import via employer route succeeds
- [ ] Diagnostic bundle downloads
- [ ] No demo mode unless `CONNECT_DEMO_MODE_ENABLED=true`

## Related

- [release-checklist.md](./release-checklist.md)
- [monitoring.md](./monitoring.md)
- [../connect/troubleshooting.md](../connect/troubleshooting.md)
