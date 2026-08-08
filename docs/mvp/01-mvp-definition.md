# 01 — Greenhouse MVP Definition

> **Sprint:** Operation Greenhouse — Sprint 2.9 (MVP Lock)  
> **Last updated:** 2026-08-07  
> **Status:** Locked — no scope changes without ADR

---

## MVP Statement

> **WorkVouch for Greenhouse V1** connects an employer's Greenhouse account to WorkVouch, automatically links candidates by email, exports trust scores to Greenhouse custom fields, and displays verified trust data in an embedded recruiter panel — without the recruiter leaving Greenhouse.

**One sentence for reviewers:** *"See verified trust scores inside Greenhouse in 60 seconds."*

---

## Core Features (V1 — Must Ship)

These define the product. Removing any one fails the MVP.

| # | Feature | User | Why core |
|---|---------|------|----------|
| 1 | **OAuth connect/disconnect** | Employer Admin | Marketplace requirement; zero-config install |
| 2 | **Inbound webhooks** (candidate + application events) | System | Real-time linking and stage triggers |
| 3 | **Email auto-link** (GH candidate ↔ WV profile) | System | Eliminates manual data entry |
| 4 | **Manual link/unlink** | Recruiter | Handles ambiguous/no-email cases |
| 5 | **Trust score export** to GH custom fields | Recruiter | Primary value — score visible in GH list view |
| 6 | **Embedded recruiter panel** | Recruiter | Native GH experience; 60-second evaluation |
| 7 | **Employer integration settings** | Employer Admin | Connect, disconnect, basic automation toggle |
| 8 | **Integration health dashboard** | Employer Admin | Reliability signal; sync status visibility |
| 9 | **Stale/cached fallback** in panel | Recruiter | Never block recruiter on API failure |
| 10 | **Demo environment** | GH Reviewer | Marketplace submission requirement |

---

## Required Features (V1 — Must Ship, Supporting)

Required for reliability, security, or marketplace approval but not the headline value prop.

| # | Feature | Rationale |
|---|---------|-----------|
| R-1 | Token encryption (AES-256-GCM) | Security / marketplace |
| R-2 | Webhook HMAC verification | Security |
| R-3 | Event bus + async processing | Reliability (200 OK <500ms) |
| R-4 | Retry + DLQ for failed syncs | Reliability |
| R-5 | OAuth token refresh (cron) | Reliability |
| R-6 | `ats_*` audit tables (sync log, webhook log) | Ops / debugging |
| R-7 | 6 GH custom fields (score, band, vouch count, verification count, profile URL, last synced) | Data export |
| R-8 | Auto-invite at Final Interview (single preset: Standard) | Automation proof |
| R-9 | Send reminder from panel | Recruiter action |
| R-10 | Error states + recovery UX in panel | Product quality |
| R-11 | Contract test suite (MockAtsAdapter) | Maintainability |
| R-12 | GH sandbox E2E tests | Marketplace confidence |

---

## Nice to Have (V1 if Time Permits — Not Blockers)

Ship if completed within MVP timeline without delaying launch. Otherwise → V1.1 patch or V2.

| # | Feature | Fallback if cut |
|---|---------|-----------------|
| N-1 | Verification status export to GH | Panel shows verification; no GH field |
| N-2 | AI summary in panel | Structured fallback (score + counts) |
| N-3 | Automation presets UI (Conservative/Aggressive) | Standard preset only, hardcoded |
| N-4 | Weekly digest email to admin | In-app notifications only |
| N-5 | Custom field auto-creation on connect | Manual field setup guide |
| N-6 | Trust score threshold filter | Export all scores |

---

## Future Features (V2+)

Explicitly not in V1. Documented in [02-v1-v2-v3-roadmap.md](./02-v1-v2-v3-roadmap.md).

---

## Out of Scope (Never V1)

| Feature | Version | Reason |
|---------|---------|--------|
| Lever, Ashby, or any non-GH provider | V2+ | Focus |
| Auto-create WV profiles from GH webhooks | V2 | Privacy + consent complexity |
| Bidirectional saved candidate sync | V3 | Dedup complexity |
| Vouch text export to GH | Never | Privacy policy |
| Predictive hiring insights | V3 | Not MVP value |
| Fraud network detection | V3 | Requires scale |
| Multi-ATS dashboard | V3 | One provider first |
| Workflow builder | V3 | Over-engineering |
| Enterprise reporting / analytics | V3 | Post-PMF |
| GH job sync for filtering | V2 | Webhook job ID sufficient for V1 |
| Manager/coworker vouch count fields | V2 | Aggregate vouch count sufficient |
| Reference completion % / would rehire % | V2 | Panel shows this; GH field deferred |
| AI summary GH custom field export | V2 | Panel-only for V1 |
| KMS token encryption | V2 | Env var sufficient for launch volume |
| Side-by-side candidate comparison | V2 | Panel per-candidate sufficient |

