# Health Checks — ATS Integration Platform

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Provider Health States

| State | Meaning | Typical action |
|-------|---------|----------------|
| `connected` | Test connection succeeded | None |
| `disconnected` | No access token | Connect OAuth |
| `healthy` | Health check passed | None |
| `degraded` | Partial failure | Monitor |
| `offline` | Provider unreachable | Retry later |
| `configuration_invalid` | Missing/invalid config | Fix env vars |
| `oauth_expired` | Token refresh needed | Reconnect |
| `webhook_failure` | Recent webhook issues | Inspect DLQ |
| `rate_limited` | Provider 429 | Backoff |

---

## Evaluation

```typescript
const report = await manager.checkHealth("mock", {
  connectionId,
  accessToken,
  employerAccountId,
  lastWebhookFailure: false,
  rateLimited: false,
});

console.log(report.state, report.issues);
```

---

## Platform Summary

```typescript
const summary = manager.getPlatformHealth();
console.log(summary.platform); // healthy | degraded | unhealthy
```

---

## Future (Sprint 3B+)

- Cron health check: `/api/cron/ats-health-check`
- Admin dashboard health indicators
- Alerts on `oauth_expired` and DLQ depth
