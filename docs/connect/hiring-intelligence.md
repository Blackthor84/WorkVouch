# Hiring Intelligence Engine

WorkVouch Connect now measures **business outcomes**, not just technical health.

The Hiring Intelligence Engine derives all metrics from the **immutable Connect event store** — no duplicate business events, no separate analytics pipeline.

## Architecture

```
Connect Event Store (immutable)
  → HiringMetricsCalculator (funnel + timings)
  → HiringMetricsAggregator (per candidate/job/dept/employer)
  → HiringMetricsSnapshotService (periodic snapshots)
  → HiringMetricsScheduler (automated capture)
  → HiringMetricsEngine (orchestrator)
```

## Hiring Funnel

```
Candidate Import → Invitation Sent → Invitation Accepted
  → Verification Started → Verification Completed
  → References Requested → References Completed
  → Trust Updated → Workflow Completed
```

Time between every consecutive stage is calculated per candidate.

## Access

```typescript
const runtime = getConnectApiRuntime();

// Live metrics (computed from event store)
const metrics = await runtime.hiringMetrics.computeMetrics({
  employerAccountId: "employer-1",
  connectionId: "conn-uuid",
  period: "30d",
});

// Capture snapshot for trend analysis
await runtime.hiringMetrics.captureSnapshot({
  employerAccountId: "employer-1",
  period: "30d",
});

// Period comparison
const trends = await runtime.hiringMetrics.compareTrends("employer-1", "30d");
```

## Employer API

```
GET  /api/employer/integrations/intelligence?period=30d&compare=true
POST /api/employer/integrations/intelligence  { period, connectionId }
```

## Business Questions Answered

| Question | Metric |
|----------|--------|
| How long to verify a candidate? | `core.averageVerificationMs` |
| How many finish verification? | `core.verificationCompletionRate` |
| How long do references take? | `core.averageReferenceResponseMs` |
| How many workflows complete automatically? | `roi.candidatesProcessedAutomatically` |
| How much recruiter time saved? | `roi.hoursSaved` |
| How fast does WorkVouch respond? | `core.importToInvitationMs` |
| How reliable is automation? | `core.automationSuccessRate` |

## Related Docs

- [business-metrics.md](./business-metrics.md)
- [roi-calculations.md](./roi-calculations.md)
- [aggregation-engine.md](./aggregation-engine.md)
