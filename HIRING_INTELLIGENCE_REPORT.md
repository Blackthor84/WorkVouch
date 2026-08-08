# Hiring Intelligence Report — Sprint 8A

**Operation:** GREENHOUSE  
**Sprint:** 8A  
**Phase:** Hiring Intelligence & Business Metrics  
**Connect Platform Version:** 1.0.0  
**Date:** August 2026

---

## Summary

Sprint 8A introduces the **Hiring Intelligence Engine** — business metrics derived entirely from the immutable Connect event store. WorkVouch can now answer how fast hiring workflows run, how reliable automation is, and how much recruiter time is saved.

Technical metrics (health, replay, sync) prove the platform works. Business metrics prove WorkVouch is **valuable**.

---

## Components Created

| Component | File | Purpose |
|-----------|------|---------|
| `HiringMetricsEngine` | `intelligence/hiring-metrics-engine.ts` | Main orchestrator |
| `HiringMetricsCalculator` | `intelligence/hiring-metrics-calculator.ts` | Funnel + metric calculations |
| `HiringMetricsAggregator` | `intelligence/hiring-metrics-aggregator.ts` | Multi-dimensional rollup |
| `HiringMetricsRepository` | `intelligence/hiring-metrics-repository.ts` | Snapshot persistence interface |
| `InMemoryHiringMetricsRepository` | `intelligence/in-memory-hiring-metrics-repository.ts` | In-memory snapshots |
| `HiringMetricsSnapshotService` | `intelligence/hiring-metrics-snapshot-service.ts` | Periodic snapshot generation |
| `HiringMetricsScheduler` | `intelligence/hiring-metrics-scheduler.ts` | Automated snapshot scheduling |
| `types.ts` | Funnel stages, metrics bundles, ROI constants |

---

## Metrics Implemented

### Core (11/11)

| Metric | Status |
|--------|--------|
| Time import → invitation sent | ✅ |
| Invitation acceptance rate | ✅ |
| Invitation decline rate | ✅ |
| Verification completion rate | ✅ |
| Average verification time | ✅ |
| Reference completion rate | ✅ |
| Average reference response time | ✅ |
| ATS event → workflow completion | ✅ |
| Automation success rate | ✅ |
| Workflow failure rate | ✅ |
| Average processing time | ✅ |

### Advanced (9/9)

| Metric | Status |
|--------|--------|
| Import success % | ✅ |
| Automation trigger % | ✅ |
| Replay rate | ✅ |
| Manual override % | ✅ |
| Average candidate processing time | ✅ |
| Average employer setup time | ✅ |
| Sync success % | ✅ |
| Recovery success % | ✅ |
| Queue wait time | ✅ |

### ROI (6/6)

| Metric | Status |
|--------|--------|
| Hours saved | ✅ |
| Manual tasks eliminated | ✅ |
| Average time saved per candidate | ✅ |
| Candidates processed automatically | ✅ |
| Manual follow-up reduction | ✅ |
| Automation coverage % | ✅ |

---

## Aggregation Coverage

| Dimension | Status |
|-----------|--------|
| Per candidate | ✅ |
| Per job | ✅ |
| Per department | ✅ |
| Per employer | ✅ |
| Per provider | ✅ |
| Per connection | ✅ |
| Per day | ✅ |
| Per week | ✅ |
| Per month | ✅ |

## Historical Trends

| Period | Status |
|--------|--------|
| 7 day | ✅ |
| 30 day | ✅ |
| 90 day | ✅ |
| Year to date | ✅ |
| Lifetime | ✅ |
| Period comparison (delta) | ✅ |

---

## Performance

| Metric | Result |
|--------|--------|
| Integration tests | 111/111 passing |
| Sprint 8A tests | 5/5 passing |
| Calculation | In-memory from filtered event timeline |
| Snapshot strategy | Pre-computed JSONB bundles in `connect_hiring_metrics_snapshots` |

Event store `TimelineFilter` extended with `connectionId`, `fromOccurredAt`, `toOccurredAt` for efficient queries.

---

## Snapshot Strategy

1. **Live compute** — `computeMetrics()` for real-time dashboards
2. **Periodic snapshots** — `captureSnapshot()` for trend charts without full recalculation
3. **Scheduler** — hourly/daily automated capture via `HiringMetricsScheduler`
4. **Comparison** — current vs previous period deltas for Customer Success reviews

---

## API

```
GET  /api/employer/integrations/intelligence?period=30d&compare=true
POST /api/employer/integrations/intelligence
```

Wired via `runtime.hiringMetrics` on Connect runtime.

---

## Future Dashboard Ideas

1. **ROI card** on integration dashboard — hours saved, automation coverage
2. **Funnel visualization** — stage conversion rates with drop-off highlights
3. **Trend charts** — 30-day invitation acceptance rate over time
4. **Job comparison** — which roles have fastest verification
5. **CS monthly report** — auto-generated PDF from snapshots

---

## Future AI Opportunities

1. **Trigger optimization** — ML model suggests best invite stage per job type
2. **Anomaly detection** — alert when verification completion rate drops
3. **Predictive ROI** — forecast hours saved based on pipeline volume
4. **Smart delays** — adjust invitation delay based on reference response patterns
5. **Workflow A/B testing** — compare automation configs using metric deltas

All AI features can consume `HiringMetricsBundle` and snapshot history without new data pipelines.

---

## Final Review

### Can a customer see WorkVouch makes hiring faster, more efficient, and trustworthy?

**YES** — via `/api/employer/integrations/intelligence`:
- Import → invite time shows speed
- Verification/reference completion rates show trust workflow progress
- Automation coverage shows efficiency

### Can Customer Success demonstrate ROI?

**YES** — `roi.hoursSaved`, `manualTasksEliminated`, and `automationCoverageRate` provide concrete talking points.

### Can future AI optimize workflows using these metrics?

**YES** — immutable event-derived metrics with dimensional aggregation and historical snapshots provide the training/evaluation data AI needs.

---

## Protected Systems

| System | Modified |
|--------|----------|
| Trust Engine | ❌ No |
| Verification Engine | ❌ No |
| Billing | ❌ No |
| Authentication | ❌ No |
| Existing Employer Dashboard | ❌ No (additive API only) |
| Worker/Admin Dashboards | ❌ No |

---

## Documentation

- `docs/connect/hiring-intelligence.md`
- `docs/connect/business-metrics.md`
- `docs/connect/roi-calculations.md`
- `docs/connect/aggregation-engine.md`
