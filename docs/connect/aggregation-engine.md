# Aggregation Engine

Rolls up candidate-level metrics to multiple business dimensions.

## Dimensions

| Level | Key | Use Case |
|-------|-----|----------|
| `candidate` | candidate external ID | Individual funnel analysis |
| `job` | job external ID | Per-role hiring velocity |
| `department` | department name | Org unit reporting |
| `employer` | employer account ID | Account-level ROI |
| `provider` | ATS provider (greenhouse) | Provider comparison |
| `connection` | connection UUID | Per-integration instance |

## Time Periods

Aggregation supports all periods: `day`, `week`, `month`, `7d`, `30d`, `90d`, `ytd`, `lifetime`.

## Usage

```typescript
const byJob = await runtime.hiringMetrics.aggregate(
  { employerAccountId: "employer-1", period: "30d" },
  "job"
);

for (const [jobId, metrics] of byJob) {
  console.log(jobId, metrics.core.invitationAcceptanceRate);
}
```

## Trend Comparisons

Compare current period vs previous equal-length period:

```typescript
const comparison = await runtime.hiringMetrics.compareTrends("employer-1", "30d");
// comparison.delta.importToInvitationMs — improvement vs prior 30 days
```

## Snapshots

Periodic snapshots avoid recalculating full event history:

```typescript
await runtime.hiringMetrics.captureSnapshot({
  employerAccountId: "employer-1",
  period: "30d",
});

const history = await runtime.hiringMetrics.listSnapshots({
  employerAccountId: "employer-1",
  period: "30d",
  limit: 12,
});
```

Stored in `connect_hiring_metrics_snapshots`.

## Scheduler

```typescript
// Manual trigger
await runtime.hiringMetrics.runScheduledSnapshots("employer-1");

// Interval-based (hourly default)
runtime.hiringMetrics.scheduler.start(3_600_000, ["employer-1", "employer-2"]);
```

Default snapshot periods per run: `day`, `7d`, `30d`.

## Performance

Metrics are computed in-memory from filtered event store timelines. For large employers, use snapshots + period filters rather than lifetime recalculation on every request.
