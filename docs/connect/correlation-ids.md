# WorkVouch Connect — Correlation IDs

## Format

Correlation IDs are generated via `createCorrelationId(prefix)`:

- Pipeline: `pipe-{uuid}`
- Connect: `connect-{uuid}`
- Events: `evt-{uuid}`
- Custom: passed explicitly per request

## Explorer

`CorrelationExplorerService` aggregates everything for a correlation ID:

```typescript
const exploration = connect.exploreCorrelation("corr-abc123");

exploration.events;       // All connect event records
exploration.timeline;     // Combined timeline
exploration.auditTrail;   // All audit entries
exploration.logs;         // Structured log entries
exploration.replayHistory; // Replay attempts
```

## Best Practices

1. Pass correlation ID from webhook ingress through translation
2. Include in all structured log context
3. Return correlation ID in internal API responses for support tickets
4. Use `exploreCorrelation()` as the first step in incident response

## End-to-End Trace

```
Webhook received (corr-123)
  → Translation log (corr-123)
  → Bus publish (corr-123)
  → Consumer log (corr-123)
  → Audit trail (corr-123)
```

One correlation ID traces the entire pipeline.
