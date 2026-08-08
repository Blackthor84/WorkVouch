# Debugging — ATS Integration Platform

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Common Issues

### Provider disabled

**Symptom:** `PROVIDER_DISABLED` error  
**Fix:** Set `ATS_ENABLED=true` and `{PROVIDER}_ENABLED=true`

### Provider not registered

**Symptom:** `PROVIDER_NOT_FOUND`  
**Fix:** Ensure `ProviderLoader.loadBuiltInProviders()` ran or provider registered manually

### Events stuck in retry

**Symptom:** Events in `retry_scheduled` status  
**Fix:** Check handler errors; inspect `lastError` on event; replay from DLQ after fix

### DLQ growing

**Symptom:** `deadLetterQueue.size()` increasing  
**Fix:** Inspect DLQ items via `context.deadLetterQueue.list()`; fix root cause; replay

### Health degraded

**Symptom:** `oauth_expired`, `webhook_failure`, `rate_limited`  
**Fix:** See [Health Checks](./health-checks.md)

---

## Debug Workflow

1. Enable structured logging sink to capture entries
2. Find `correlationId` from log entry
3. Trace event: `events.getEvent(id)`
4. Check provider health: `manager.checkHealth(providerId, ...)`
5. Validate config: `provider.validateConfiguration(config)`

---

## Mock Provider Local Testing

```typescript
process.env.ATS_ENABLED = "true";
process.env.MOCK_ATS_ENABLED = "true";

const manager = new IntegrationManager();
const result = await manager.connect("mock", {
  employerAccountId: "test",
  redirectUri: "http://localhost/callback",
  state: "test-state",
  code: "test-code",
});
```

No external ATS required.
