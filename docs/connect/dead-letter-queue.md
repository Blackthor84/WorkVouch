# Dead Letter Queue

Failed webhook events are never silently discarded. WorkVouch Connect routes failures to the Dead Letter Queue (DLQ) for investigation and replay.

## When Events Enter DLQ

- Unsupported webhook action (after logging)
- Translation/validation failure
- Processing exception
- Retry exhaustion (event bus path)

## Storage

| Layer | Purpose |
|-------|---------|
| `DeadLetterQueue` (in-memory) | Runtime replay during process lifetime |
| `connect_webhook_log` status `dead_letter` | Persistent audit trail |

## Replay

```typescript
const result = await runtime.webhooks.replayDeadLetter(webhookLogId);
```

DLQ replay re-processes the original payload through the full webhook pipeline.

## Monitoring

Check DLQ depth via webhook metrics:

```typescript
runtime.webhookMetrics.getSnapshot().deadLetterCount
runtime.webhookMetrics.getSnapshot().queueDepth
```

## Contract

Per integration contract: return `200 OK` to Greenhouse even when internal processing fails. Internal failures are handled by DLQ + retry — Greenhouse must not retry due to application errors.

## Operations

1. Inspect `connect_webhook_log` for `status = 'dead_letter'`
2. Fix root cause (mapping, validation, connection)
3. Replay via `WebhookService.replayDeadLetter()`
4. Verify event store and projections updated
