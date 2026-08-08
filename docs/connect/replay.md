# WorkVouch Connect — Replay

## Service

`ReplayService` — `lib/integrations/connect/replay/`

## Safety Rules

- **Dry-run by default** — no bus writes unless explicitly disabled
- **Simulation mode** — replays from stored records, no re-translation side effects
- **No duplicate persistence** — event count unchanged after simulate replay
- **Live replay** — only from DLQ, with duplicate prevention

## Methods

| Method | Mode | Description |
|--------|------|-------------|
| `simulateReplay(id)` | dry_run | Full pipeline simulation |
| `dryRunReplay(id)` | dry_run | Translation + validation only |
| `replayEvent(id, options)` | configurable | Custom replay |
| `replayBatch(ids, options)` | configurable | Batch replay |
| `comparePayloads(id, other)` | — | Drift detection |

## Options

```typescript
interface ReplayOptions {
  dryRun?: boolean;           // default true
  simulate?: boolean;           // default true with dryRun
  replayTranslation?: boolean;
  replayValidation?: boolean;
  replayConsumer?: boolean;
  replayPipeline?: boolean;
}
```

## Fixtures

Replay scenarios in `lib/integrations/connect/fixtures/replay/`:

- candidate-created, candidate-updated
- offer-accepted, candidate-hired, candidate-rejected
- webhook-retry, duplicate-event, expired-token, invalid-payload

## Example

```typescript
// Safe — no side effects
const result = connect.simulateReplay(eventId);
console.log(result.stagesReplayed);
console.log(result.validation);
```
