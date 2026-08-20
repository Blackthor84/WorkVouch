# WorkVouch Connect — Best Practices

## Recording Events

Always use ConnectPlatform when processing webhooks:

```typescript
const record = connect.recordReceived({ ... });
const result = translator.translateAndPublish({ ... });
connect.captureTranslation({ ...result, correlationId: record.correlationId });
connect.captureConsumed(record.id);
```

## Replay Safety

1. Always start with `simulateReplay()` — never live replay first
2. Use `comparePayloads()` to detect payload drift
3. Reset validator between idempotency tests: `connect.reset()`

## Logging

Pass correlation ID in all log context:

```typescript
logger.info("Processing webhook", {
  provider: "greenhouse",
  correlationId,
  companyId: employerAccountId,
  event: "webhook.received",
});
```

## Diagnostics Before Deploy

```typescript
const report = connect.runDiagnostics();
if (!report.configuration.valid) { /* block deploy */ }
```

## Provider Isolation

Never add provider-specific logic to `connect/`. Provider translators live under `providers/{name}/`.

## Testing

Use replay fixtures for regression:

```bash
npx vitest run tests/integrations/connect-platform.test.ts
```

## Naming

- Internal platform name: **WorkVouch Connect**
- API namespaces unchanged: `ATS_ENABLED`, `AtsProvider`, `IntegrationManager`
