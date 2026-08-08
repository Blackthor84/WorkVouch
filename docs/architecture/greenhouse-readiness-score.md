# Greenhouse Readiness Score

> **Sprint:** Greenhouse Integration — Architecture Audit (Read-Only)  
> **Last updated:** 2026-08-07  
> **Overall readiness:** 6.2 / 10 — Good foundation, integration layer not yet built

---

## Scoring Methodology

Each area scored 1–10:
- **1–3:** Significant blockers — must resolve before integration
- **4–6:** Partial readiness — can proceed with caution
- **7–8:** Strong — minor gaps only
- **9–10:** Production-ready for integration

---

## Scores

| Area | Score | Rationale |
|------|------:|-----------|
| **Architecture** | 7/10 | Clear role zones, App Router structure, partial service layer. Dual admin surfaces and 462 unversioned API routes reduce score. |
| **Security** | 7/10 | Supabase Auth solid, proxy.ts handles page gating, admin guards exist. Dual role sources and 135 routes with unknown guards are gaps. |
| **API Design** | 6/10 | 462 routes with consistent Supabase admin pattern. No versioning, no integration namespace, inconsistent auth guards across routes. |
| **Scalability** | 6/10 | Supabase Postgres scales well. Cron via HTTP + external scheduler. No queue system for async sync jobs. GH API rate limits unhandled. |
| **Integration Readiness** | 4/10 | No Greenhouse code exists. Internal ATS tables present but unwired to external ATS. Stripe webhook is good pattern reference. Trust export surface exists. |
| **Code Organization** | 7/10 | Domain folders clear (`lib/trust/`, `lib/search/`, `lib/employer/`). Partial service layer. 206 DB tables with type drift. |
| **Technical Debt** | 5/10 | Recent stabilization reduced P0/P1 debt. Dual role sources, 22 unused tables, partial types, no API versioning remain. |
| **Maintainability** | 7/10 | Design system (`components/wv/`), workspace rules, trust engine docs, recent QA passes. 92 admin pages and sandbox complexity reduce score. |

### Overall Weighted Score: **6.2 / 10**

```mermaid
%%{init: {'theme': 'dark'}}%%
radar
  Architecture: 7
  Security: 7
  API Design: 6
  Scalability: 6
  Integration Readiness: 4
  Code Organization: 7
  Technical Debt: 5
  Maintainability: 7
```

---

## Score Detail by Area

### Architecture — 7/10

**Strengths:**
- Next.js 16 App Router with clear role zones
- `proxy.ts` centralizes page-level access control
- Trust engine recently consolidated
- Design system provides UI consistency

**Gaps:**
- No integration layer exists
- Service layer only partially adopted
- Three admin surfaces (`/admin`, `/superadmin`, `/sandbox`)

---

### Security — 7/10

**Strengths:**
- Supabase Auth with SSR cookie sessions
- Admin guards with audit logging
- Impersonation properly isolated to admin
- Location privacy rules enforced

**Gaps:**
- API routes not gated at proxy layer (per-handler enforcement)
- Dual role sources (`profiles.role` vs `app_metadata.role`)
- No OAuth token storage pattern yet (needed for Greenhouse)

---

### API Design — 6/10

**Strengths:**
- Consistent Supabase admin client in API routes
- Employer API namespace well-developed (67 routes)
- Trust API namespace complete (17 routes)
- Stripe webhook pattern proven

**Gaps:**
- No API versioning (except `/api/v1/trust-score`)
- No integration namespace
- 135 routes with non-standard auth guards
- No OpenAPI/Swagger documentation

---

### Scalability — 6/10

**Strengths:**
- Supabase Postgres handles current load
- Denormalized `trust_scores` avoids expensive joins
- Cron jobs externalized (no in-process scheduling)

**Gaps:**
- No job queue for async Greenhouse sync (recommend Supabase Edge Functions or external queue)
- No rate limit handling for Harvest API
- No caching layer for GH API responses
- 206 tables — query complexity grows with integration tables

---

### Integration Readiness — 4/10

**Strengths:**
- Trust score export surface exists (`/api/trust/public/[profileId]`, `/api/v1/trust-score`)
- Internal ATS tables (`saved_candidates`, `job_postings`) provide data model reference
- Stripe webhook = proven inbound webhook pattern
- Employer settings page exists as integration UI anchor
- Recent Greenhouse Solutions Review documented recruiter hesitations

**Gaps:**
- Zero Greenhouse code
- No OAuth flow
- No webhook handler
- No identity mapping tables
- No sync orchestration
- No integration tests

---

### Code Organization — 7/10

**Strengths:**
- Domain-driven `lib/` structure
- Component folders by role (employer/, employee/, admin/)
- Workspace Cursor rules enforce conventions
- Trust engine well-documented (`TRUST_MODEL.md`)

**Gaps:**
- Business logic split between `lib/actions/`, API routes, and partial `lib/services/`
- 22 unused DB tables add noise
- Type drift (80 typed of 206 tables)

