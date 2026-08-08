# 10 — Architecture Summary

> **Sprint:** Greenhouse Integration — Architecture Audit (Read-Only)  
> **Last updated:** 2026-08-07

---

## Current Architecture Strengths

### 1. Clear Role Zone Separation
Worker (`(app)`), Employer (`/employer`), Admin (`/admin`), and Enterprise (`/enterprise`) zones are isolated via `proxy.ts` and `lib/auth/roleRouting.ts`. Integration work can be scoped to the employer zone without touching worker or admin flows.

### 2. Canonical Trust System
The trust engine (`lib/trust/`) is recently consolidated with a single `TrustCard`, centralized band labels (`lib/trust/trustBandLabels.ts`), and 17 API routes. This provides a clean read-only export surface for Greenhouse custom fields.

### 3. Employer Search Service
`lib/search/employerSearchService.ts` is the primary candidate discovery surface — recently stabilized in the Greenhouse Solutions Review. A natural anchor for "import from Greenhouse" functionality.

### 4. Stripe Webhook Pattern
`/api/stripe/webhook` provides a proven pattern for inbound webhook processing with signature verification and idempotency (`stripe_events` table). Direct template for Greenhouse webhook handler.

### 5. Design System Maturity
`components/wv/` (WvShell, WvCard, WvButton, WvPageHeader) provides a consistent UI foundation for new integration screens without introducing visual regressions.

### 6. Supabase Admin Convention
Workspace rule enforcing `admin` client in all API routes creates a consistent, auditable data access pattern for new integration routes.

### 7. Internal ATS Tables
`saved_candidates`, `job_postings`, `job_applications` provide a native hiring workflow that Greenhouse integration can complement rather than replace.

### 8. Recent Stabilization
Operation Zero Bugs and Greenhouse Solutions Review passes resolved P0/P1 issues in employer messages, trust API gating, onboarding, and notifications — reducing integration risk.

---

## Technical Debt

### 1. Dual Role Sources
`profiles.role` vs `app_metadata.role` used inconsistently across admin guards. Could cause auth edge cases during integration testing with employer accounts.

### 2. Partial Service Layer
`lib/services/` is only implemented for profiles. Most business logic lives in `lib/actions/` and inline API handlers — integration logic should follow existing patterns (actions + API routes) rather than forcing service layer adoption.

### 3. Type Drift
206 SQL tables but only ~80 typed in `types/database.ts`. New `ats_*` tables should be typed immediately on creation.

### 4. No API Versioning
Only `/api/v1/trust-score` is versioned. Greenhouse integration should use `/api/integrations/greenhouse/v1/` from day one.

### 5. Inconsistent API Auth Guards
135 of 462 routes use non-standard guard patterns. New integration routes must use explicit, documented auth patterns.

### 6. 22 Unused DB Tables
Industry vertical profile tables and legacy tables add schema noise. Do not reference these during integration.

### 7. Prisma Secondary ORM
Prisma is present but unused for primary data access. Do not introduce Prisma for Greenhouse integration — use Supabase admin client.

### 8. React Query Not Globally Mounted
`components/providers.tsx` (QueryClientProvider) is not mounted in root layout. Integration UI should use existing fetch patterns in employer components.

### 9. Mobile App Divergence
`mobile/` is a separate Expo app sharing the same backend. Greenhouse integration in Next.js will not automatically appear in mobile.

### 10. Cron Scheduling External
No in-repo scheduler — cron jobs require external trigger (Vercel Cron). Greenhouse sync jobs need external scheduler configuration.

---

## Potential Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Modifying trust engine during integration | 🔴 Critical | Read-only export only |
| Paywall bypass via integration routes | 🔴 Critical | Reuse `canViewCandidateProfile()` gates |
| OAuth token storage security | 🔴 Critical | Encrypt tokens in `ats_connections`; never log |
| Greenhouse webhook replay attacks | 🟡 High | Idempotency table + signature verification |
| Email match false positives | 🟡 High | Require manual confirmation for ambiguous matches |
| Location data in GH sync | 🟡 High | Enforce country/state only policy |
| Dual role source auth failures | 🟡 High | Test with real employer accounts before launch |
| Trust score export lag | 🟢 Medium | Cache + cron push; document staleness |
| GH API rate limits | 🟢 Medium | Batch sync with backoff |
| Schema migration conflicts | 🟢 Medium | Additive migrations only |

---

## Suggested Integration Strategy

### Phase 1 — Foundation (Sprint 2)
**Goal:** Connect Greenhouse without touching existing flows

