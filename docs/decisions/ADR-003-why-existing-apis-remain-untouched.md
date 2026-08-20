# ADR-003: Why Existing WorkVouch APIs Remain Untouched

> **Status:** Accepted  
> **Date:** 2026-08-07  
> **Sprint:** Operation Greenhouse — Sprint 2.9

---

## Context

WorkVouch has 462 existing API routes serving trust scores, verification, employer dashboards, candidate flows, and billing. The integration platform needs to read trust data and trigger invitations.

The question: extend existing routes or create new ones?

---

## Decision

**All integration APIs are new routes under `/api/integrations/v1/`.** Existing routes are never modified.

Integration reads from existing tables (read-only):
- `trust_scores` — for export
- `profiles` — for email matching
- `verification_requests` — for status export
- `employer_accounts` — for ownership verification

Integration never writes to existing tables except through existing invitation/verification APIs (called as a client, not direct DB writes).

Protected files (from Sprint 1 risk analysis):
- `lib/trust/*`, `lib/auth/*`, `lib/stripe/*`
- `lib/search/employerSearchService.ts`
- All existing `/api/employer/*` routes
- `proxy.ts`, existing dashboard components

---

## Consequences

**Positive:**
- Zero regression risk to 462 existing routes
- Integration can ship independently of core releases
- Clear code review boundary: anything in `app/api/integrations/` is new; anything else is protected
- Rollback is trivial: disable feature flag, delete integration routes

**Negative:**
- Some data accessed via two paths (existing API vs integration read)
- Invitation flow may duplicate logic from existing invite endpoints
- Employer settings adds a new section rather than extending existing settings

---

## Alternatives Considered

| Alternative | Why rejected |
|-------------|-------------|
| Add GH endpoints to `/api/employer/*` | Modifies protected routes; couples integration to employer API versioning |
| Middleware that intercepts existing routes | Hidden behavior; hard to test; breaks on route changes |
| Shared service layer called from both old and new routes | Acceptable for reads; but new routes still needed for integration-specific operations |

---

## Future Impact

- If integration merges into core product, routes can be aliased (not rewritten)
- Existing API versioning (`/api/trust/`, `/api/employer/`) unaffected
- Integration team owns `app/api/integrations/` exclusively

---

## Related

- [ADR-004](./ADR-004-why-integrations-use-api-v1-namespace.md)
- [docs/architecture/08-risk-analysis.md](../architecture/08-risk-analysis.md)
