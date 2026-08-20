# Connect Monitoring

## Key Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Webhook error rate | `connect_webhook_log.status` | > 5% in 1h |
| Dead letter count | `connect_webhook_log.status = 'dead_letter'` | > 10 |
| OAuth refresh failures | Recovery service logs | > 3 per connection |
| Health score | `/employer/integrations/health` | < 70 |
| Panel load time | `X-Panel-Generated-At` delta | > 3s |
| Import duration | Harvest import response | > 60s |

## Queries

```sql
-- Failed webhooks last 24h
SELECT status, COUNT(*) FROM connect_webhook_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Connections needing reconnect
SELECT id, status, token_status FROM connect_connections
WHERE status IN ('reconnect_required', 'error');
```

## Logging

Structured logs via `StructuredLoggingService` — wire sink to Datadog/Sentry in production.

Required log events:
- Webhook received (correlation ID, no payload)
- OAuth connect complete
- Import start/complete
- Recovery backoff
- Panel token issued

## Health Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/integrations/v1/health?connectionId=` | Cron or employer | Internal health |
| `GET /api/employer/integrations/connections/[id]/health` | Employer | Dashboard |

## Uptime Checks

- Employer integrations page loads (200)
- Webhook endpoint responds (signature fail = 401 expected without sig)
- Supabase connectivity

## Related

- [on-call-runbook.md](./on-call-runbook.md)
- [../runbooks/health-checks.md](../runbooks/health-checks.md)
