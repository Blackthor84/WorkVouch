# ADR-001: Why WorkVouch Uses an Integration Layer

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch needs to connect with Greenhouse (and eventually 8+ ATS providers) to export trust scores and display verification data inside recruiter workflows. The existing codebase has no ATS integration. Trust data lives in WorkVouch core tables (`trust_scores`, `verification_requests`, `profiles`). Greenhouse data lives in Harvest API.

The question: should integration logic be embedded in existing WorkVouch services, or isolated in a dedicated integration layer?

---

## Decision

Build a **dedicated ATS Integration Platform** as a separate layer within the WorkVouch monorepo:

```
WorkVouch Core (existing, untouched)
    ↕ read-only
Integration Platform (new)
    ↕ AtsProvider interface
Provider Adapters (Greenhouse, Mock, future)
    ↕ API/webhooks
External ATS (Greenhouse, Lever, etc.)
```

All integration code lives under `lib/integrations/` and `app/api/integrations/v1/`. All integration data lives in `ats_*` tables.

---

## Consequences

**Positive:**
- Zero risk to existing WorkVouch features (trust engine, verification, candidate flows)
- Multiple ATS providers share one platform (sync engine, event bus, API)
- Integration can be developed, tested, and deployed independently
- Failure in integration never breaks core WorkVouch
- Clear ownership boundary for engineering team

**Negative:**
- Additional abstraction layer adds initial development time (~2 weeks)
- Data must be read from core tables (no direct writes to trust engine from integration)
- Some duplication of candidate identity data in `ats_candidate_map`

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Embed GH logic in existing `/api/employer/*` routes | Couples integration to employer API; can't support multiple ATS; modifies protected files |
| Separate microservice | Over-engineering for V1; adds deployment complexity; team is monorepo-native |
| Direct GH API calls from frontend | Security (token exposure); no server-side sync; no webhook processing |
| Fork WorkVouch for integration | Unmaintainable; duplicates entire codebase |

---

## Future Impact

- Every new ATS provider adds an adapter, not a platform rewrite
- Integration platform can become a standalone product module
- Core WorkVouch team and integration team can work in parallel
- Integration layer is the boundary for marketplace partnerships

---

## Related

- [ADR-002](./ADR-002-why-provider-adapters-were-selected.md)
- [ADR-003](./ADR-003-why-existing-apis-remain-untouched.md)
- [docs/integrations/01-system-architecture.md](../integrations/01-system-architecture.md)
