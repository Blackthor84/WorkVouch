# WorkVouch Connect — Timeline

## Service

`TimelineGenerator` — `lib/integrations/connect/timeline/`

## Standard Stages

```
Received → Validated → Mapped → Published → Consumed → Completed
```

Failure and retry branches:

```
Failed (validation/translation error)
Retried (replay attempt)
```

## Usage

```typescript
const timeline = connect.getTimeline(eventId);

for (const stage of timeline) {
  console.log(stage.stage, stage.timestamp, stage.durationMs);
}
```

## Summary

```typescript
const summary = connect.timeline.summarize(eventId);
console.log(summary.totalDurationMs);
console.log(summary.completed);
```

Timestamps and per-stage durations are included for performance analysis.
