# 10 — Final Go / No-Go

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07  
> **Decision authority:** Engineering Lead + Product Lead

---

## Decision

# GO

Engineering should begin Sprint 3 immediately after completing a **1-day pre-sprint spike** to resolve 3 blockers.

---

## Rationale

| Question | Answer |
|----------|--------|
| Is the MVP defined? | ✅ Yes — 10 core + 12 required features locked |
| Is scope guarded? | ✅ Yes — 15 forbidden features documented with reasons |
| Are contracts complete? | ✅ Yes — 16 integration contract docs |
| Is product experience designed? | ✅ Yes — 16 product experience docs |
| Is architecture decided? | ✅ Yes — 15 ADRs + engineering charter |
| Can another team implement? | ✅ Yes — 85%+ without clarification |
| Are risks identified? | ✅ Yes — 20 risks with mitigations |
| Is testing defined? | ✅ Yes — 80+ test cases |
| Is marketplace path clear? | ✅ Yes — checklist + demo spec + beta plan |
| Is V1/V2/V3 separated? | ✅ Yes — no feature appears twice |

**Planning sprints complete:** Sprint 1 (Architecture) → Sprint 2 (Integration Design) → Sprint 2.5 (Product Experience) → Sprint 2.75 (Integration Contracts) → Sprint 2.9 (MVP Lock + ADRs)

**Total planning artifacts:** 63 documents across 5 sprints. Zero production code. Zero migrations.

---

## Remaining Blockers (Pre-Sprint Spike — 1 Day)

These are **not** architecture decisions. They are external dependencies and implementation details.

| # | Blocker | Resolution | Owner | ETA |
|---|---------|------------|-------|-----|
| B-001 | GH OAuth sandbox credentials | Register GH developer app | Engineering | 4 hours |
| B-002 | Panel delivery mechanism | Test Partner Sidebar Extension; confirm iframe fallback | Engineering | 4 hours |
| B-003 | Panel JWT auth token spec | Define claims: `{ employerAccountId, externalCandidateId, provider, exp }` | Engineering | 2 hours |

**After spike:** All blockers resolved. Sprint 3 T-001 (database migrations) begins.

---

## Critical Assumptions

| # | Assumption | If wrong | Mitigation |
|---|-----------|----------|------------|
| A-001 | GH Partner Sidebar Extension API is available for marketplace partners | Panel cannot embed in GH | Fallback: custom field iframe + external link |
| A-002 | GH allows 12 custom fields per candidate | Cannot export all fields | V1 exports 6 core fields only |
| A-003 | GH sandbox behaves identically to production API | Tests pass in sandbox, fail in prod | Staging environment with production-like org |
| A-004 | 2 engineers available for 6 weeks | Timeline extends to 10 weeks | Cut nice-to-haves; maintain core 10 features |
| A-005 | Existing WorkVouch trust engine is stable | Export reads incorrect scores | Contract tests verify read-only export |
| A-006 | Email is reliable linking key (>70% match rate) | Low auto-link rate | Manual link UX is polished; not a blocker |
| A-007 | GH marketplace review takes 3–5 weeks | Delayed revenue | Beta customers use integration before approval |
| A-008 | No breaking changes to GH Harvest API v1 during build | Adapter breaks | Contract tests catch; adapter is isolated |

---

## What Engineering Should NOT Debate

These decisions are locked via ADRs. Reopening requires a new ADR.

| Decision | ADR |
|----------|-----|
| Integration layer architecture | ADR-001 |
| Provider adapter pattern | ADR-002 |
| Existing APIs untouched | ADR-003 |
| `/api/integrations/v1/` namespace | ADR-004 |
| Greenhouse as Provider #1 | ADR-005 |
| Event-driven architecture | ADR-006 |
| Additive database migrations | ADR-007 |
| MVP scope limitation | ADR-008 |
| OAuth over API keys | ADR-009 |
| Future provider addition process | ADR-010 |
| Security principles | ADR-011 |
| Marketplace strategy | ADR-012 |
| Testing philosophy | ADR-013 |
| Documentation philosophy | ADR-014 |
| Long-term platform vision | ADR-015 |

---

## Sprint 3 Entry Checklist

- [ ] Pre-sprint spike complete (B-001, B-002, B-003)
- [ ] Engineering team briefed on MVP definition
- [ ] Engineering team has read engineering charter
- [ ] Sprint 3 tasks assigned (T-001 through T-010)
- [ ] GH sandbox credentials in environment variables
- [ ] Feature flag `integration_greenhouse_beta` created
- [ ] MockAtsAdapter development environment ready

---

## No-Go Conditions

Engineering should **stop and escalate** if any of these occur during Sprint 3:

| Condition | Action |
|-----------|--------|
| GH denies OAuth app registration | Escalate to GH partnership; explore API key fallback (requires ADR) |
| GH panel embedding impossible (both sidebar and iframe blocked) | Pivot to external link + custom field only; update MVP definition |
| Existing WorkVouch regression in trust engine | Stop integration work; fix trust engine first |
| Security audit finds critical vulnerability | Stop; fix before continuing |
| Scope creep PR merged without ADR | Revert PR; enforce scope guard |

---

## Document Index (All Planning Sprints)

| Sprint | Folder | Docs | Status |
|--------|--------|------|--------|
| Sprint 1 | `docs/architecture/` | 11 | ✅ Complete |
| Sprint 2 | `docs/integrations/` | 15 | ✅ Complete |
| Sprint 2.5 | `docs/product-experience/` | 16 | ✅ Complete |
| Sprint 2.75 | `docs/integration-contract/` | 16 | ✅ Complete |
| Sprint 2.9 | `docs/mvp/` | 10 | ✅ Complete |
| Sprint 2.9 | `docs/decisions/` | 16 | ✅ Complete |
| **Total** | | **84** | **✅ Complete** |

---

## Sign-Off

| Role | Decision | Date |
|------|----------|------|
| Product | **GO** — MVP locked, scope guarded | 2026-08-07 |
| Engineering | **GO** — Architecture decided, contracts complete | 2026-08-07 |
| Design | **GO** — Product experience designed | 2026-08-07 |
| Security | **GO** — Principles documented, privacy enforced | 2026-08-07 |

**Next action:** 1-day pre-sprint spike → Sprint 3 T-001 (database migrations)

---

## Related Documents

- [01-mvp-definition.md](./01-mvp-definition.md)
- [05-risk-register.md](./05-risk-register.md)
- [docs/decisions/engineering-charter.md](../decisions/engineering-charter.md)
- [docs/integration-contract/greenhouse-launch-readiness.md](../integration-contract/greenhouse-launch-readiness.md)