```
1. Add ats_connections + ats_candidate_sync tables (additive migration)
2. Create /api/integrations/greenhouse/v1/ namespace
3. Implement OAuth connect flow
4. Implement inbound webhook handler (mirror Stripe pattern)
5. Add /employer/settings/integrations page
6. Write integration test suite
```

### Phase 2 — Data Export (Sprint 3)
**Goal:** Push WorkVouch data to Greenhouse

```
1. Trust score export to GH custom fields
2. Verification status export
3. Manual candidate link UI in profile viewer
4. Email-based auto-linking on candidate_created webhook
5. Employer notifications for sync events
```

### Phase 3 — Data Import (Sprint 4)
**Goal:** Pull Greenhouse data into WorkVouch

```
1. Greenhouse applicants tab in employer search
2. Import GH applicant → create/link WorkVouch profile
3. Saved candidate bidirectional sync
4. Optional: job posting sync
```

### Phase 4 — Enterprise (Sprint 5+)
```
1. Enterprise org-level Greenhouse connections
2. Bulk trust score export for enterprise roster
3. Greenhouse integration in enterprise dashboard
```

---

## Estimated Complexity

| Component | Complexity | Effort estimate |
|-----------|-----------|-----------------|
| DB schema (2 new tables) | Low | 1 day |
| OAuth connect flow | Medium | 3–5 days |
| Webhook handler | Medium | 3–5 days |
| Trust score export | Low | 2–3 days |
| Verification status export | Medium | 3–5 days |
| Manual candidate link UI | Low | 2–3 days |
| Email auto-linking | Medium | 3–5 days |
| Search integration tab | High | 5–8 days |
| Saved candidate sync | High | 5–8 days |
| Enterprise multi-tenant | High | 8–13 days |
| **Total (Phases 1–3)** | **Medium-High** | **~4–6 weeks** |

---

## Architecture Diagram (Current + Planned)

```mermaid
flowchart TB
  subgraph current [Current — Stable]
    PROXY[proxy.ts]
    AUTH[lib/auth/]
    TRUST[lib/trust/]
    SEARCH[lib/search/employerSearchService]
    EMP_API[/api/employer/*]
    STRIPE[/api/stripe/webhook]
  end

  subgraph planned [Planned — Sprint 2+]
    GH_CLIENT[lib/integrations/greenhouse/]
    GH_API[/api/integrations/greenhouse/v1/]
    GH_UI[/employer/settings/integrations]
    ATS_DB[(ats_connections + ats_candidate_sync)]
    GH_CRON[/api/cron/greenhouse-sync]
  end

  subgraph external [External]
    GH[Greenhouse Harvest API + Webhooks]
  end

  GH --> GH_API
  GH_API --> ATS_DB
  GH_API --> TRUST
  GH_API --> EMP_API
  GH_CRON --> GH_CLIENT
  GH_CLIENT --> GH
  GH_UI --> GH_API
  STRIPE -.->|pattern reference| GH_API
```

---

## Key Decisions Required Before Sprint 2

| Decision | Options | Recommendation |
|----------|---------|----------------|
| OAuth vs API key | OAuth 2.0 / static API key | OAuth 2.0 (Greenhouse standard) |
| Sync direction | Push only / Pull only / Bidirectional | Push first (trust score), then pull |
| Identity matching | Email only / Email + name / Manual only | Email primary + manual fallback |
| Trust score format | Integer 0–100 / Band label / Both | Both (score + band as separate fields) |
| Webhook vs polling | Real-time webhooks / Cron polling | Webhooks primary + cron fallback |
| Multi-tenant | Per employer account / Per org | Per `employer_accounts` (Sprint 2) |
| Mobile support | Include mobile / Web only | Web only initially |

---

## Documentation Index

| Doc | Purpose |
|-----|---------|
| [01-project-structure.md](./01-project-structure.md) | Folder hierarchy, layouts, providers |
| [02-database-audit.md](./02-database-audit.md) | All tables, relationships, integration points |
| [03-authentication.md](./03-authentication.md) | Auth flows, RBAC, protected routes |
| [04-api-map.md](./04-api-map.md) | All 462 API routes |
| [05-dashboard-map.md](./05-dashboard-map.md) | Worker, employer, admin, enterprise pages |
| [06-feature-inventory.md](./06-feature-inventory.md) | Major features and status |
| [07-dependencies.md](./07-dependencies.md) | NPM, external APIs, cron jobs |
| [08-risk-analysis.md](./08-risk-analysis.md) | Protected areas — do not modify |
| [09-greenhouse-touchpoints.md](./09-greenhouse-touchpoints.md) | Integration recommendations |
| [greenhouse-readiness-score.md](./greenhouse-readiness-score.md) | Readiness scores + top 10 recommendations |
