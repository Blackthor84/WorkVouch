# ADR-005: Why Greenhouse Is Provider #1

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch needs to integrate with at least one ATS to deliver trust scores inside recruiter workflows. Multiple ATS platforms are candidates: Greenhouse, Lever, Ashby, Workday, iCIMS, SmartRecruiters.

---

## Decision

**Greenhouse is Provider #1** for the WorkVouch ATS Integration Platform.

---

## Consequences

**Positive:**
- Greenhouse has a marketplace with formal review process (distribution channel)
- Greenhouse Harvest API is well-documented with OAuth, webhooks, and custom fields
- Greenhouse customer base aligns with WorkVouch target (mid-market to enterprise)
- Greenhouse supports partner sidebar extensions (native panel embedding)
- WorkVouch already has `docs/GREENHOUSE_SOLUTIONS_REVIEW.md` and partnership discussions
- Greenhouse webhook events cover all MVP triggers (candidate, application, stage change)

**Negative:**
- Greenhouse-only V1 limits addressable market to GH customers
- Greenhouse API rate limits (50/10s) require careful batch sync design
- Greenhouse marketplace review adds 3–5 weeks to launch timeline
- Greenhouse-specific panel UX may not transfer directly to other ATS

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Lever first | Smaller marketplace; less formal partnership path; similar API but fewer enterprise customers |
| Ashby first | Newer platform; smaller customer base; less marketplace maturity |
| Workday first | Enterprise sales cycle too long for MVP; complex API; no webhooks |
| Multi-provider V1 | Scope explosion; 2 providers = 2× OAuth apps, 2× webhooks, 2× testing, 2× marketplace listings |
| Build own ATS | Not the business; WorkVouch is trust infrastructure, not hiring software |

---

## Future Impact

- Provider #2 (Lever) in V2 validates multi-provider architecture
- Greenhouse marketplace approval becomes case study for other marketplace submissions
- Greenhouse-specific learnings (panel embedding, custom fields) inform adapter design

---

## Related

- [ADR-002](./ADR-002-why-provider-adapters-were-selected.md)
- [ADR-012](./ADR-012-marketplace-strategy.md)
- [docs/GREENHOUSE_SOLUTIONS_REVIEW.md](../GREENHOUSE_SOLUTIONS_REVIEW.md)
