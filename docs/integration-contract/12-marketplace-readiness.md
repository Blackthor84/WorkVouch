# 12 — Marketplace Readiness

> **Sprint:** Operation Greenhouse — Sprint 2.75 (Integration Contracts)  
> **Last updated:** 2026-08-07  
> **Status:** Design specification — no implementation

---

## Greenhouse Marketplace Review Criteria

Greenhouse Solutions reviewers evaluate integrations across 10 dimensions. This document maps each criterion to WorkVouch deliverables and acceptance criteria.

---

## 1. OAuth

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| OAuth 2.0 with PKCE | `06-oauth-design.md` + `10-sequence-diagrams.md` #10 | ✅ Designed |
| Secure token storage (encrypted) | `ats_connections.access_token_encrypted` AES-256-GCM | ✅ Designed |
| Token refresh (automatic) | Daily cron + reactive on 401 | ✅ Designed |
| Graceful disconnect | Revoke + zero tokens + preserve maps | ✅ Designed |
| Reconnect without data loss | Catch-up sync on reconnect | ✅ Designed |
| CSRF protection | State token in `ats_oauth_states` (15 min TTL) | ✅ Designed |

**Acceptance:** Reviewer completes OAuth connect in <2 minutes.

---

## 2. Branding

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| WorkVouch logo in panel | 16px wordmark in GH sidebar | ✅ Designed |
| Consistent color scheme | Trust bands: green/amber/red/gray | ✅ Designed |
| Marketplace listing logo | 512×512 PNG | ⬜ Asset needed |
| Marketplace screenshots | 6 screenshots at 1280×800 | ⬜ Sprint 3 |
| Demo video | 90-second storyboard | ✅ Designed |
| Brand guidelines compliance | Dark-first, glass surfaces per design system | ✅ Designed |

---

## 3. Documentation

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| Installation guide | Employer connect flow (03-employer-experience.md) | ✅ Designed |
| API documentation | 05-api-contract.md | ✅ Designed |
| Webhook documentation | 04-webhook-contract.md | ✅ Designed |
| Custom field documentation | 07-custom-fields.md | ✅ Designed |
| Error handling guide | 09-error-catalog.md | ✅ Designed |
| Support contact | support@workvouch.com + docs URL | ⬜ Confirm |
| Privacy policy link | Required in marketplace listing | ✅ Exists |
| SOC2 compliance mention | Location safety + data minimization | ✅ Designed |

---

## 4. Demo

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| Demo environment URL | `demo.workvouch.com/greenhouse` | ⬜ Sprint 3 |
| Demo completable in <5 min | NovaTech Industries demo spec | ✅ Designed |
| 3+ candidate states | Verified, pending, needs review | ✅ Designed |
| Pre-connected OAuth | Demo token (no live GH required) | ⬜ Sprint 3 |
| AI summaries pre-generated | Cached demo summaries | ⬜ Sprint 3 |
| Demo credentials documented | demo@novatech.com / demo1234 | ✅ Designed |

---

## 5. Security

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| Webhook HMAC verification | SHA-256 with timing-safe compare | ✅ Designed |
| Token encryption at rest | AES-256-GCM | ✅ Designed |
| No secrets in logs | Payload hash only | ✅ Designed |
| Tenant isolation | employer_account_id on all tables + RLS | ✅ Designed |
| Vouch text never exported | Hard rule in all contracts | ✅ Designed |
| Location privacy (country/state only) | Hard rule in all contracts | ✅ Designed |
| RBAC for integration settings | Org Admin only for connect/disconnect | ✅ Designed |
| Rate limiting | Internal API rate limits documented | ✅ Designed |
| SOC2 alignment | Data minimization, least privilege | ✅ Designed |

---

## 6. Support

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| Support email | support@workvouch.com | ⬜ Confirm |
| Support response SLA | 24 hours business days | ⬜ Confirm |
| In-app help links | docsUrl in error responses | ✅ Designed |
| Status page | status.workvouch.com | ⬜ Confirm |
| Escalation path | L1 auto-retry → L2 admin → L3 support ticket | ✅ Designed |

---

## 7. Installation

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| One-click install | OAuth connect from marketplace | ✅ Designed |
| No manual webhook setup | Auto-register on connect | ✅ Designed |
| Custom field creation | Auto-create with employer approval | ✅ Designed |
| Initial sync automatic | Post-connect candidate sync | ✅ Designed |
| Setup completable in <5 min | Connect → sync → ready | ✅ Designed |
| Automation presets | Conservative / Standard / Aggressive / Post-offer | ✅ Designed |

---

## 8. Reliability

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| Webhook always returns 200 | Golden rule in 04-webhook-contract.md | ✅ Designed |
| Async processing | Event bus + worker | ✅ Designed |
| Retry with backoff | 5 attempts, exponential | ✅ Designed |
| DLQ for failed events | Admin replay capability | ✅ Designed |
| Stale data fallback | Panel shows cached + badge | ✅ Designed |
| Health monitoring | Daily health check + alerts | ✅ Designed |
| Uptime target | 99.9% for integration API | ⬜ SLA needed |

---

## 9. Performance

| Requirement | WorkVouch Deliverable | Target |
|-------------|----------------------|--------|
| Panel load (cached) | Panel API with 15-min cache | <800ms |
| Panel load (fresh) | Panel API cold | <3s |
| Webhook response | Return 200 | <500ms |
| Trust export (single) | PATCH custom fields | <2s |
| Initial sync (1000 candidates) | Batch with rate limit respect | <30 min |
| OAuth connect | Full flow | <10s |

---

## 10. Versioning

| Requirement | WorkVouch Deliverable | Status |
|-------------|----------------------|--------|
| API versioning | `/api/integrations/v1/` | ✅ Designed |
| Breaking changes → v2 | Documented policy | ✅ Designed |
| Provider manifest version | `apiVersion: "1.0"` | ✅ Designed |
| Custom field backward compatibility | Additive only; never rename | ✅ Designed |
| Webhook payload versioning | Adapter handles schema changes | ✅ Designed |
| Migration path for field changes | Re-create fields on connect | ✅ Designed |

---

## Marketplace Listing Checklist

- [ ] OAuth flow tested in GH sandbox
- [ ] 6 screenshots at 1280×800 minimum
- [ ] 90-second demo video produced
- [ ] Short description (160 chars) written
- [ ] Long description with feature list written
- [ ] Privacy policy URL linked
- [ ] Support email confirmed
- [ ] Pricing tiers defined (Free / Pro / Enterprise)
- [ ] Demo environment live and accessible
- [ ] Custom fields auto-created on connect
- [ ] Trust score visible in GH candidate list view
- [ ] Panel loads in <3 seconds
- [ ] Error states documented and tested
- [ ] SOC2 compliance mentioned
- [ ] Categories selected (Background Checks, Candidate Experience, Analytics)

---

## Review Timeline Estimate

| Phase | Duration | Dependency |
|-------|----------|------------|
| Submit listing | 1 day | All checklist items complete |
| GH initial review | 1–2 weeks | GH reviewer assigned |
| Feedback round | 1 week | Address reviewer comments |
| Approval | 1 week | Final sign-off |
| **Total** | **3–5 weeks** | From submission |

---

## Related Documents

- [13-provider-manifest.md](./13-provider-manifest.md)
- [docs/product-experience/13-marketplace-demo.md](../product-experience/13-marketplace-demo.md)
- [greenhouse-launch-readiness.md](./greenhouse-launch-readiness.md)
