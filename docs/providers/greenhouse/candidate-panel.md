# Candidate Panel — Greenhouse Embedded

Per-candidate panel shown when a recruiter opens a Greenhouse candidate profile.

## Information Architecture

| Section | Data |
|---------|------|
| Header | Candidate name, current stage, refresh |
| Trust | Score, band, explainability |
| Verification | Status, employment verified, reference counts |
| Workflow | 8-step lifecycle progress |
| Employment | Timeline with verification badges |
| References | Completed/pending, consensus, rehire |
| Intelligence | Avg verification/reference time, automation |
| Actions | Authorized recruiter actions |

## Link States

| State | UI |
|-------|-----|
| `synced` | Full panel with green sync indicator |
| `pending` | Partial data, invitation in progress |
| `stale` | Amber banner, cached data |
| `not_linked` | Empty state with link guidance |
| `error` | Error banner + retry |

## Actions (Permission-Gated)

| Action | Permission flag |
|--------|-----------------|
| Refresh Candidate | `canRefresh` (always) |
| Open Full Report | `canOpenFullReport` |
| View Timeline | `canViewTimeline` |
| View Audit | `canViewAudit` |
| Replay Workflow | `canReplayWorkflow` |
| Retry Sync | `canRetrySync` |

Actions open in new tab when leaving Greenhouse context is required.

## API Payload

`GreenhousePanelPayload` — see `lib/integrations/greenhouse/panel/types.ts`

Built by `GreenhousePanelService.buildPanel()` aggregating:

- `connect_candidate_map` — candidate link
- `connect_lifecycle_state` — workflow position
- `calculateTrust()` — trust score (when linked)
- `employment_records` + `verification_requests` — timeline + references
- `HiringMetricsEngine` — intelligence preview

## Empty States

- Not linked → invite/match guidance
- No trust score → verification in progress
- No timeline → pending employment verification
- No references → pending reference collection
