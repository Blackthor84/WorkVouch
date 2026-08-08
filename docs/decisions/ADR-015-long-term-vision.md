# ADR-015: Long-Term Vision for the ATS Integration Platform

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch is building an ATS Integration Platform starting with Greenhouse. The long-term vision must guide architectural decisions without over-engineering V1.

---

## Decision

**WorkVouch becomes the trust infrastructure layer for hiring technology.**

Vision statement:

> Every hiring decision, regardless of which ATS an employer uses, is informed by verified WorkVouch trust data — automatically synced, never requiring duplicate data entry, always preserving candidate privacy.

### Phase 1 (V1 — Now): Greenhouse MVP
Trust scores in Greenhouse. One provider. Marketplace listing.

### Phase 2 (V2 — 6 months): Multi-Provider Growth
Lever + deeper GH integration. AI summaries. Automation presets. 20+ customers.

### Phase 3 (V3 — 12 months): Platform
3+ ATS providers. Enterprise analytics. Fraud detection. Multi-ATS dashboard. SOC2 Type II.

### Phase 4 (18+ months): Trust Network
Cross-employer trust signals (with consent). Industry benchmarks. Predictive hiring insights. API for third-party hiring tools.

---

## Consequences

**Positive:**
- Clear north star for all architectural decisions
- V1 scope guard prevents over-building
- Provider adapter pattern validated by V2 (Lever)
- Platform becomes moat: switching cost increases with each connected ATS
- Trust data network effect: more candidates verified → more valuable to employers

**Negative:**
- Phase 4 features may never ship if PMF not found in Phase 1–2
- Multi-provider maintenance burden grows linearly
- Enterprise features (SOC2, compliance) require dedicated investment

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Greenhouse-only forever | Limits TAM; adapter pattern wasted |
| Build own ATS | Not the business; competes with partners |
| Acquisition by ATS | Premature; reduces optionality |
| API-only (no UI) | Recruiters need in-ATS experience; API alone doesn't impress marketplace |

---

## Future Impact

- Every ADR should be evaluated against Phase 1–4 vision
- Provider roadmap: GH → Lever → Ashby → SmartRecruiters → Workday
- Revenue model evolves: free tier → Pro → Enterprise → API pricing
- Team structure may split: Core WorkVouch + Integration Platform

---

## Related

- [ADR-001](./ADR-001-why-integration-layer.md)
- [ADR-008](./ADR-008-why-mvp-scope-is-intentionally-limited.md)
- [ADR-010](./ADR-010-how-future-ats-providers-will-be-added.md)
- [docs/mvp/02-v1-v2-v3-roadmap.md](../mvp/02-v1-v2-v3-roadmap.md)
