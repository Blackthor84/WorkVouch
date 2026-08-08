# 09 — Greenhouse Touchpoints

> **Sprint:** Greenhouse Integration — Architecture Audit (Read-Only)  
> **Last updated:** 2026-08-07  
> **Status:** Recommendations only — no implementation

---

## Current State

WorkVouch has **no Greenhouse integration** today. The internal ATS tables (`job_postings`, `job_applications`, `saved_candidates`) serve WorkVouch-native hiring workflows only. Greenhouse partnership is roadmap-stage per `docs/GREENHOUSE_SOLUTIONS_REVIEW.md`.

This document identifies **ideal integration locations** without modifying any existing code.

---

## Integration Architecture (Recommended)

```mermaid
flowchart TB
  subgraph gh [Greenhouse]
    GHC[Greenhouse Candidates]
    GHJ[Greenhouse Jobs]
    GHW[Greenhouse Webhooks]
    GHA[Harvest API]
  end

  subgraph wv [WorkVouch — NEW integration layer]
    CONN[ats_connections table]
    SYNC[ats_candidate_sync table]
    WH[/api/integrations/greenhouse/webhook]
    API[/api/integrations/greenhouse/*]
    CRON[/api/cron/greenhouse-sync]
  end

  subgraph existing [WorkVouch — EXISTING — read only]
    PROF[profiles]
    TS[trust_scores]
    VR[verification_requests]
    SC[saved_candidates]
    EN[employer_notifications]
  end

  GHW --> WH
  GHA --> API
  WH --> SYNC
  API --> SYNC
  CRON --> SYNC
  SYNC --> PROF
  API --> TS
  API --> VR
  API --> SC
  WH --> EN
  CONN --> API
```

---

## Touchpoint 1: Employer Settings

**Location:** `/employer/settings`  
**Component:** `components/employer/company-profile-settings.tsx`  
**Recommendation:** Add new **"Integrations"** section (separate tab or card)

| UI element | Purpose |
|------------|---------|
| "Connect Greenhouse" button | OAuth flow to Greenhouse |
| Connection status badge | Connected / Disconnected / Error |
| Last sync timestamp | Transparency for recruiters |
| Disconnect button | Revoke OAuth token |
| Sync preferences toggles | Which events to sync (candidates, jobs, verifications) |

**New route (recommended):** `/employer/settings/integrations`  
**New API (recommended):**  
- `POST /api/integrations/greenhouse/connect` — initiate OAuth  
- `GET /api/integrations/greenhouse/status` — connection status  
- `DELETE /api/integrations/greenhouse/disconnect` — revoke  

**New DB table:** `ats_connections`  
```
employer_account_id, provider ('greenhouse'), access_token (encrypted),
refresh_token (encrypted), webhook_secret, connected_at, last_sync_at, status
```

> Do not modify existing settings form logic — add as new section.

---

## Touchpoint 2: Candidate Records

**Location:** `/employer/candidates/[id]`  
**Component:** `components/employer/candidate-profile-viewer.tsx`  
**Recommendation:** Add read-only **"Greenhouse"** panel showing:

| Field | Source |
|-------|--------|
| Greenhouse candidate ID | `ats_candidate_sync.external_id` |
| Application status in GH | Harvest API (cached) |
| Link to GH candidate profile | External URL |
| WorkVouch trust score (exported) | `trust_scores.score` → GH custom field |
| Verification status (exported) | `verification_requests.status` → GH custom field |

**New API (recommended):**  
- `GET /api/integrations/greenhouse/candidate/[profileId]` — sync status + GH link  
- `POST /api/integrations/greenhouse/candidate/[profileId]/push` — push trust score to GH custom field  

**Identity mapping:** `ats_candidate_sync` table  
```
employer_account_id, workvouch_profile_id, external_candidate_id,
external_application_id, last_synced_at, sync_direction
```

**Matching strategy (recommended):**
1. Email match (primary) — `profiles.email` ↔ Greenhouse candidate email
2. Manual link — recruiter maps candidate in UI
3. Webhook auto-link — on `candidate_created` webhook if email matches

