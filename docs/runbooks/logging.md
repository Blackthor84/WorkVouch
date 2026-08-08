# Logging — ATS Integration Platform

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Structured Log Fields

Every integration log entry includes:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO 8601 UTC |
| `level` | debug \| info \| warn \| error |
| `provider` | Provider ID or `platform` |
| `correlationId` | Trace ID for request/event chain |
| `companyId` | Employer account ID (when available) |
| `event` | Event name (e.g. `provider.connect`) |
| `durationMs` | Operation duration (when measured) |
| `result` | success \| failure \| partial \| accepted \| rejected |
| `error` | Error message (on failure) |
| `metadata` | Additional context |

---

## Usage

```typescript
logger.info("Provider connect completed", {
  provider: "mock",
  correlationId: "connect_abc123",
  companyId: employerAccountId,
  event: "provider.connect",
}, { durationMs: 142 });
```

---

## Production (Sprint 3B+)

- Attach log sink to observability pipeline
- Never log OAuth tokens, webhook secrets, or full webhook payloads
- Log payload hash only for webhooks

---

## Related

- `lib/integrations/logging/LoggingService.ts`
- `docs/integration-contract/09-error-catalog.md`
