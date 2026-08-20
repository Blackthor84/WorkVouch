# WorkVouch Connect — Event Inspector

## Service

`EventInspectorService` — `lib/integrations/connect/inspector/`

## Capabilities

| Method | Description |
|--------|-------------|
| `getEvent(id)` | Fetch connect event record |
| `listEvents(filter?)` | List with provider/correlation/event filters |
| `inspectEvent(id)` | Full inspection bundle |
| `inspectPayload(id)` | Raw provider payload |
| `inspectProviderPayload(id)` | Parsed provider payload |
| `inspectUniversalModel(id)` | Translated universal model |
| `inspectValidation(id)` | Validation result |
| `inspectTranslation(id)` | Mapper + timing info |
| `inspectEventTimeline(id)` | Lifecycle timeline |
| `inspectMetadata(id)` | Replay count, bus status |
| `inspectLogs(id)` | Correlated log entries |

## Usage

```typescript
const inspection = connect.inspectEvent(eventId);

console.log(inspection.payload);
console.log(inspection.universalModel);
console.log(inspection.validation);
console.log(inspection.timeline);
```

## Fortune 500 Debug Workflow

1. Get correlation ID from employer report or logs
2. `connect.exploreCorrelation(correlationId)` 
3. `connect.inspectEvent(eventId)` for full detail
4. Review validation errors and mapper used

Target: under 2 minutes from report to root cause.
