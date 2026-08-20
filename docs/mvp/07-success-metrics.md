# 07 — Success Metrics

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Launch Metrics (First 30 Days)

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Connection Success %** | ≥95% | OAuth flows completing without error / total attempts | Engineering |
| **Sync Success %** | ≥95% | Successful trust exports / total export attempts | Engineering |
| **Webhook Success %** | ≥99% | Processed webhooks / total received (excl. invalid sig) | Engineering |
| **Verification Completion %** | ≥40% | Candidates who complete verification / invited | Product |
| **Reference Completion %** | ≥50% | Vouches submitted / vouch requests sent | Product |
| **Support Tickets** | <10 integration tickets | Tickets tagged "integration" in first 30 days | Support |
| **Average Install Time** | <5 min | Time from "Connect" click to "Connected" confirmation | Product |
| **Average Sync Time** | <2s per candidate | Trust export duration p95 | Engineering |
| **Marketplace Approval** | Approved | GH marketplace listing status | Product |
| **Beta Satisfaction** | ≥4.0/5.0 | Post-beta survey score | CS |

---

## Metric Definitions

### Connection Success %

```
(connection_success_count / connection_attempt_count) × 100

connection_success_count = OAuth flows reaching status=connected
connection_attempt_count = OAuth flows initiated (POST /connect/greenhouse)

Exclude: User-cancelled flows (access_denied)
Window: Rolling 7 days
Alert: <90% over 7 days → P1
```

### Sync Success %

```
(successful_exports / total_export_attempts) × 100

successful_exports = ats_sync_log entries with status=success, operation=trust_score_export
total_export_attempts = all trust_score_export attempts (success + failed + partial)

Window: Rolling 24 hours
Alert: <90% over 24 hours → P1
```

### Webhook Success %

```
(processed_webhooks / valid_webhooks) × 100

valid_webhooks = ats_webhook_log entries where status != 'rejected'
processed_webhooks = status = 'processed'

Exclude: Invalid signatures (status=rejected)
Window: Rolling 24 hours
Alert: <95% over 24 hours → P1
```

### Verification Completion %

```
(candidates_verified / candidates_invited) × 100

candidates_verified = WV profiles reaching status=Verified
candidates_invited = Invitation emails sent via integration

Window: Rolling 30 days per employer
Note: Lagging indicator — expect low initially
```

### Reference Completion %

```
(vouches_submitted / vouch_requests_sent) × 100

Window: Rolling 30 days
Note: Depends on candidate completing profile first
```

### Average Install Time

```
median(timestamp_connected - timestamp_connect_clicked)

Measure from employer UI events
Target: <5 min (includes OAuth + initial sync)
Alert: >10 min p95 → P2
```

### Average Sync Time

```
p95(duration_ms) from ats_sync_log where operation=trust_score_export

Target: <2000ms
Alert: >5000ms p95 → P2
```

---

## Operational Metrics (Ongoing)

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Panel API p95 latency (cached) | <800ms | >1500ms |
| Panel API p95 latency (fresh) | <3000ms | >5000ms |
| Webhook response p99 | <500ms | >1000ms |
| Token expiry incidents | 0 per month | >0 → P0 |
| DLQ depth | <5 events | >10 → P1 |
| Auto-link rate | >70% | <50% → P2 |
| Active connections | Growth tracked | N/A |
| Candidates linked | Growth tracked | N/A |
| Trust exports per day | Growth tracked | N/A |

---

## Business Metrics (90 Days)

| Metric | Target | Notes |
|--------|--------|-------|
| Marketplace installs | 25+ | From GH marketplace listing |
| Paying customers with integration | 10+ | Connected + actively syncing |
| Recruiter panel views per week | 100+ | Across all customers |
| Customer retention (integration) | >80% stay connected after 30 days | No disconnect |
| NPS (integration-specific) | ≥40 | Post-30-day survey |
| Revenue attributed to integration | Tracked | Upgrade driver metric |

---

## Dashboard Requirements

### Engineering Dashboard
- Connection success rate (7-day rolling)
- Sync success rate (24-hour rolling)
- Webhook success rate (24-hour rolling)
- Panel API latency (p50, p95, p99)
- DLQ depth
- Token expiry countdown
- GH API rate limit hits

### Product Dashboard
- Installs per week
- Auto-link rate
- Verification completion rate
- Reference completion rate
- Panel views per employer
- Average install time

### Support Dashboard
- Integration tickets per week
- Top 5 error codes
- Mean time to resolution
- Escalation count

---

## Reporting Schedule

| Report | Frequency | Audience |
|--------|-----------|----------|
| Integration health | Daily (automated) | Engineering |
| Launch metrics | Weekly | Product + Engineering |
| Business metrics | Monthly | Leadership |
| Beta feedback | Bi-weekly during beta | Product + CS |

---

## Related Documents

- [08-beta-plan.md](./08-beta-plan.md)
- [09-post-launch-roadmap.md](./09-post-launch-roadmap.md)
- [docs/integration-contract/12-marketplace-readiness.md](../integration-contract/12-marketplace-readiness.md)
