# 10 — UI Specification

> **Sprint:** Operation Greenhouse — Sprint 2 (Design Only)  
> **Last updated:** 2026-08-07  
> **Design system:** All UI uses `components/wv/*` — no new design patterns

---

## Overview

Integration UI lives entirely in new pages under `/employer/settings/integrations/`. Existing employer settings page receives one additive nav link only.

---

## Navigation Entry Point

**Existing page:** `/employer/settings`  
**Additive change (Sprint 3):** One nav link/tab:

```
Settings
├── Company Profile     (existing)
├── Billing             (existing)
└── Integrations        (NEW → /employer/settings/integrations)
```

---

## Page Map

```
/employer/settings/integrations/          Integrations Hub
/employer/settings/integrations/greenhouse/   Provider Detail
/employer/settings/integrations/greenhouse/setup/  Connection Wizard
/employer/settings/integrations/sync/     Sync Dashboard
/employer/settings/integrations/health/   Health & Error Dashboard
```

---

## Page 1: Integrations Hub

**Route:** `/employer/settings/integrations`  
**Component:** `IntegrationsHub.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WvPageHeader                                               │
│  eyebrow: "Settings"                                        │
│  title: "Integrations"                                      │
│  description: "Connect your ATS to sync candidates and      │
│               export WorkVouch trust scores."               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  [GH Logo]           │  │  [Lever Logo]        │        │
│  │  Greenhouse          │  │  Lever               │        │
│  │  ● Connected         │  │  Coming soon         │        │
│  │  Last sync: 2m ago   │  │                      │        │
│  │  [Manage] [Sync now] │  │  [Notify me]         │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  [Ashby Logo]        │  │  [Workday Logo]      │        │
│  │  Ashby               │  │  Workday             │        │
│  │  Coming soon         │  │  Coming soon         │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                             │
│  ── Quick Stats ──────────────────────────────────────     │
│  WvStatCard: Linked candidates: 47                          │
│  WvStatCard: Pending links: 3                               │
│  WvStatCard: Trust exports (24h): 12                        │
│  WvStatCard: Sync errors: 0                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### ProviderCard States

| State | Badge | Primary action | Secondary action |
|-------|-------|---------------|-----------------|
| Not connected | Gray "Not connected" | "Connect" | — |
| Connected | Green "Connected" | "Manage" | "Sync now" |
| Token expired | Red "Session expired" | "Reconnect" | — |
| Error | Red "Connection error" | "View error" | "Reconnect" |
| Coming soon | Gray "Coming soon" | "Notify me" (disabled) | — |

---

## Page 2: Connection Wizard

**Route:** `/employer/settings/integrations/greenhouse/setup`  
**Component:** `ConnectionWizard.tsx`

### Steps

```
Step 1: Overview
  ┌─────────────────────────────────────────┐
  │  Connect Greenhouse                     │
  │                                         │
  │  WorkVouch will:                        │
  │  ✓ Export trust scores to candidates   │
  │  ✓ Export verification status          │
  │  ✓ Link candidates by email             │
  │  ✗ NOT modify your Greenhouse data      │
  │                                         │
  │  [Continue to Greenhouse →]             │
  └─────────────────────────────────────────┘

Step 2: OAuth (redirect to Greenhouse)
  → User authorizes on Greenhouse
  → Redirect back to Step 3

Step 3: Webhook Setup (automatic)
  ┌─────────────────────────────────────────┐
  │  ✓ Connected to Greenhouse              │
  │  ✓ Webhooks registered                  │
  │  ⏳ Running initial sync...              │
  │                                         │
  │  [View integration →]                   │
  └─────────────────────────────────────────┘

Step 4: Success
  → Redirect to Provider Detail page