---

## Non-Goals

1. **Replace Greenhouse** — WorkVouch augments GH, never competes with it
2. **Replace WorkVouch app** — Candidates and references still use WorkVouch directly
3. **Modify existing WorkVouch APIs** — Integration is additive only
4. **Modify existing database tables** — All integration data in `ats_*` tables
5. **Achieve 100% auto-link rate** — Manual link is an acceptable fallback
6. **Support GH customers without OAuth** — API key auth deferred indefinitely
7. **Real-time sub-second sync** — 15-minute cron + webhook is acceptable for V1
8. **White-label or multi-brand** — Single WorkVouch brand in panel and marketplace

---

## Success Criteria

| Criterion | Target | Measured by |
|-----------|--------|-------------|
| Recruiter evaluates candidate without leaving GH | 100% of panel loads | UX test |
| Panel load time (cached) | <800ms p95 | Performance test |
| Panel load time (fresh) | <3s p95 | Performance test |
| OAuth connect completes | <2 min | Demo test |
| Email auto-link rate | >70% of GH candidates with matching email | Sync metrics |
| Trust export success rate | >95% of linked candidates | Sync metrics |
| Webhook processing success | >99% (excl. invalid signatures) | Webhook metrics |
| GH marketplace approval | Approved | Marketplace status |
| Zero P0 bugs in beta | 0 | Bug tracker |
| Beta customer satisfaction | ≥4/5 | Survey |

---

## Launch Criteria

All must be true before marketplace submission:

### Product
- [ ] OAuth connect/disconnect works in GH sandbox
- [ ] Panel displays trust score, band, vouch count, verification status
- [ ] Trust score visible in GH candidate custom field / list view
- [ ] Auto-link works for single email match
- [ ] Manual link works from panel
- [ ] Auto-invite at Final Interview works
- [ ] All panel states implemented (loading, linked, not linked, stale, error)
- [ ] Demo environment live and completable in <5 min

### Reliability
- [ ] Webhook returns 200 in <500ms
- [ ] Trust export cron runs every 15 min
- [ ] Token refresh cron runs daily
- [ ] DLQ + admin replay functional
- [ ] Stale badge + cached fallback works

### Security
- [ ] Tokens encrypted at rest
- [ ] Webhook HMAC verified
- [ ] RLS on all `ats_*` tables
- [ ] Vouch text never exported
- [ ] Location country/state only

### Marketplace
- [ ] 6 screenshots at 1280×800
- [ ] 90-second demo video
- [ ] Installation guide published
- [ ] Support email confirmed
- [ ] Privacy policy linked

### Beta
- [ ] 3+ beta customers connected and syncing
- [ ] 0 P0 bugs open
- [ ] Beta satisfaction ≥4/5

---

## MVP Boundaries Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GREENHOUSE MVP V1                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Connect    │  │  Auto-Link   │  │ Trust Export │  │
│  │   OAuth      │→ │  + Manual    │→ │  6 Fields    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                                    │          │
│         ▼                                    ▼          │
│  ┌──────────────┐                    ┌──────────────┐  │
│  │  Webhooks    │                    │  GH Panel    │  │
│  │  9 events    │                    │  Trust Score │  │
│  └──────────────┘                    └──────────────┘  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  Settings    │  │  Health      │                     │
│  │  + Auto-invite│  │  Dashboard   │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘

        ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
          V2: Verification export, AI summary,
        │ Job sync, advanced fields, Lever     │
          V3: Analytics, fraud, multi-ATS
        └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

---

## Related Documents

- [02-v1-v2-v3-roadmap.md](./02-v1-v2-v3-roadmap.md)
- [06-scope-guard.md](./06-scope-guard.md)
- [10-final-go-no-go.md](./10-final-go-no-go.md)
- [docs/integration-contract/greenhouse-launch-readiness.md](../integration-contract/greenhouse-launch-readiness.md)
