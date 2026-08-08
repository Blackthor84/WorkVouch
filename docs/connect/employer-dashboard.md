# Employer Integration Dashboard

The **Employer Integration Dashboard** is the WorkVouch Connect experience for employers — not the Greenhouse embedded panel.

## Route

```
/employer/integrations
```

## What employers see

- Connected ATS providers (Greenhouse live; Lever/Ashby coming soon)
- Connection status and health score
- Platform and provider version
- Last sync / next scheduled sync
- Events processed, candidates/jobs/applications imported
- Automation status (trigger + enabled/disabled)
- Quick actions: **Manage**, **Sync now**, **Connect**

## API

```
GET /api/employer/integrations
```

Requires employer session. Returns:

```json
{
  "employerAccountId": "...",
  "connectVersion": "1.0.0",
  "providers": [...],
  "connections": [...],
  "observability": { "lifecycle": {...}, "webhooks": {...} }
}
```

## Navigation

Sub-pages share a horizontal nav bar:

| Page | Route |
|------|-------|
| Dashboard | `/employer/integrations` |
| Connection wizard | `/employer/integrations/connect` |
| Greenhouse details | `/employer/integrations/greenhouse` |
| Sync history | `/employer/integrations/sync` |
| Event explorer | `/employer/integrations/events` |
| Health | `/employer/integrations/health` |
| Automation | `/employer/integrations/settings` |
| Replay center | `/employer/integrations/replay` |

Pass `?connectionId={uuid}` to scope sub-pages to a specific connection.

## Design

Uses existing WorkVouch components only:

- `EmployerPortalLayout` — employer shell
- `WvPageHeader`, `WvCard`, `WvButton`, `WvBadge`, `WvStatCard`, `WvTable`

No new design system. Matches `/demo` dark glass aesthetic.

## Sidebar

**Integrations** added to employer sidebar (`/employer/integrations`).

Settings page includes an **Integrations** link for discoverability.