```

---

## Page 3: Provider Detail

**Route:** `/employer/settings/integrations/greenhouse`  
**Component:** Provider detail page

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Integrations                                     │
│                                                             │
│  [GH Logo]  Greenhouse          ● Connected                 │
│  Acme Corp Greenhouse Account                               │
│  Connected Aug 1, 2026 · Last sync 2 minutes ago           │
│                                                             │
│  [Sync now]  [Disconnect]                                   │
├─────────────────────────────────────────────────────────────┤
│  Tabs: Overview | Candidates | Sync Log | Settings          │
├─────────────────────────────────────────────────────────────┤
│  OVERVIEW TAB:                                              │
│                                                             │
│  Sync Preferences                                           │
│  ☑ Export trust scores automatically                       │
│  ☑ Export verification status                              │
│  ☐ Export vouch count                                        │
│  ☑ Auto-link candidates by email                           │
│                                                             │
│  Custom Fields (pushed to Greenhouse)                         │
│  workvouch_trust_score · workvouch_trust_band              │
│  workvouch_profile_url · workvouch_last_synced_at          │
│                                                             │
│  Recent Activity (last 5 sync operations)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ Trust score exported · Jane Smith · 2m ago        │  │
│  │ ✓ Candidate linked · john@example.com · 1h ago      │  │
│  │ ⚠ Pending link · sarah@example.com · 3h ago         │  │
│  └──────────────────────────────────────────────────────┘  │
│  [View full sync log →]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Page 4: Sync Dashboard

**Route:** `/employer/settings/integrations/sync`  
**Component:** `SyncDashboard.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WvPageHeader: "Sync activity"                              │
│  Filter: [All providers ▾] [All operations ▾] [Last 7d ▾]│
├─────────────────────────────────────────────────────────────┤
│  SyncLogTable                                               │
│  ┌────────┬──────────┬────────────┬────────┬──────────┐  │
│  │ Status │ Operation│ Candidate  │ Time   │ Duration │  │
│  ├────────┼──────────┼────────────┼────────┼──────────┤  │
│  │ ✓      │ Trust exp│ Jane Smith │ 2m ago │ 342ms    │  │
│  │ ✓      │ Link     │ john@...   │ 1h ago │ 89ms     │  │
│  │ ✗      │ Trust exp│ Bob Jones  │ 3h ago │ —        │  │
│  │ ⏭      │ Skip     │ (no link)  │ 3h ago │ —        │  │
│  └────────┴──────────┴────────────┴────────┴──────────┘  │
│  [← Prev]  Page 1 of 12  [Next →]                          │
└─────────────────────────────────────────────────────────────┘
```

**Status icons:** ✓ success, ✗ failure, ⏭ skipped, ⏳ processing, ↻ retrying

---

## Page 5: Health & Error Dashboard

**Route:** `/employer/settings/integrations/health`  
**Component:** `HealthDashboard.tsx` + `ErrorDashboard.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  WvPageHeader: "Integration health"                         │
├─────────────────────────────────────────────────────────────┤
│  Connection Health                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Greenhouse  ● Healthy   Latency: 234ms   ✓ Token OK │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Last 24 Hours                                              │
│  WvStatCard: Events processed: 847                          │
│  WvStatCard: Success rate: 98.2%                            │
│  WvStatCard: Avg sync time: 312ms                           │
│  WvStatCard: DLQ items: 2                                   │
│                                                             │
│  ── Errors requiring attention ──────────────────────────  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✗ Trust export failed · Bob Jones · token expired     │  │
│  │   [Reconnect Greenhouse]                             │  │
│  │ ✗ Candidate link failed · ambiguous email match       │  │
│  │   [Review pending links →]                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component: Candidate Link Panel

**Location:** Additive panel on `/employer/candidates/[id]` (Sprint 4)  
**Component:** `CandidateLinkPanel.tsx`

```
┌─────────────────────────────────────────┐
│  ATS Integration                        │
│  Greenhouse  ● Connected                │
│                                         │
│  Linked to: GH Candidate #12345         │
│  Last trust export: 2 minutes ago       │
│  Trust score in GH: 78 (Strong)         │
│                                         │
│  [Export trust score now]               │
│  [Open in Greenhouse ↗]                │
└─────────────────────────────────────────┘

── OR (not linked) ──

┌─────────────────────────────────────────┐
│  ATS Integration                        │
│  Greenhouse  ● Connected                │
│                                         │
│  Not linked to a Greenhouse candidate   │
│                                         │
│  [Link to Greenhouse candidate]         │
│  [Search by email]                      │
└─────────────────────────────────────────┘
```

---

## Component: Disconnect Confirm Modal

**Component:** `DisconnectConfirmModal.tsx`

```
┌─────────────────────────────────────────┐
│  Disconnect Greenhouse?                 │
│                                         │
│  This will:                             │
│  · Revoke WorkVouch's access to GH      │
│  · Stop automatic trust score exports   │
│  · Preserve sync history for audit      │
│                                         │
│  Candidate links will be preserved but  │
│  inactive until reconnected.            │
│                                         │
│  [Cancel]  [Disconnect Greenhouse]     │
└─────────────────────────────────────────┘
```

---

## Empty States

| Context | Title | Description | Action |
|---------|-------|-------------|--------|
| No connections | "No integrations connected" | "Connect your ATS to export trust scores and sync candidates." | "Browse integrations" |
| No sync log | "No sync activity yet" | "Connect an ATS and run your first sync." | "Connect Greenhouse" |
| No pending links | "All candidates linked" | "Every imported candidate is linked to a WorkVouch profile." | — |
| No errors | "All systems healthy" | "No integration errors in the last 7 days." | — |

All empty states use `WvEmptyState` from design system.

---

## Notification Integration

New employer notification types (additive to `employer_notifications`):

| Type | Message | Link |
|------|---------|------|
| `integration_connected` | "Greenhouse connected successfully" | `/employer/settings/integrations/greenhouse` |
| `integration_token_expired` | "Greenhouse session expired — reconnect to resume sync" | `/employer/settings/integrations/greenhouse` |
| `integration_sync_error` | "Trust score export failed for {name}" | `/employer/settings/integrations/health` |
| `integration_candidate_pending_link` | "New Greenhouse candidate needs manual linking" | `/employer/settings/integrations/sync` |
| `integration_candidate_auto_linked` | "Greenhouse candidate linked to WorkVouch profile" | `/employer/candidates/{id}` |

---

## Accessibility & UX Rules

- All status badges have text labels (not color-only)
- Loading states use `WvLoadingState` during OAuth redirect and sync
- Error states use `WvErrorState` with retry action
- Destructive actions (disconnect) require confirmation modal
- External links (Open in Greenhouse) open in new tab with `rel="noopener"`
- Mobile: cards stack vertically, tables become card lists

---

## Related Documents

- [09-api-design.md](./09-api-design.md)
- [06-oauth-design.md](./06-oauth-design.md)
- [docs/architecture/05-dashboard-map.md](../architecture/05-dashboard-map.md)
