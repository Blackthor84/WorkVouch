# ADR-012: Marketplace Strategy

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch needs a distribution channel for the Greenhouse integration. Options include direct sales, Greenhouse Marketplace listing, or partner referral program.

---

## Decision

**Primary distribution: Greenhouse Marketplace listing.**

Strategy:
1. Build MVP that passes GH marketplace review (see [03-greenhouse-review-checklist.md](../mvp/03-greenhouse-review-checklist.md))
2. Submit listing with demo environment, screenshots, video, documentation
3. Beta with 3–5 customers before submission
4. Free tier (≤10 candidates/month) for adoption; Pro tier ($99/month) for revenue
5. Marketplace listing drives inbound installs; CS team supports onboarding
6. Case study from beta customer within 60 days of launch

Secondary channels (post-launch):
- WorkVouch website integration page
- Greenhouse partner referral program
- Direct sales for enterprise customers already using both products

---

## Consequences

**Positive:**
- Marketplace provides credibility ("Greenhouse approved partner")
- Inbound installs without sales team effort
- Demo environment impresses reviewers and prospects
- Free tier reduces adoption friction
- Marketplace badge usable in WorkVouch marketing

**Negative:**
- 3–5 week review timeline delays revenue
- Marketplace requirements constrain product design (OAuth, security, branding)
- GH takes no revenue share but controls listing approval
- Competitor integrations visible on same marketplace

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Direct sales only | Slow; requires sales team; misses GH customer self-service discovery |
| Listing on multiple marketplaces simultaneously | Scope explosion; each marketplace has different requirements |
| Free integration forever (no pricing) | No revenue; unsustainable; undervalues trust data |
| White-label for GH | GH doesn't offer white-label; WorkVouch brand is the asset |

---

## Future Impact

- Lever marketplace listing in V2 (same process, faster with GH learnings)
- Marketplace install metrics become primary growth KPI
- Customer reviews on marketplace drive product improvements

---

## Related

- [ADR-005](./ADR-005-why-greenhouse-is-provider-1.md)
- [docs/mvp/03-greenhouse-review-checklist.md](../mvp/03-greenhouse-review-checklist.md)
- [docs/product-experience/13-marketplace-demo.md](../product-experience/13-marketplace-demo.md)
