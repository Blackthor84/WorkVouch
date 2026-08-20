# 09 — Post-Launch Roadmap (First 90 Days)

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Overview

```
Day 0 ──── Marketplace Launch ──── Day 30 ──── Day 60 ──── Day 90
  │              │                    │            │            │
  │         Bug fixes            V1.1 patch    V2 start     Lever beta
  │         Monitoring           AI summary   Job sync     10+ customers
  │         Support ramp         Verification  Presets UI   Analytics
  │                              export
```

---

## Days 0–30: Stabilize

### Bug Fixes
- Triage all post-launch bugs within 4 hours
- P0 fix within 24 hours
- P1 fix within 72 hours
- Weekly bug review meeting
- Target: <5 P2 bugs open at Day 30

### Monitoring
- Verify all metrics dashboards operational
- Tune alert thresholds based on real traffic
- Daily integration health check (automated report)
- First weekly metrics report to leadership

### Customer Success
- Welcome email to all new marketplace installs
- Proactive outreach to first 10 installs (offer setup call)
- Document top 3 setup issues and update installation guide
- Collect NPS from first 10 customers at Day 14

### Support
- Monitor support@workvouch.com for integration tickets
- Update troubleshooting guide based on real tickets
- Train support team on top 5 error codes
- Target: <10 integration tickets in first 30 days

---

## Days 30–60: Enhance (V1.1 Patch)

### Feature Releases

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Verification status export to GH | P0 | Beta feedback likely requests this |
| AI summary in panel | P1 | Wow moment for recruiters |
| Custom field auto-creation on connect | P1 | Reduces setup friction |
| Automation presets UI | P2 | Self-service configuration |
| Weekly digest email | P2 | Admin engagement |
| "Not interested" on invitation landing | P2 | Product experience refinement |

### Bug Fixes
- Address accumulated P2/P3 bugs
- Performance optimization based on real latency data
- Edge cases discovered in production (duplicate emails, merged candidates)

### Customer Success
- Case study from best beta customer
- Webinar: "Getting started with WorkVouch + Greenhouse"
- In-app onboarding tooltip for new connections

---

## Days 60–90: Expand (V2 Start)

### Feature Releases

| Feature | Priority | Rationale |
|---------|----------|-----------|
| Job sync service | P1 | Enable job-filtered auto-invite |
| Job/location filters for auto-invite | P1 | Enterprise customer request |
| Advanced export fields (6 additional) | P1 | Deeper GH integration |
| Trust score threshold setting | P2 | Enterprise control |
| AI summary GH custom field export | P2 | List view value |
| Side-by-side comparison | P3 | If panel width allows |

### Provider #2: Lever

| Milestone | Target Date |
|-----------|-------------|
| Lever adapter development start | Day 60 |
| Lever OAuth + webhooks | Day 75 |
| Lever sandbox E2E tests | Day 85 |
| Lever beta (internal) | Day 90 |

### Metrics Review (Day 90)

| Metric | Day 30 Target | Day 90 Target |
|--------|--------------|--------------|
| Marketplace installs | 10 | 25+ |
| Active connections | 8 | 20+ |
| Sync success rate | ≥95% | ≥98% |
| Beta satisfaction | ≥4.0 | ≥4.2 |
| Support tickets/month | <10 | <15 |
| Revenue from integration | Tracked | First upsell attributed |

---

## 90-Day Milestone Summary

| Milestone | Day | Status |
|-----------|-----|--------|
| Marketplace listing approved | 0 | ⬜ |
| First 10 installs | 14 | ⬜ |
| Beta exit criteria met | -7 (pre-launch) | ⬜ |
| V1.1 patch deployed | 45 | ⬜ |
| Verification export live | 45 | ⬜ |
| AI summary in panel live | 50 | ⬜ |
| 25+ marketplace installs | 90 | ⬜ |
| Lever adapter dev started | 60 | ⬜ |
| First case study published | 60 | ⬜ |
| V2 feature set defined from feedback | 90 | ⬜ |

---

## Feedback Loop

```
Customer feedback → Weekly triage → V1.1 patch (Days 30-60)
                                  → V2 backlog (Days 60-90)
                                  → V3 backlog (Day 90+)
```

**Rule:** Customer requests for V3 features (analytics, fraud, workflow builder) are logged but not committed until V2 is stable with 20+ active connections.

---

## Related Documents

- [02-v1-v2-v3-roadmap.md](./02-v1-v2-v3-roadmap.md)
- [07-success-metrics.md](./07-success-metrics.md)
- [08-beta-plan.md](./08-beta-plan.md)