---

### Technical Debt — 5/10

**Strengths:**
- Recent Operation Zero Bugs pass resolved critical issues
- Enterprise copy pass standardized terminology
- Trust band labels centralized

**Remaining debt:**
- Dual role sources
- Partial TypeScript types
- Legacy routes and redirects
- Industry vertical tables unwired
- Mobile app diverges from web

---

### Maintainability — 7/10

**Strengths:**
- Vitest unit tests for trust policy, auth routing, admin context
- Playwright E2E setup
- Internal docs (`docs/OPERATION_ZERO_BUGS.md`, `docs/GREENHOUSE_SOLUTIONS_REVIEW.md`)
- Design system reduces UI drift

**Gaps:**
- No employer search tests
- No integration test framework
- 92 admin pages with varying maturity
- Sandbox complexity

---

## Readiness by Integration Component

| Component | Readiness | Blocker? |
|-----------|------:|----------|
| OAuth connect flow | 2/10 | Yes — must build |
| Webhook handler | 3/10 | Yes — must build (pattern exists) |
| Trust score export | 8/10 | No — read API exists |
| Verification export | 7/10 | No — APIs exist |
| Candidate identity mapping | 2/10 | Yes — must build |
| Employer settings UI | 7/10 | No — page exists, add section |
| Search integration | 5/10 | Partial — search service stable |
| Notifications for sync | 7/10 | No — notification system exists |
| Cron sync jobs | 6/10 | Partial — cron pattern exists |
| Enterprise multi-tenant | 4/10 | Yes — defer to later sprint |

---

## Top 10 Recommendations BEFORE Beginning Greenhouse Integration

### 1. Regenerate Supabase Types
Run `npm run generate:types` to close the gap between 206 SQL tables and ~80 typed tables. Do this before adding `ats_*` tables.

### 2. Create Integration Namespace First
Establish `/api/integrations/greenhouse/v1/` before writing any integration logic. Version from day one. Do not add Greenhouse routes to existing `/api/employer/*` namespace.

### 3. Add `ats_connections` and `ats_candidate_sync` Tables
Additive migration only — no changes to existing tables. Type immediately in `types/database.ts`.

### 4. Mirror Stripe Webhook Pattern
Use `/api/stripe/webhook` as the template for `/api/integrations/greenhouse/v1/webhook`. Implement signature verification and idempotency (`ats_webhook_events` table) from the start.

### 5. Do Not Modify Trust Engine
Export trust scores read-only via existing `/api/trust/score/[profileId]` and `/api/trust/public/[profileId]`. Never write ATS data into trust calculation logic.

### 6. Resolve Dual Role Source Before Integration Testing
Audit and document which admin/employer guards use `profiles.role` vs `app_metadata.role`. Ensure employer integration routes use a single consistent guard pattern.

### 7. Add Employer Search Tests
`lib/search/employerSearchService.ts` is the primary integration anchor but has no test coverage. Add tests before wrapping with Greenhouse import functionality.

### 8. Build OAuth Token Storage Securely
Encrypt Greenhouse OAuth tokens at rest in `ats_connections`. Never log tokens. Follow Supabase vault or application-level encryption pattern.

### 9. Implement Email-Match Auto-Linking With Manual Fallback
Auto-link Greenhouse candidates to WorkVouch profiles by email, but require recruiter confirmation for ambiguous matches. Never auto-link without audit trail.

### 10. Scope Sprint 2 to Connect + Export Only
Do not attempt bidirectional sync, search integration, or enterprise multi-tenant in the first integration sprint. Sequence: Connect → Webhook → Trust score export → Manual link UI → Then expand.

---

## Go / No-Go Assessment

| Criterion | Status |
|-----------|--------|
| Core product stable (no P0 bugs) | ✅ Go |
| Trust engine consolidated | ✅ Go |
| Employer search stabilized | ✅ Go |
| Auth system documented | ✅ Go |
| Integration layer designed | ✅ Go (this audit) |
| Greenhouse OAuth credentials obtained | ⬜ Pending |
| Greenhouse partner API access confirmed | ⬜ Pending |
| Integration test framework ready | ⬜ Pending |
| `ats_*` tables designed | ✅ Go (recommended in doc 09) |

**Recommendation:** Proceed to Sprint 2 (Foundation) once Greenhouse API credentials and partner access are confirmed. Do not begin code changes until OAuth credentials are available for testing.

---

## Related Documents

- [10-summary.md](./10-summary.md) — Full architecture summary and integration strategy
- [09-greenhouse-touchpoints.md](./09-greenhouse-touchpoints.md) — Detailed touchpoint recommendations
- [08-risk-analysis.md](./08-risk-analysis.md) — Protected areas
- [docs/GREENHOUSE_SOLUTIONS_REVIEW.md](../GREENHOUSE_SOLUTIONS_REVIEW.md) — Recruiter flow review
- [docs/OPERATION_ZERO_BUGS.md](../OPERATION_ZERO_BUGS.md) — QA stabilization report
