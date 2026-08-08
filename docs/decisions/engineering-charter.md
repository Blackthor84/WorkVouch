# Engineering Charter — WorkVouch ATS Integration Platform

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07  
> **Status:** Active — governs all integration engineering

---

## Mission

Build the WorkVouch ATS Integration Platform so that every recruiter sees verified trust data inside their ATS — starting with Greenhouse — without leaving their workflow, without duplicate data entry, and without compromising candidate privacy.

---

## Core Principles

1. **Never interrupt recruiter workflow** — Panel in ATS sidebar; no mandatory context switch
2. **Never require duplicate data entry** — Auto-link by email; pre-fill from ATS data
3. **Always automate when possible** — Auto-invite, auto-export, auto-link
4. **Always explain trust scores** — Band label + one-line explanation on every display
5. **Always preserve user privacy** — No vouch text export; country/state only; candidate controls visibility
6. **Fail gracefully, recover transparently** — Stale badge + cached data; never block recruiter
7. **Show status, never hide progress** — Sync timestamps, health indicators, loading states
8. **Integration is infrastructure, not a feature** — Connect once; trust data flows automatically

---

## Non-Negotiables

These rules cannot be overridden without a new ADR approved by Engineering Lead + Product Lead.

| # | Rule | Enforced by |
|---|------|-------------|
| 1 | All integration API routes use `admin` from `@/lib/supabase-admin` | Code review + linter rule |
| 2 | No modifications to existing WorkVouch tables | Migration review |
| 3 | No modifications to existing API routes (`/api/employer/*`, `/api/trust/*`, etc.) | Code review |
| 4 | No vouch text, reference names, or verifier identity exported to ATS | Code review + contract test |
| 5 | Location data limited to country/state (ISO-2 + US state) | Code review + location safety rule |
| 6 | OAuth tokens and webhook secrets encrypted at rest | Code review |
| 7 | Webhook endpoint returns 200 within 500ms | Performance test |
| 8 | All inbound webhooks verified via HMAC-SHA256 | Contract test |
| 9 | Trust score export is read-only (never recalculates) | Unit test |
| 10 | MVP scope guard enforced — no V2/V3 features without ADR | PR review |
| 11 | All new code under `lib/integrations/` and `app/api/integrations/` | Code review |
| 12 | All new tables prefixed `ats_` with RLS | Migration review |

---

## Coding Standards

- **Language:** TypeScript strict mode
- **Framework:** Next.js App Router (API routes)
- **Database:** Supabase (PostgreSQL) via `admin` client
- **UI components:** `Wv*` from `@/components/wv` (dark glass design system)
- **Icons:** Lucide only
- **Naming:** camelCase (TS), snake_case (DB columns), kebab-case (API paths)
- **Error handling:** Use `IntegrationError` hierarchy with error codes from [09-error-catalog.md](../integration-contract/09-error-catalog.md)
- **No inline styles:** Use Tailwind utility classes matching design system
- **Minimal scope:** Smallest correct diff; no unrelated changes
- **Self-documenting code:** Comments only for non-obvious business logic

---

## Architecture Standards

```
lib/integrations/
├── providers/
│   ├── base/AtsProvider.ts          ← Interface
│   ├── greenhouse/GreenhouseAdapter.ts
│   └── mock/MockAtsAdapter.ts
├── sync/                            ← Sync Engine
├── events/                          ← Event Bus
├── oauth/                           ← Token management
└── registry/                        ← ProviderRegistry

app/api/integrations/v1/             ← All integration API routes
app/api/cron/ats-*                   ← Cron endpoints

ats_* tables                         ← All integration data
```

- All ATS interaction through `AtsProvider` interface (ADR-002)
- Event-driven async processing (ADR-006)
- Additive database migrations only (ADR-007)
- Provider-agnostic API namespace (ADR-004)
- Canonical types for cross-provider data normalization

---

## Documentation Standards

- Every PR references the spec document it implements
- Architecture changes require new ADR in `docs/decisions/`
- API changes update `docs/integration-contract/05-api-contract.md`
- New error codes added to `docs/integration-contract/09-error-catalog.md`
- Customer-facing docs updated before marketplace submission
- Sprint number and date in every doc header

---

## Security Standards

Per ADR-011:

- Encrypt secrets: AES-256-GCM (`ATS_ENCRYPTION_KEY` env var)
- Verify webhooks: HMAC-SHA256, timing-safe compare
- Tenant isolation: RLS on all `ats_*` tables
- Panel auth: JWT, 15-min expiry, signed with `PANEL_JWT_SECRET`
- OAuth: PKCE, CSRF state token, 15-min TTL
- No secrets in logs (payload hash only)
- Rate limiting on integration API endpoints
- CRON_SECRET on all cron endpoints
- Data minimization: aggregate exports only

---

## Testing Standards

Per ADR-013:

