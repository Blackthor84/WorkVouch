# Sprint 9 Report — Greenhouse Embedded Experience

**Operation Greenhouse · Sprint 9**  
**Date:** 2026-08-08  
**Phase:** Greenhouse Embedded Experience

---

## Summary

Built the embedded WorkVouch recruiter panel that appears inside Greenhouse. Recruiters see trust, verification, employment, references, and workflow status without leaving their ATS.

---

## Components Built

### UI (`components/integrations/greenhouse/`)

| Component | Status |
|-----------|--------|
| `WorkVouchPanel` | ✅ Main panel layout |
| `TrustScoreCard` | ✅ Hero trust score |
| `ExplainabilityCard` | ✅ Weight/contribution/confidence factors |
| `VerificationCard` | ✅ Verification + reference counts |
| `EmploymentTimeline` | ✅ Lazy-loaded timeline |
| `ReferenceSummary` | ✅ Lazy-loaded reference consensus |
| `CandidateInsights` | ✅ Hiring intelligence preview |
| `WorkflowStatus` | ✅ 8-step lifecycle tracker |
| `ConnectionBanner` | ✅ Sync/stale/error banner |
| `LoadingStates` | ✅ Skeletons |
| `EmptyStates` | ✅ Not linked, no trust, empty timeline/refs |
| `ErrorStates` | ✅ Error + retry |
| `GreenhousePanelClient` | ✅ Data fetch + refresh |

### Backend (`lib/integrations/greenhouse/panel/`)

| Module | Status |
|--------|--------|
| `GreenhousePanelService` | ✅ Aggregates Connect + trust data |
| `panel-auth` | ✅ JWT sign/verify (15-min) |
| `explainability` | ✅ Trust factor breakdown |
| `demo-payload` | ✅ Marketplace demo data |
| `types` | ✅ Panel payload + workflow mapping |

### Routes

| Route | Status |
|-------|--------|
| `GET /api/integrations/v1/panel/greenhouse/[id]` | ✅ |
| `POST /api/integrations/v1/panel/greenhouse/token` | ✅ |
| `/integrations/greenhouse/panel` | ✅ Iframe page |

---

## Performance

| Metric | Target | Result |
|--------|--------|--------|
| Demo payload generation | < 50ms | ✅ ~1–5ms |
| Panel initial render | Critical path only | ✅ Trust/verification/workflow first |
| Lazy sections | Non-blocking | ✅ dynamic import |
| API cache | 60s private | ✅ Cache-Control header |

---

## Accessibility

- Keyboard focus rings on all interactive elements
- `aria-label`, `aria-expanded`, `aria-live` on loading/error states
- Screen reader text for workflow step status
- Semantic headings and lists
- High-contrast Greenhouse-native light theme

---

## Regression Results

**127 integration tests passing** (9 new Sprint 9 tests)

Covers: explainability factors, workflow mapping, demo payload, JWT auth, permissions, performance budget.

---

## Marketplace Readiness

| Criterion | Status |
|-----------|--------|
| Demo panel without auth | ✅ `?demo=1` |
| Native Greenhouse look | ✅ Light theme, 360px |
| Trust explainability | ✅ Full factor breakdown |
| Self-contained iframe URL | ✅ `/integrations/greenhouse/panel` |
| Token-based embed auth | ✅ JWT panel tokens |
| Reviewer sandbox payload | ✅ Jane Chen demo candidate |

---

## Final Review

| Question | Answer |
|----------|--------|
| Would a recruiter prefer this over opening another tab? | **Yes** — trust, verification, references, workflow in sidebar |
| Would a Greenhouse reviewer believe this improves hiring workflow? | **Yes** — native panel, explainability, actionable workflow status |
| Would this help justify Greenhouse Marketplace listing? | **Yes** — demo mode, JWT embed, marketplace-ready UX |

---

## Remaining Work

- Greenhouse Partner Sidebar Extension SDK integration (iframe URL ready)
- AI summary generation from Connect orchestration (placeholder in demo)
- Real-time panel updates via webhook push (currently pull/refresh)
- Greenhouse custom field write-back for trust score export
- E2E Playwright test in GH sandbox iframe
- Panel analytics (view time, refresh rate)

---

## Preview

```
/integrations/greenhouse/panel?demo=1
```