> Do not modify existing trust display or paywall gates in candidate-profile-viewer.

---

## Touchpoint 3: Employer Search

**Location:** `/employer/search-users`  
**Component:** `components/employer/EmployerSearchClient.tsx`  
**Service:** `lib/search/employerSearchService.ts`  
**Recommendation:** Add optional **"Greenhouse applicants"** filter/tab

| Feature | Purpose |
|---------|---------|
| "Import from Greenhouse" button | Pull GH applicants into WorkVouch search results |
| GH badge on search results | Show which candidates are linked to GH |
| "Open in Greenhouse" link | Deep link to GH candidate |

**New API (recommended):**  
- `GET /api/integrations/greenhouse/applicants` — list GH applicants for connected employer  
- `POST /api/integrations/greenhouse/applicants/import` — create/link WorkVouch profiles  

> Do not modify existing search service logic — wrap as optional layer.

---

## Touchpoint 4: Verification Requests

**Location:** Verification flow + employer candidate viewer  
**APIs:** `/api/employer/request-employment-verification`, `/api/verification/*`  
**Recommendation:** Push verification status changes to Greenhouse custom fields

| Event | Greenhouse action |
|-------|-------------------|
| Verification requested | Add note to GH candidate: "WorkVouch verification requested" |
| Verification completed | Update GH custom field: `workvouch_verification_status = verified` |
| Verification failed/disputed | Update GH custom field + add note |