| Layer | When | Target |
|-------|------|--------|
| Unit (MockAtsAdapter) | Every PR | 54 cases |
| Contract (schema) | Every PR | 12 cases |
| Integration (GH sandbox) | Staging deploy | 15 scenarios |
| Acceptance (demo) | Pre-marketplace | 8 scenarios |
| Failure injection | Pre-launch | 8 scenarios |
| Load | Pre-launch | 5 scenarios |
| Regression | Every PR | 6 areas |

**Gate:** No PR merges with failing unit or contract tests.

---

## Definition of Done

A task is done when:

- [ ] Code implements the spec document exactly
- [ ] Unit tests written and passing
- [ ] Contract tests passing (if API/schema change)
- [ ] No linter errors
- [ ] No modifications to protected files
- [ ] Error codes match error catalog
- [ ] RLS policies verified (if new table)
- [ ] Code reviewed and approved
- [ ] Sync log / webhook log entries written for all operations
- [ ] No secrets in code or logs

---

## Definition of Production Ready

The integration platform is production ready when:

- [ ] All V1 core features (10) and required features (12) implemented
- [ ] All launch checklist items in [04-launch-checklist.md](../mvp/04-launch-checklist.md) checked
- [ ] Beta exit criteria met (3+ customers, ≥4/5 satisfaction, 0 P0/P1 bugs)
- [ ] Performance targets met (panel <3s, webhook <500ms, sync <2s)
- [ ] Security checklist complete (encryption, HMAC, RLS, no PII export)
- [ ] Monitoring dashboards operational with alerts configured
- [ ] Support runbook written and validated with real ticket
- [ ] Rollback plan tested (feature flag disable + data preserved)
- [ ] Production environment variables configured
- [ ] Cron jobs scheduled in production

---

## Definition of Marketplace Ready

The integration is marketplace ready when:

- [ ] Production ready (all criteria above)
- [ ] Demo environment live and completable in <5 min
- [ ] 6 screenshots at 1280×800 produced
- [ ] 90-second demo video produced
- [ ] Installation guide published (customer-facing)
- [ ] Troubleshooting guide published
- [ ] Support email active and monitored
- [ ] Privacy policy linked in listing
- [ ] Pricing tiers defined and published
- [ ] GH sandbox E2E tests passing
- [ ] GH production OAuth app registered
- [ ] Marketplace listing copy finalized
- [ ] All items in [03-greenhouse-review-checklist.md](../mvp/03-greenhouse-review-checklist.md) addressed

---

## Decision Authority

| Decision type | Authority | Process |
|---------------|-----------|---------|
| Implementation detail | Engineer | Code review |
| Architecture change | Engineering Lead | New ADR required |
| Scope change (V1) | Product Lead + Engineering Lead | New ADR + scope guard update |
| Security exception | Engineering Lead + Security | New ADR required |
| Marketplace submission | Product Lead | Launch checklist complete |
| Go/no-go for launch | Product Lead + Engineering Lead | [10-final-go-no-go.md](../mvp/10-final-go-no-go.md) |

---

## ADR Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-why-integration-layer.md) | Why Integration Layer | Accepted |
| [ADR-002](./ADR-002-why-provider-adapters-were-selected.md) | Why Provider Adapters | Accepted |
| [ADR-003](./ADR-003-why-existing-apis-remain-untouched.md) | Why Existing APIs Untouched | Accepted |
| [ADR-004](./ADR-004-why-integrations-use-api-v1-namespace.md) | Why /api/integrations/v1 | Accepted |
| [ADR-005](./ADR-005-why-greenhouse-is-provider-1.md) | Why Greenhouse First | Accepted |
| [ADR-006](./ADR-006-why-event-driven-architecture.md) | Why Event-Driven | Accepted |
| [ADR-007](./ADR-007-why-additive-database-migrations.md) | Why Additive Migrations | Accepted |
| [ADR-008](./ADR-008-why-mvp-scope-is-intentionally-limited.md) | Why Limited MVP | Accepted |
| [ADR-009](./ADR-009-why-oauth-over-api-keys.md) | Why OAuth | Accepted |
| [ADR-010](./ADR-010-how-future-ats-providers-will-be-added.md) | How to Add Providers | Accepted |
| [ADR-011](./ADR-011-security-principles.md) | Security Principles | Accepted |
| [ADR-012](./ADR-012-marketplace-strategy.md) | Marketplace Strategy | Accepted |
| [ADR-013](./ADR-013-testing-philosophy.md) | Testing Philosophy | Accepted |
| [ADR-014](./ADR-014-documentation-philosophy.md) | Documentation Philosophy | Accepted |
| [ADR-015](./ADR-015-long-term-vision.md) | Long-Term Vision | Accepted |

---

## Related Documents

- [docs/mvp/01-mvp-definition.md](../mvp/01-mvp-definition.md)
- [docs/mvp/10-final-go-no-go.md](../mvp/10-final-go-no-go.md)
- [docs/integration-contract/greenhouse-launch-readiness.md](../integration-contract/greenhouse-launch-readiness.md)
- [docs/integrations/15-architecture-review.md](../integrations/15-architecture-review.md)
