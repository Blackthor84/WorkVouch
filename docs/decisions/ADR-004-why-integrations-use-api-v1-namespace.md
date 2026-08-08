# ADR-004: Why Integrations Use /api/integrations/v1

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform needs a URL namespace for API routes. Sprint 1 architecture audit suggested `/api/integrations/greenhouse/v1/`. Sprint 2 standardized on a provider-agnostic namespace.

---

## Decision

All integration APIs live under:

```
/api/integrations/v1/          ← Employer-facing integration APIs
/api/integrations/v1/webhooks/ ← Inbound webhook endpoints (per provider)
/api/cron/ats-*                ← Cron endpoints (additive)
```

Provider is specified in path segment or request body, not in the URL namespace:
- `/api/integrations/v1/connect/greenhouse`
- `/api/integrations/v1/webhooks/greenhouse`
- `/api/integrations/v1/status` (returns all providers)

Versioning: `/v1/` in path. Breaking changes require `/v2/`.

---

## Consequences

**Positive:**
- Provider-agnostic: adding Lever doesn't create new URL namespace
- Consistent with industry practice (Stripe `/v1/`, GitHub `/v1/`)
- Single webhook endpoint pattern per provider
- Clear separation from existing WorkVouch API namespaces

**Negative:**
- Sprint 1 docs reference old namespace (superseded)
- Slightly longer paths than provider-specific namespace

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| `/api/integrations/greenhouse/v1/` | Provider in namespace; new namespace per provider; URL proliferation |
| `/api/greenhouse/v1/` | Too provider-specific; doesn't scale to multi-ATS |
| `/api/v2/` (global versioning) | Conflates integration versioning with core API versioning |
| No versioning | Breaking changes would require coordinated deploys |

---

## Future Impact

- `/v2/` created only if breaking changes to integration API contract
- Panel API included in v1 namespace: `/api/integrations/v1/panel/{provider}/{id}`
- Cron endpoints use descriptive names, not versioned (internal only)

---

## Related

- [ADR-003](./ADR-003-why-existing-apis-remain-untouched.md)
- [docs/integration-contract/05-api-contract.md](../integration-contract/05-api-contract.md)
