# Greenhouse Embedded Panel

The WorkVouch embedded panel appears inside Greenhouse so recruiters never leave their ATS to evaluate candidate trust.

## Delivery

| Mechanism | URL |
|-----------|-----|
| Iframe page | `/integrations/greenhouse/panel?candidateId={id}&connectionId={id}&token={jwt}` |
| Demo / marketplace | `/integrations/greenhouse/panel?demo=1` |
| Panel API | `GET /api/integrations/v1/panel/greenhouse/{externalCandidateId}` |
| Token issuance | `POST /api/integrations/v1/panel/greenhouse/token` |

## Authentication

1. **Panel JWT** — `X-Panel-Token` header, 15-minute expiry, signed with `PANEL_JWT_SECRET`
2. **Employer session** — fallback with `connectionId` query param

## Components

Located in `components/integrations/greenhouse/`:

| Component | Purpose |
|-----------|---------|
| `WorkVouchPanel` | Main panel layout |
| `TrustScoreCard` | Hero trust score |
| `ExplainabilityCard` | Factor breakdown with weight/contribution/confidence |
| `VerificationCard` | Verification + reference counts |
| `EmploymentTimeline` | Verified employment history (lazy loaded) |
| `ReferenceSummary` | Reference consensus (lazy loaded) |
| `WorkflowStatus` | Lifecycle step tracker |
| `CandidateInsights` | Hiring intelligence preview (lazy loaded) |
| `ConnectionBanner` | Sync status / stale warning |
| `LoadingStates` / `EmptyStates` / `ErrorStates` | UX states |

## Panel Layout

```
Header (candidate name, stage, refresh)
Connection banner
Trust score + explainability
Verification status
Workflow status
Employment timeline (collapsible)
Reference summary (collapsible)
Hiring intelligence (collapsible)
Actions
```

**Width:** 320–360px (Greenhouse sidebar standard)  
**Theme:** Light, Greenhouse-native (`panel-theme.ts`)

## Greenhouse Configuration

1. Employer connects Greenhouse via WorkVouch Connect
2. Issue panel token via `POST /api/integrations/v1/panel/greenhouse/token`
3. Embed `panelUrl` in Greenhouse Partner Sidebar or Custom Field iframe

## Related

- [trust-score-ui.md](./trust-score-ui.md)
- [candidate-panel.md](./candidate-panel.md)
- [ui-performance.md](./ui-performance.md)
- [docs/connect/diagnostic-bundles.md](../../connect/diagnostic-bundles.md)
