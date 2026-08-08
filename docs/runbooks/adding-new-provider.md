# Adding a New Provider

> **Sprint:** 3A  
> **Last updated:** 2026-08-07

---

## Steps

1. **Implement `AtsProvider`** in `lib/integrations/providers/{provider}/`
2. **Create provider manifest** (capabilities, rate limits, auth type)
3. **Create registration factory** (`createXRegistration()`)
4. **Register in `ProviderLoader`** (or external registration at boot)
5. **Add feature flag** (`{PROVIDER}_ENABLED`)
6. **Add env configuration** (`{PROVIDER}_CLIENT_ID`, etc.)
7. **Write contract tests** against `AtsProvider` interface
8. **Write sandbox E2E tests** (Sprint 3B+)

---

## Example Registration

```typescript
export function createGreenhouseRegistration(): ProviderRegistration {
  return {
    providerId: "greenhouse",
    displayName: "Greenhouse",
    capabilities: GREENHOUSE_CAPABILITIES,
    factory: () => new GreenhouseAdapter(),
  };
}
```

---

## Do NOT

- Import Greenhouse code in `IntegrationManager`, `EventDispatcher`, or `HealthService`
- Add provider-specific logic to platform services
- Modify existing WorkVouch routes for provider setup (use `/api/integrations/v1/` in Sprint 3B)

---

## Reference

- Mock implementation: `lib/integrations/providers/mock/MockAtsProvider.ts`
- Interface: `lib/integrations/providers/base/AtsProvider.ts`
- [Provider Onboarding](./provider-onboarding.md)
