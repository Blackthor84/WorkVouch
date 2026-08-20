# Architecture — WorkVouch Connect

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Folder Structure

```
lib/integrations/
├── core/           IntegrationManager, IntegrationContext
├── providers/      AtsProvider interface + MockAtsProvider
├── registry/       ProviderRegistry, ProviderLoader
├── events/         EventDispatcher
├── queue/          RetryService, DeadLetterQueue
├── sync/           Sync types (orchestration in 3B+)
├── auth/           Token types (OAuth in adapters)
├── mappings/       Canonical entity types
├── health/         HealthService
├── logging/        StructuredLoggingService
├── config/         ConfigurationService, FeatureFlagService
├── types/          Shared TypeScript types
├── utils/          Correlation IDs, errors
└── index.ts        Public exports
```

---

## Dependency Injection

`IntegrationManager` accepts optional `deps` for testing:

```typescript
const manager = new IntegrationManager({
  deps: {
    logger: new StructuredLoggingService(),
    config: new ConfigurationService({ defaultEventMaxAttempts: 3 }),
  },
});
```

No global singletons required except optional `getIntegrationManager()` for future routes.

---

## Event Flow

```
publish() → pending → processing → completed
                              ↓ failure
                         retry_scheduled → (backoff) → processing
                              ↓ max attempts
                         dead_letter → DLQ
```

---

## Feature Flags

| Flag | Default (dev) | Purpose |
|------|---------------|---------|
| `ATS_ENABLED` | false | Master platform switch |
| `MOCK_ATS_ENABLED` | true when ATS on | Mock provider |
| `GREENHOUSE_ENABLED` | false | Greenhouse (Sprint 3B) |

---

## Design References

- `docs/integrations/01-system-architecture.md`
- `docs/integration-contract/01-domain-model.md`
- `docs/decisions/ADR-001-why-integration-layer.md`
