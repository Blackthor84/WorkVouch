# 03 — Greenhouse Review Checklist

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07

---

## Review Item Tracker

| # | Category | Requirement | Status | Owner | Priority |
|---|----------|-------------|--------|-------|----------|
| 1 | OAuth | OAuth 2.0 with PKCE | ⬜ Designed | Engineering | P0 |
| 2 | OAuth | Secure token storage (encrypted) | ⬜ Designed | Engineering | P0 |
| 3 | OAuth | Automatic token refresh | ⬜ Designed | Engineering | P0 |
| 4 | OAuth | Graceful disconnect + reconnect | ⬜ Designed | Engineering | P0 |
| 5 | Sandbox | GH sandbox app registered | ⬜ Blocked | Engineering | P0 |
| 6 | Sandbox | E2E tests pass in sandbox | ⬜ Not started | Engineering | P0 |
| 7 | Branding | WorkVouch logo in panel (16px) | ⬜ Designed | Design | P1 |
| 8 | Branding | Marketplace logo (512×512 PNG) | ⬜ Not started | Design | P1 |
| 9 | Branding | Consistent trust band colors | ✅ Designed | Design | P1 |
| 10 | Documentation | Installation guide | ⬜ Not started | Product | P0 |
| 11 | Documentation | API documentation | ✅ Complete | Engineering | P1 |
| 12 | Documentation | Webhook documentation | ✅ Complete | Engineering | P1 |
| 13 | Documentation | Custom field documentation | ✅ Complete | Engineering | P1 |
| 14 | Documentation | Error handling guide | ✅ Complete | Engineering | P2 |
| 15 | Support | Support email (support@workvouch.com) | ⬜ Confirm | Ops | P0 |
| 16 | Support | 24h response SLA documented | ⬜ Confirm | Ops | P1 |
| 17 | Support | In-app help links in errors | ✅ Designed | Engineering | P2 |
| 18 | Marketplace | Short description (160 chars) | ✅ Written | Product | P0 |
| 19 | Marketplace | Long description with features | ✅ Written | Product | P0 |
| 20 | Marketplace | Pricing tiers defined | ✅ Designed | Product | P1 |
| 21 | Marketplace | Categories selected | ✅ Designed | Product | P1 |
| 22 | Demo | Demo environment URL live | ⬜ Not started | Engineering | P0 |
| 23 | Demo | Demo completable in <5 min | ✅ Designed | Product | P0 |
| 24 | Demo | 3+ candidate states in demo | ✅ Designed | Product | P0 |
| 25 | Security | Webhook HMAC verification | ⬜ Designed | Engineering | P0 |
| 26 | Security | Token encryption at rest | ⬜ Designed | Engineering | P0 |
| 27 | Security | No secrets in logs | ✅ Designed | Engineering | P0 |
| 28 | Security | Tenant isolation (RLS) | ⬜ Designed | Engineering | P0 |
| 29 | Security | Vouch text never exported | ✅ Policy | Product | P0 |
| 30 | Security | Privacy policy linked | ✅ Exists | Legal | P0 |
| 31 | Performance | Panel load <800ms cached | ⬜ Target | Engineering | P0 |
| 32 | Performance | Panel load <3s fresh | ⬜ Target | Engineering | P0 |
| 33 | Performance | Webhook response <500ms | ⬜ Target | Engineering | P0 |
| 34 | Reliability | Webhook always returns 200 | ✅ Designed | Engineering | P0 |
| 35 | Reliability | Async processing + retry + DLQ | ⬜ Designed | Engineering | P0 |
| 36 | Reliability | Stale data fallback | ✅ Designed | Product | P0 |
| 37 | API Usage | Respects GH rate limits (50/10s) | ✅ Designed | Engineering | P0 |
| 38 | API Usage | Retry-After header honored | ✅ Designed | Engineering | P0 |
| 39 | Video | 90-second demo video | ⬜ Not started | Marketing | P0 |
| 40 | Installation | One-click OAuth install | ⬜ Designed | Engineering | P0 |
| 41 | Installation | Auto webhook registration | ⬜ Designed | Engineering | P0 |
| 42 | Installation | Setup in <5 min | ⬜ Target | Product | P0 |
| 43 | Support Docs | Troubleshooting guide | ⬜ Not started | Product | P1 |
| 44 | Support Docs | FAQ for common errors | ⬜ Not started | Product | P1 |
| 45 | Logo Usage | GH marketplace logo guidelines met | ⬜ Not started | Design | P1 |
| 46 | Customer Beta | 3+ beta customers connected | ⬜ Not started | CS | P0 |
| 47 | Screenshots | 6 screenshots at 1280×800 | ⬜ Not started | Design | P0 |

