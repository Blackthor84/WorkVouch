# Sprint 8 Report — Employer Integration Experience

**Operation:** GREENHOUSE  
**Sprint:** 8  
**Phase:** Employer Integration Experience  
**Connect Platform Version:** 1.0.0  
**Date:** August 2026

---

## Summary

Sprint 8 delivers the **employer-facing WorkVouch Connect portal** — a complete integration experience under `/employer/integrations/`. Employers can connect Greenhouse, configure automation, monitor health, view sync/event history, replay failures, and manage connections without developer assistance.

No protected systems modified (Trust Engine, Verification Engine, Billing, Authentication, Worker/Admin dashboards).

---

## Pages Created

| Route | Page | Component |
|-------|------|-----------|
| `/employer/integrations` | Dashboard | `IntegrationsDashboardClient` |
| `/employer/integrations/connect` | Connection Wizard | `ConnectionWizardClient` |
| `/employer/integrations/greenhouse` | Provider Details | `ProviderDetailsClient` |
| `/employer/integrations/sync` | Sync History | `SyncHistoryClient` |
| `/employer/integrations/events` | Event Explorer | `EventExplorerClient` |
| `/employer/integrations/health` | Health Dashboard | `HealthDashboardClient` |
| `/employer/integrations/settings` | Automation Settings | `AutomationSettingsClient` |
| `/employer/integrations/replay` | Replay Center | `ReplayCenterClient` |

**Layout:** `app/employer/integrations/layout.tsx` — auth guard + `EmployerPortalLayout`

---

## API Routes Created

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/employer/integrations` | Dashboard summary |
| POST | `/api/employer/integrations/connect/greenhouse` | Start OAuth |
| GET | `/api/employer/integrations/connections/[id]` | Connection details |
| DELETE | `/api/employer/integrations/connections/[id]` | Disconnect |
| POST | `/api/employer/integrations/connections/[id]/reconnect` | Reconnect OAuth |
| GET | `/api/employer/integrations/connections/[id]/health` | Health report |
| POST | `/api/employer/integrations/connections/[id]/import` | Run import |
| GET | `/api/employer/integrations/connections/[id]/sync-history` | Sync timeline |
| GET | `/api/employer/integrations/connections/[id]/events` | Event history |
| POST | `/api/employer/integrations/connections/[id]/events/[eventId]/replay` | Replay event |
| GET/PATCH | `/api/employer/integrations/connections/[id]/settings` | Automation config |
| GET/POST | `/api/employer/integrations/connections/[id]/replay` | Replay center |

All routes require employer session auth and verify connection ownership.

---

## Components

| Component | Location |
|-----------|----------|
| `IntegrationSubNav` | `components/integrations/integration-nav.tsx` |
| `IntegrationsDashboardClient` | `components/integrations/` |
| `ConnectionWizardClient` | 6-step wizard |
| `ProviderDetailsClient` | Disconnect/reconnect |
| `SyncHistoryClient` | Cursor + sync log table |
| `EventExplorerClient` | Correlation search |
| `HealthDashboardClient` | Component health grid |
| `AutomationSettingsClient` | Triggers + filters |
| `ReplayCenterClient` | Failed webhook replay |

**Design system:** 100% `@/components/wv` + `EmployerPortalLayout`. No duplicate UI.

---

## Coverage

| Task | Status |
|------|--------|
| Integration dashboard | ✅ |
| Connection wizard (6 steps) | ✅ |
| Provider details | ✅ |
| Automation settings | ✅ |
| Sync history | ✅ |
| Health dashboard | ✅ |
| Event explorer | ✅ |
| Replay center | ✅ |
| OAuth connect/disconnect/reconnect | ✅ |
| Employer auth on all APIs | ✅ |
| Sidebar nav entry | ✅ |

### Dashboard metrics

- Connected providers, status, health score ✅
- Platform/provider version ✅
- Last sync, next sync ✅
- Events/candidates/jobs/applications ✅
- Automation status ✅

### Automation settings

- Invite trigger ✅
- Job/department/location filters ✅
- Delay ✅
- Manual override ✅
- Retry (via backend queue — display only) ⚠️

### Wizard steps

1. Choose provider ✅
2. Authorize OAuth ✅
3. Validate ✅
4. Import preview ✅
5. Enable automation ✅
6. Finish ✅

---

## Performance

| Metric | Result |
|--------|--------|
| Integration tests | 106/106 passing |
| Dashboard API | Single round-trip |
| Health evaluation | ~100–500ms (includes Harvest ping) |
| Client pages | Server-rendered shell + client fetch |

---

## Accessibility

- Sub-nav uses `aria-current="page"` for active tab
- Sidebar link labeled **Integrations**
- Form inputs use `label` elements via `WvInput`
- Status communicated via text + badge (not color alone)
- Table headers use `scope="col"`

---

## Regression

- All Sprint 5–7 integration tests pass (106 total)
- OAuth callback redirect updated to employer portal (was `/settings/integrations`)
- `ConnectionManager.listByEmployer()` added (additive)
- Settings page: additive Integrations link only

---

## Remaining Work

| Item | Priority |
|------|----------|
| Auto-select connection when employer has one Greenhouse connection | Medium |
| E2E Playwright tests for wizard flow | Medium |
| Email invitation delivery status in dashboard | High |
| Lever/Ashby provider cards (currently "coming soon") | Low |
| Employment type filter UI in automation settings | Low |
| Persist workflow log to Supabase for employer audit | Medium |
| Real-time health refresh (polling/WebSocket) | Low |

---

## Final Review

**Would a Greenhouse customer feel comfortable managing this integration without contacting WorkVouch support?**

### YES

An employer can:

1. **Connect** — Six-step wizard with OAuth, no API keys or terminal commands
2. **Configure automation** — Invite triggers, filters, and delay in plain language
3. **Monitor health** — Score, component breakdown, webhook metrics
4. **View history** — Sync log, cursor position, event timeline
5. **Replay failures** — Simulation and live replay from replay center
6. **Manage** — Sync now, disconnect, reconnect from provider details

The experience uses familiar WorkVouch UI patterns (same as billing and dashboard). Sub-navigation keeps all integration tools one click away. Every action goes through authenticated employer APIs — no internal developer endpoints exposed.

**Caveats:**

- `connectionId` query param required on sub-pages when multiple connections exist
- Import preview in wizard limited to 1 page (full import from dashboard)
- Lever/Ashby show "coming soon" — Greenhouse is production-ready

---

## Protected Systems — Verification

| System | Modified |
|--------|----------|
| Trust Engine | ❌ No |
| Verification Engine | ❌ No |
| Billing | ❌ No |
| Authentication | ❌ No |
| Worker Dashboard | ❌ No |
| Admin Dashboard | ❌ No |

All changes additive under `app/employer/integrations/`, `app/api/employer/integrations/`, and `components/integrations/`.
