# Health Dashboard

Employer-facing health monitoring for Connect integrations.

## Route

```
/employer/integrations/health?connectionId={uuid}
```

## Metrics displayed

| Metric | Source |
|--------|--------|
| Overall score (0–100) | `ConnectHealthService.evaluate()` |
| Overall status | healthy / degraded / unhealthy |
| OAuth | Token validity, expiry |
| Provider | Greenhouse registration |
| Harvest API | Live API latency test |
| Connection | Status, last sync |
| Persistence | Event store availability |
| Database | Supabase connectivity |
| Replay | Replay service readiness |
| Projection | Projection lag |
| Snapshots | Snapshot service |
| Cursor | Sync cursor health |
| Webhook metrics | Delivery success, DLQ count, avg latency |

## API

```
GET /api/employer/integrations/connections/{connectionId}/health
```

Returns:

```json
{
  "report": { "overallScore": 92, "components": [...] },
  "webhookMetrics": { "deliverySuccess": 48, "deadLetterCount": 0 },
  "lifecycle": { "automationTriggers": 12, "workflowsSucceeded": 11 }
}
```

## Component cards

Each health component shows:

- Name
- Status badge (color-coded)
- Message
- Latency (when available)

## When to use

- After connecting Greenhouse — verify all components green
- When sync stops — check OAuth and Harvest components
- When webhooks fail — check DLQ count and webhook metrics