---

## Category Detail

### OAuth
- [ ] OAuth 2.0 authorization code flow with PKCE
- [ ] Scopes: `harvest:read`, `harvest:write`
- [ ] CSRF state token (15 min TTL)
- [ ] Token refresh on 401 + daily proactive refresh
- [ ] Disconnect revokes token and zeros encrypted fields
- [ ] Reconnect preserves candidate maps and triggers catch-up sync

### Sandbox
- [ ] GH developer app registered (sandbox)
- [ ] GH developer app registered (production)
- [ ] Sandbox webhook endpoint configured
- [ ] All E2E tests pass against sandbox
- [ ] Custom fields creatable in sandbox org

### Branding
- [ ] Panel uses WorkVouch wordmark (not full logo fill)
- [ ] Trust bands use consistent colors (green/amber/red/gray)
- [ ] Panel matches GH light mode (dark mode if GH supports)
- [ ] Marketplace listing uses approved logo assets
- [ ] No bright white pages in integration UI (dark glass per design system)

### Documentation
- [x] Integration contract docs (16 docs) — Sprint 2.75
- [x] Product experience docs (16 docs) — Sprint 2.5
- [x] Architecture docs (15 docs) — Sprint 2
- [ ] Public installation guide (customer-facing)
- [ ] Public troubleshooting guide

### Support
- [ ] support@workvouch.com active and monitored
- [ ] 24h business day response SLA documented
- [ ] Escalation path: L1 auto-retry → L2 admin alert → L3 support ticket

### Marketplace
- [x] Short description written
- [x] Long description written
- [x] Demo storyboard (90s)
- [ ] Listing submitted
- [ ] Reviewer feedback addressed
- [ ] Listing approved

### Demo
- [x] NovaTech Industries demo company spec
- [x] 4 demo candidates (verified, pending, needs review, building)
- [ ] Demo URL live: `demo.workvouch.com/greenhouse`
- [ ] Pre-connected OAuth (no live GH required for reviewer)
- [ ] Demo credentials documented

### Security
- [x] Location safety: country/state only
- [x] Vouch text export blocked by policy
- [x] Reference names export blocked by policy
- [ ] Penetration test of webhook endpoint
- [ ] RLS policies verified

### Performance
- [ ] Panel API p95 <800ms (cached)
- [ ] Panel API p95 <3s (fresh)
- [ ] Webhook p99 <500ms
- [ ] Initial sync 1000 candidates <30 min

### Reliability
- [ ] Uptime target: 99.9% for integration API
- [ ] Health check cron daily
- [ ] DLQ monitoring + admin replay
- [ ] No silent sync failures (all logged)

### API Usage
- [ ] Batch exports respect 50 req/10s limit
- [ ] Exponential backoff on 429
- [ ] No polling more frequently than necessary

---

## Review Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Internal QA complete | — | ⬜ |
| Beta (3 customers) | 2 weeks | ⬜ |
| Marketplace submission | 1 day | ⬜ |
| GH initial review | 1–2 weeks | ⬜ |
| Feedback round | 1 week | ⬜ |
| Approval | 1 week | ⬜ |

---

## Related Documents

- [04-launch-checklist.md](./04-launch-checklist.md)
- [08-beta-plan.md](./08-beta-plan.md)
- [docs/integration-contract/12-marketplace-readiness.md](../integration-contract/12-marketplace-readiness.md)
