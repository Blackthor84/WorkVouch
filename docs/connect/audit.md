# WorkVouch Connect — Audit Trail

## Service

`AuditService` — `lib/integrations/connect/audit/`

## Tracked Actions

| Action | When |
|--------|------|
| `received` | Provider payload enters connect |
| `validated` | Validation completes |
| `mapped` | Mapper produces universal model |
| `published` | Event published to bus |
| `consumed` | Consumer processes event |
| `succeeded` | Pipeline completes |
| `failed` | Validation or translation fails |
| `retried` | Replay attempted |

## Usage

```typescript
const trail = connect.getAuditTrail(eventId);

for (const entry of trail) {
  console.log(entry.action, entry.timestamp, entry.message);
}
```

## Structured Logs

Every audit action also writes to `StructuredLoggingService` with event `connect.audit.{action}`.

## Retention

In-memory only (Sprint 3B-3). Persistent audit storage planned for a future sprint.