**Webhook outbound (recommended):** WorkVouch → Greenhouse Harvest API  
**Trigger points (read-only hooks — add listeners, don't modify existing handlers):**
- After `verification_requests.status` changes to `completed`
- After `employment_records.verification_status` changes

**New API (recommended):**  
- `POST /api/integrations/greenhouse/verification-sync` — manual sync trigger  
- Cron: `/api/cron/greenhouse-verification-sync` — batch sync pending statuses  

---

## Touchpoint 5: Vouch / Reference Requests

**Location:** `/requests`, coworker match flow  
**Tables:** `reference_requests`, `employment_references`  
**Recommendation:** **Defer to Sprint 2** — lower ATS value, higher privacy complexity

If pursued later:
- Export vouch count as GH custom field (`workvouch_vouch_count`)
- Do not sync vouch text content (privacy risk)

---

## Touchpoint 6: Notifications

**Location:** `/employer/notifications` — `EmployerNotificationsPanel`  
**Table:** `employer_notifications`  
**Recommendation:** Add new notification types for ATS events

| Notification type | Trigger |
|-------------------|---------|
| `greenhouse_candidate_linked` | Candidate auto-linked via email match |
| `greenhouse_sync_error` | Sync failure |
| `greenhouse_verification_pushed` | Trust score exported to GH |
| `greenhouse_webhook_received` | Inbound webhook processed |

> Add new notification type strings — do not modify existing notification rendering logic.

---

## Touchpoint 7: API Layer (Primary Integration Surface)

**Recommended new namespace:** `/api/integrations/greenhouse/v1/`

| Route | Method | Purpose |
|-------|--------|---------|
| `/connect` | POST | Initiate OAuth |
| `/callback` | GET | OAuth callback |
| `/status` | GET | Connection status |
| `/disconnect` | DELETE | Revoke connection |
| `/webhook` | POST | Inbound GH webhooks |
| `/candidates` | GET | List linked candidates |
| `/candidates/[id]/link` | POST | Manual link |
| `/candidates/[id]/push-trust-score` | POST | Export trust score |
| `/candidates/[id]/push-verification` | POST | Export verification status |
| `/jobs` | GET | List GH jobs (optional) |
| `/sync` | POST | Manual full sync trigger |

**Auth pattern:** Employer session + `employer_accounts` ownership check  
**Webhook auth:** Greenhouse webhook signature verification (mirror Stripe webhook pattern in `/api/stripe/webhook`)

---

## Touchpoint 8: Saved Candidates

**Location:** `/employer/candidates` — `SavedCandidates`  
**Table:** `saved_candidates`  
**Recommendation:** Bidirectional sync with Greenhouse prospects

| Direction | Action |
|-----------|--------|
| GH → WV | When GH candidate saved as prospect, auto-save in WorkVouch if linked |
| WV → GH | When recruiter saves candidate in WorkVouch, add GH note/tag |

**Defer to Sprint 2** — requires careful deduplication logic.

---

## Touchpoint 9: Trust Score Export

**Location:** Trust API + candidate profile  
**APIs:** `/api/trust/score/[profileId]`, `/api/trust/public/[profileId]`  
**Recommendation:** Export trust score as Greenhouse custom field

| GH custom field | WorkVouch source |
|-----------------|-----------------|
| `workvouch_trust_score` | `trust_scores.score` (0–100) |
| `workvouch_trust_band` | `lib/trust/trustBandLabels.ts` |
| `workvouch_verification_count` | Count of verified `employment_records` |
| `workvouch_vouch_count` | `trust_scores.reference_count` |
| `workvouch_profile_url` | Public profile URL (`/v/[slug]`) |

**Implementation:** Read-only export via Harvest API — never write back to trust engine from GH data.

---

## Touchpoint 10: Cron / Background Sync

**Recommended new cron endpoint:** `/api/cron/greenhouse-sync`  
**Pattern:** Mirror existing cron endpoints (CRON_SECRET protected)

| Job | Frequency | Purpose |
|-----|-----------|---------|
| Candidate sync | Every 15 min | Pull new GH applicants, link by email |
| Trust score push | Hourly | Push updated trust scores to linked GH candidates |
| Verification push | On change + hourly | Push verification status updates |
| Connection health | Daily | Refresh OAuth tokens, check webhook health |

---

## Greenhouse Webhook Events to Handle

| GH Event | WorkVouch action |
|----------|-----------------|
| `candidate_created` | Attempt email match → link or queue for manual link |
| `candidate_updated` | Update `ats_candidate_sync` metadata |
| `application_created` | Link application ID to sync record |
| `application_updated` | Update application status cache |
| `hire_candidate` | Trigger hiring outcome feedback flow |
| `reject_candidate` | Log event (no trust score impact) |

---

## Implementation Priority (Recommended Sprints)

### Sprint 2 — Foundation
1. `ats_connections` + `ats_candidate_sync` tables
2. OAuth connect flow in employer settings
3. Inbound webhook handler
4. Manual candidate link UI

### Sprint 3 — Data Sync
5. Email-based auto-linking
6. Trust score export to GH custom fields
7. Verification status export
8. Employer notifications for sync events

### Sprint 4 — Search Integration
9. Greenhouse applicants tab in employer search
10. Saved candidate bidirectional sync
11. Job posting sync (optional)

---

## Files to Create (Not Modify)

| New file | Purpose |
|----------|---------|
| `lib/integrations/greenhouse/client.ts` | Harvest API client |
| `lib/integrations/greenhouse/webhook.ts` | Webhook signature verification |
| `lib/integrations/greenhouse/sync.ts` | Sync orchestration |
| `app/api/integrations/greenhouse/v1/**` | API routes |
| `app/employer/settings/integrations/page.tsx` | Settings UI |
| `components/employer/GreenhouseIntegrationPanel.tsx` | Connection UI |
| `components/employer/GreenhouseCandidateBadge.tsx` | Profile badge |
| `supabase/migrations/YYYYMMDD_ats_connections.sql` | New tables |

---

## Files to Leave Untouched

See [08-risk-analysis.md](./08-risk-analysis.md) for complete protected list.

Key exclusions:
- `proxy.ts`, `lib/auth/*`, `lib/trust/*`, `lib/stripe/*`
- `lib/search/employerSearchService.ts` (wrap, don't rewrite)
- `components/employer/candidate-profile-viewer.tsx` (add panel, don't refactor)
- All existing `/api/employer/*` routes
