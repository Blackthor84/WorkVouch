# Event Explorer

Search and audit integration events for a connection.

## Route

```
/employer/integrations/events?connectionId={uuid}
```

## Search

Filter by **correlation ID** to trace a single webhook or import through the full pipeline.

## Data sources

| Source | Table | Fields |
|--------|-------|--------|
| Event store | `connect_event_store` | universal event, aggregate, correlation ID, timestamp |
| Webhook log | `connect_webhook_log` | provider event, universal event, status |

## API

```
GET /api/employer/integrations/connections/{connectionId}/events
GET /api/employer/integrations/connections/{connectionId}/events?correlationId=corr-abc
```

## Event table columns

- Universal event type
- Aggregate (type:id)
- Correlation ID
- Occurred at (relative time)

## Replay

From the event explorer, use the **Replay center** to replay failed events:

```
POST /api/employer/integrations/connections/{connectionId}/events/{eventId}/replay
{ "mode": "simulation" | "live" }
```

## Audit trail

Full audit trail available via Connect platform internals (`runtime.connect.getAuditTrail`). Employer UI shows persisted event store records.

## Related

- [Replay center](/employer/integrations/replay)
- [Sync history](/employer/integrations/sync)
- [Health dashboard](./health-dashboard.md)
