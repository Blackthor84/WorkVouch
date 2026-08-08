# ADR-010: How Future ATS Providers Will Be Added

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform is designed for multiple ATS providers. Greenhouse is Provider #1. Lever, Ashby, Workday, and others are planned. The process for adding providers must be repeatable and not require platform changes.

---

## Decision

Adding a new ATS provider follows a **5-step process**:

### Step 1: Create Provider Manifest
Define capabilities in `lib/integrations/providers/{provider}/manifest.ts`:
- OAuth config, webhook config, rate limits, export fields, supported features

### Step 2: Implement AtsProvider Adapter
Create `lib/integrations/providers/{provider}/{Provider}Adapter.ts`:
- Implement all interface methods
- Map provider-specific API responses to canonical types
- Map provider webhook events to normalized event types

### Step 3: Register in ProviderRegistry
```typescript
ProviderRegistry.register('lever', LeverAdapter, leverManifest)
```

### Step 4: Pass Contract Tests
Run `AtsProviderContractTest` suite against new adapter:
- Mock tests in CI (always)
- Sandbox E2E tests in staging (before launch)

### Step 5: Marketplace Listing
- Register OAuth app with provider
- Submit marketplace listing
- Beta test with 2–3 customers

**No changes required to:** Sync Engine, Event Bus, API routes, database schema, employer settings UI (UI adapts via manifest).

---

## Consequences

**Positive:**
- Provider #2 estimated at 2–3 weeks (not 2–3 months)
- Platform code is provider-agnostic permanently
- Provider manifest enables feature gating in UI
- Contract tests prevent regression when adding providers

**Negative:**
- Lowest-common-denominator interface limits provider-unique features
- Each provider still requires OAuth app registration and sandbox testing
- Provider-specific panel UX may need adapter-specific rendering

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Config-driven provider (JSON/YAML mapping) | ATS APIs too different; OAuth flows vary; webhook formats incompatible |
| Fork platform per provider | Unmaintainable; N codebases for N providers |
| Third-party unified API (Merge.dev) | Cost; vendor lock-in; less control; trust data privacy concerns |
| Plugin system with dynamic loading | Over-engineering; security risk; team doesn't need runtime plugins |

---

## Future Impact

| Provider | Target Version | Estimated Effort |
|----------|---------------|----------------|
| Lever | V2 | 2–3 weeks |
| Ashby | V3 | 2–3 weeks |
| SmartRecruiters | V3 | 3–4 weeks |
| Workday | V3 | 4–6 weeks (no webhooks) |
| iCIMS | V3 | 3–4 weeks |

---

## Related

- [ADR-002](./ADR-002-why-provider-adapters-were-selected.md)
- [docs/integration-contract/13-provider-manifest.md](../integration-contract/13-provider-manifest.md)
- [docs/integrations/13-provider-roadmap.md](../integrations/13-provider-roadmap.md)
