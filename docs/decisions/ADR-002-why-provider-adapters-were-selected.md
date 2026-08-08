# ADR-002: Why Provider Adapters Were Selected

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform must support Greenhouse now and Lever, Ashby, Workday, and others later. Each ATS has different OAuth flows, webhook formats, API endpoints, custom field systems, and rate limits.

---

## Decision

Implement the **Adapter Pattern** via the `AtsProvider` interface. Every ATS provider implements the same contract:

- `connect()`, `disconnect()`, `refreshToken()`, `healthCheck()`
- `getCandidates()`, `getJobs()`, `syncCandidate()`, `sendStatus()`
- `verifyWebhook()`, `parseWebhookEvent()`, `upsertCustomFields()`

The Sync Engine, Event Bus, and API routes interact **only** through `AtsProvider` — never with provider-specific code.

Adding a provider = implement adapter + register in `ProviderRegistry`. No changes to platform code.

---

## Consequences

**Positive:**
- Greenhouse-specific code isolated in `lib/integrations/providers/greenhouse/`
- Contract test suite runs against `MockAtsAdapter` in CI (no GH dependency)
- New provider estimated at 2–3 weeks (not 2–3 months)
- Provider capabilities declared in manifest (see ADR-010)

**Negative:**
- Lowest-common-denominator interface may not expose provider-unique features
- Adapter maintenance burden grows with each provider
- Some GH-specific optimizations (e.g., GH-only panel) bypass the interface

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Greenhouse-only hardcoded integration | No extensibility; rewrite needed for each provider |
| Generic REST adapter with config files | Too fragile; ATS APIs are too different for config-driven approach |
| Third-party integration platform (Merge, Apideck) | Cost; vendor lock-in; less control over trust data export |
| GraphQL federation | Over-engineering; team has no GraphQL infrastructure |

---

## Future Impact

- Provider #2 (Lever) validates the adapter pattern in V2
- Provider manifest enables UI to show/hide features per provider
- Adapter contract tests become the CI gate for new providers

---

## Related

- [ADR-001](./ADR-001-why-integration-layer.md)
- [ADR-010](./ADR-010-how-future-ats-providers-will-be-added.md)
- [docs/integrations/03-provider-interface.md](../integrations/03-provider-interface.md)
