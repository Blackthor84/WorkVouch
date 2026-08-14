# 07 — Greenhouse Documentation Audit

**Date:** 2026-08-13

---

## Documentation Inventory

| Location | Files | Purpose |
|----------|-------|---------|
| `docs/providers/greenhouse/` | 17 | Provider-specific technical docs |
| `docs/marketplace/` | 11 | Marketplace submission package |
| `docs/connect/` | 42+ | Connect platform architecture |
| `docs/mvp/` | Multiple | Launch/review checklists |
| `docs/product-experience/` | Demo storyboard, screenshots spec |
| `docs/operations/` | 11 | Runbooks |
| Root | `SECURITY_REVIEW.md`, `PRODUCTION_READINESS_REPORT.md`, `FINAL_QA_REPORT.md` |

---

## Status by Category

### Marketplace package (`docs/marketplace/`)

| Doc | Status | Notes |
|-----|--------|-------|
| overview.md | COMPLETE | Accurate for MVP positioning |
| architecture.md | NEEDS UPDATE | References V1 webhook flow; no V3 caveat |
| installation-guide.md | NEEDS UPDATE | Hookshot manual setup; no Site Admin note |
| configuration-guide.md | COMPLETE | Env vars documented |
| security.md | COMPLETE | Aligns with Sprint 10 hardening |
| privacy.md | COMPLETE | Location minimization stated |
| support.md | COMPLETE | Self-service + contact |
| faq.md | NEEDS UPDATE | Should note V3 migration pending |
| limitations.md | COMPLETE | Honest about MVP scope |
| review-checklist.md | COMPLETE | Internal + reviewer checklist |
| demo-script.md | COMPLETE | Demo URLs documented |

### Provider docs (`docs/providers/greenhouse/`)

| Doc | Status | Notes |
|-----|--------|-------|
| architecture.md | **STALE** | Says "Sprint 3B-1 foundation only" |
| capabilities.md | **STALE** | Says webhooks/sync not implemented |
| limitations.md | **STALE** | Says no sync, in-memory only |
| future-work.md | **STALE** | Lists implemented features as future |
| setup.md | **STALE** | In-memory until 3B-2 |
| testing.md | **STALE** | sync/webhook throw NotImplementedYetError |
| oauth.md | **STALE** | harvest:webhooks labeled future |
| event-pipeline.md | **STALE** | "Everything runs in memory" |
| configuration.md | NEEDS UPDATE | Partial |
| payload-reference.md | COMPLETE | Fixture shapes |
| mapping-guide.md | COMPLETE | Mapper reference |
| troubleshooting.md | NEEDS UPDATE | |
| embedded-panel.md | COMPLETE | |
| candidate-panel.md | COMPLETE | |

### Connect docs (`docs/connect/`)

| Status | Notes |
|--------|-------|
| MOSTLY COMPLETE | Accurate for Connect platform |
| NEEDS UPDATE | Add Harvest V1 vs V3 warning banner |

### README

| Status | Notes |
|--------|-------|
| NEEDS REVIEW | Verify Connect/Greenhouse section reflects current state |

---

## Partner Submission Assets

| Asset | Status | Reference |
|-------|--------|-----------|
| Support article | PARTIAL | `docs/marketplace/support.md` — not published externally |
| Setup instructions | COMPLETE (internal) | installation-guide.md |
| WorkVouch screenshots | **MISSING** | Checklist in demo-script.md; not captured |
| Greenhouse screenshots | **MISSING** | Not captured |
| Workflow documentation | COMPLETE (internal) | Connect + marketplace docs |
| Troubleshooting | PARTIAL | ops + marketplace support |
| Security documentation | COMPLETE | SECURITY_REVIEW.md + marketplace/security.md |
| Privacy documentation | COMPLETE | marketplace/privacy.md |
| 2–5 minute demo video | **MISSING** | Storyboard only — `docs/product-experience/13-marketplace-demo.md` |
| Demo script | COMPLETE | marketplace/demo-script.md |

---

## Blocked by Sandbox

- Real Greenhouse setup screenshots
- Live OAuth walkthrough recording
- Webhook configuration screenshots from GH admin
- Verified endpoint/scope documentation with real client ID format

---

## Documentation Actions (Future Sprints — Not This Audit)

1. Archive or rewrite stale `docs/providers/greenhouse/*` sprint docs
2. Add "Harvest V1 — V3 migration pending" banner to architecture docs
3. Produce 6 screenshots at 1280×800
4. Record 2–5 minute demo video
5. Publish support article to external help center
6. Add Site Admin requirement to installation guide
7. Document granular V3 scopes after Greenhouse approval
