# On-Call Runbook

## First 5 Minutes

1. Acknowledge alert
2. Check Vercel deployment status (recent deploy?)
3. Check Supabase status
4. Set `ATS_ENABLED=false` if SEV1 security issue
5. Open `#incidents` channel

## Common Issues

### "Greenhouse connection failed"

1. Check `connect_connections.status` and `token_status`
2. Health report → OAuth component
3. Guide employer to Reconnect
4. If widespread → check Greenhouse API status

### "Webhooks not syncing"

1. Query `connect_webhook_log` for recent entries
2. Check signature failures (wrong `GREENHOUSE_WEBHOOK_SECRET`)
3. Replay from Replay Center

### "Panel blank in Greenhouse"

1. Verify panel token not expired (15 min)
2. Check `X-Panel-Token` header delivery (not URL)
3. Test `/integrations/greenhouse/panel?demo=1&scenario=high` (non-prod or demo enabled)

### "Import stuck"

1. Check sync cursor in employer portal
2. Trigger manual import from dashboard
3. Review Harvest rate limits in health report

## Tools

- Diagnostic bundle: employer downloads from provider details
- Event explorer: `/employer/integrations/events`
- Replay center: `/employer/integrations/replay`

## Escalation Matrix

| Issue | Owner |
|-------|-------|
| OAuth / tokens | Backend engineer |
| Webhook / sync | Connect platform |
| Panel / UI | Frontend |
| Security | Security lead + disable Connect |

## Related

- [incident-response.md](./incident-response.md)
- [monitoring.md](./monitoring.md)
