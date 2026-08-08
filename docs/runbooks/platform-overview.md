# Platform Overview — WorkVouch Connect

> **Sprint:** 3A — WorkVouch Connect Foundation  
> **Last updated:** 2026-08-08

---

## Purpose

**WorkVouch Connect** (`lib/integrations/`) is the permanent, provider-agnostic home for all WorkVouch ATS connections. It sits **alongside** the existing WorkVouch application — it does not replace trust, verification, billing, or employer/worker dashboards.

**Sprint 3A:** Platform foundation + MockATS.  
**Sprint 3B-1:** Greenhouse provider.  
**Sprint 3B-2:** Event translation pipeline.  
**Sprint 3B-3:** Connect developer platform (inspector, replay, audit, diagnostics).

API namespaces (`ATS_ENABLED`, `AtsProvider`, etc.) remain unchanged.

---

## Architecture

```
IntegrationManager
    └── IntegrationContext (DI container)
            ├── ConfigurationService
            ├── FeatureFlagService
            ├── StructuredLoggingService
            ├── ProviderRegistry + ProviderLoader
            ├── EventDispatcher
            ├── RetryService + DeadLetterQueue
            └── HealthService
                    └── AtsProvider (interface)
                            └── MockAtsProvider (Sprint 3A)
                            └── GreenhouseAdapter (Sprint 3B)
```

---

## Key Rules

1. Platform code never imports provider-specific implementations directly — use `ProviderRegistry`
2. All providers implement `AtsProvider`
3. Feature flags gate platform and per-provider enablement
4. Events processed async with retry + DLQ
5. Structured logs on every operation

---

## Entry Points

```typescript
import { IntegrationManager, getIntegrationManager } from "@/lib/integrations";

const manager = new IntegrationManager();
const provider = manager.getProvider("mock");
```

---

## Related Runbooks

- [Architecture](./architecture.md)
- [Adding New Provider](./adding-new-provider.md)
- [Provider Onboarding](./provider-onboarding.md)
