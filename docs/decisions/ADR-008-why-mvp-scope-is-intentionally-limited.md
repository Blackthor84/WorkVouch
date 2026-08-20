# ADR-008: Why MVP Scope Is Intentionally Limited

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

The integration platform design (Sprints 1–2.75) describes a comprehensive system: 12 custom fields, AI summaries, automation presets, job sync, verification export, multi-provider support, fraud detection, and enterprise analytics. Building everything at once would take 6+ months and delay marketplace submission.

The question: what is the smallest product that impresses Greenhouse reviewers, delivers customer value, and ships in 6 weeks?

---

## Decision

**V1 MVP includes exactly 10 core features + 12 required supporting features.** Everything else is V2 or V3.

V1 core value proposition: *"See verified trust scores inside Greenhouse in 60 seconds."*

V1 ships:
- OAuth connect, webhooks, email auto-link, manual link
- Trust score export (6 custom fields)
- Embedded recruiter panel
- Auto-invite at Final Interview
- Health dashboard, demo environment

V1 explicitly excludes:
- AI summary, verification export, job sync, automation presets
- Lever or any second provider
- Analytics, fraud detection, workflow builder
- Auto-profile creation, bidirectional sync

Scope guard document ([06-scope-guard.md](../mvp/06-scope-guard.md)) blocks feature additions without ADR.

---

## Consequences

**Positive:**
- 6-week timeline is achievable with 2 engineers
- Marketplace submission possible within 8 weeks of engineering start
- Focus forces polish on core recruiter experience (panel + trust score)
- Beta feedback informs V2 priorities with real data
- Team avoids building features nobody asked for

**Negative:**
- Early customers may request V2 features immediately
- Competitive integrations may ship more features at launch
- Some nice-to-have features (AI summary) would differentiate but are deferred
- Sales team must manage expectations about V1 scope

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Ship everything designed in Sprints 1–2.75 | 6+ months; misses marketplace window; untested features |
| MVP = OAuth connect only (no panel) | Doesn't impress reviewers; no recruiter value; just data sync |
| MVP = panel only (no export to GH fields) | Trust score not visible in GH list view; reviewers won't see value |
| Wait for 2 providers before launch | Doubles timeline; Lever marketplace less mature |

---

## Future Impact

- V1.1 patch (Days 30–60) adds highest-demand V2 features based on beta feedback
- V2 (Days 60–90) adds verification export, AI summary, Lever
- Scope guard prevents V1 timeline slip from feature requests

---

## Related

- [docs/mvp/01-mvp-definition.md](../mvp/01-mvp-definition.md)
- [docs/mvp/06-scope-guard.md](../mvp/06-scope-guard.md)
- [docs/mvp/02-v1-v2-v3-roadmap.md](../mvp/02-v1-v2-v3-roadmap.md)
