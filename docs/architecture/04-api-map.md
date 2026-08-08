# 04 — API Map

> **Sprint:** Greenhouse Integration — Architecture Audit (Read-Only)  
> **Last updated:** 2026-08-07  
> **Total routes:** 462 handlers under `app/api/**`

---

## Conventions

| Rule | Detail |
|------|--------|
| DB access | All routes use `admin` from `@/lib/supabase-admin` |
| Auth pattern | Session via `getUser()` / `getEffectiveUser()` → query with user filter |
| Proxy | API routes are **not** role-gated at edge — each handler enforces auth |
| Response | JSON; errors typically `{ error: string }` |

### Auth Classification Legend

| Tag | Meaning |
|-----|---------|
| **admin-guard** | `requireAdminForApi`, `requireSuperAdminForApi`, finance/board guards |
| **authenticated** | Valid Supabase session required |
| **employer** | Session + employer role/plan checks |
| **cron/secret** | `CRON_SECRET` or Bearer authorization |
| **public** | Unauthenticated or token-based |
| **webhook** | External signature verification (Stripe) |

---

## Prefix Summary

| Prefix | Count | Primary auth | Integration relevance |
|--------|------:|--------------|----------------------|
| `admin` | 194 | admin-guard | Internal only — do not expose to Greenhouse |
| `employer` | 67 | authenticated (employer) | **High** — candidate search, verification, saved candidates |
| `user` | 27 | authenticated | Worker profile, jobs, disputes |
| `trust` | 17 | authenticated + 1 public | **High** — trust score export |
| `verification` | 8 | authenticated + public token | **High** — verification workflow |
| `onboarding` | 8 | authenticated | Worker onboarding |
| `stripe` | 8 | mixed | Billing — do not modify |
| `cron` | 6 | cron/secret | Background jobs |
| `sandbox` | 26 | admin/mixed | Dev only |
| Others | 115 | mixed | See sections below |

---

## Integration-Critical Routes (Greenhouse-Relevant)

### Employer — Candidate & Search

| Method | Route | Auth | Purpose | Key files |
|--------|-------|------|---------|-----------|
| GET | `/api/employer/search-users` | employer | Candidate search by name/role/trust | `lib/search/employerSearchService.ts` |
| GET | `/api/employer/verified-workers` | employer | Verified candidate directory | `VerifiedWorkersDashboardClient` consumer |
| GET | `/api/employer/candidate/[id]/verification-summary` | employer | Verification status summary | `candidate-profile-viewer` |
| GET | `/api/employer/candidate/[id]/employment-verification` | employer | Employment verification detail | Trust panels |
| GET | `/api/employer/candidate/[id]/hiring-confidence` | employer | Hiring confidence score | `HiringConfidenceCard` |
| GET | `/api/employer/candidate/[id]/reference-consistency` | employer | Vouch/reference alignment | `ReferenceConsistencyPanel` |
| GET | `/api/employer/candidate/[id]/timeline` | employer | Trust timeline | `TrustTimelinePanel` |
| GET | `/api/employer/candidate/[id]/network-depth` | employer | Trust graph depth | `TrustGraphDepthCardCandidate` |
| POST | `/api/employer/request-employment-verification` | employer | Initiate verification request | Verification flow |
| POST | `/api/employer/request-verification` | employer | Request verification (alternate) | Verification flow |
| GET/POST | `/api/employer/resume-requests` | employer | Request candidate resume | Paywall-gated |
| GET | `/api/employer/listed-employees` | employer | Listed employees on platform | Dashboard |
| GET | `/api/employer/notifications` | employer | Employer notification feed | `EmployerNotificationsPanel` |
| GET | `/api/employer/me` | employer | Current employer account | Onboarding, settings |
| POST | `/api/employer/onboarding/create` | employer | Create employer account (atomic) | Onboarding wizard |
| GET | `/api/employer/entitlements` | employer | Plan entitlements | Paywall gates |
| GET | `/api/employer/legal-acceptance` | employer | Legal disclaimer status | Search gate |
| POST | `/api/employer/legal-acceptance` | employer | Accept legal disclaimer | Search gate |

### Trust

| Method | Route | Auth | Purpose | Key files |
|--------|-------|------|---------|-----------|
| GET | `/api/trust/score` | authenticated | Current user trust score | Dashboard |
| GET | `/api/trust/score/[profileId]` | authenticated | Profile trust score | Profile views |
| GET | `/api/trust/[userId]` | authenticated | Trust data for user | `TrustCardEmployerView` |
| GET | `/api/trust/explain` | authenticated | Trust score explanation | `TrustCard` |
| GET | `/api/trust/public/[profileId]` | **public** | Public trust summary | Public profiles |
| GET | `/api/trust/graph/[candidateId]` | authenticated | Trust network graph | `/employer/trust-graph/[id]` |
| GET | `/api/trust/report` | authenticated | Trust report | Reports |
| GET | `/api/v1/trust-score` | authenticated | Versioned trust score API | External consumers |

### Verification

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/verification/request` | authenticated | Submit verification request |
| POST | `/api/verification/respond` | authenticated | Respond to verification |
| GET | `/api/verification/pending` | authenticated | List pending verifications |
| POST | `/api/verification/invite` | authenticated | Send verification invite |
| GET | `/api/verification/invite/[token]` | **public** | Read invite by token |
| POST | `/api/verification/invite/[token]/respond` | **public** | Respond via token |
| POST | `/api/verification/bulk-request` | authenticated | Bulk verification requests |

### Public / Token Flows

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/public/vouch-invite/[token]` | public | Read vouch invite |
| POST | `/api/public/vouch-invite/[token]/respond` | public | Respond to vouch invite |
| GET | `/api/credential/[token]` | public | WorkVouch credential view |
| GET | `/api/public/credential` | public | Public credential |

### Webhooks (Future Greenhouse inbound)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/stripe/webhook` | Stripe signature | Subscription sync — **pattern reference for ATS webhooks** |

> **No Greenhouse webhook route exists today.** Stripe webhook is the closest pattern to follow.

---

## Complete Route Index by Namespace

### Root & Misc (22)

| Route | Methods | Auth |
|-------|---------|------|
| `/api/health` | GET | public |
| `/api/ping` | GET | public |
| `/api/env-check` | GET | public |
| `/api/notifications` | GET | authenticated |
| `/api/messages` | GET, POST | authenticated |
| `/api/events` | POST | unknown |
| `/api/accept-invite` | POST | public |
| `/api/get-invite` | GET | public |
| `/api/create-checkout-session` | POST | authenticated |
| `/api/create-portal-session` | POST | authenticated |
| `/api/checkout` | POST | unknown |
| `/api/hiring-calculations` | GET, POST | authenticated |
| `/api/jobs/create-with-verifications` | POST | authenticated |
| `/api/match-employment` | POST | authenticated |
| `/api/save-parsed-profile` | POST | authenticated |
| `/api/search/passport` | GET, POST | authenticated |
| `/api/security-report` | POST | public |
| `/api/signup` | POST | unknown |
| `/api/subscription-status` | GET | unknown |
| `/api/trades` | GET | public |
| `/api/workvouch/profile/[id]` | GET | authenticated |
| `/api/coworkers/overlap` | GET | authenticated |

### account (7)

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/account/delete` | POST | authenticated | GDPR deletion |
| `/api/account/export` | GET | authenticated | Data export |
| `/api/account/update-profile` | POST | authenticated | Update name |
| `/api/account/request-email-change` | POST | authenticated | Email change |
| `/api/account/confirm-email-change` | POST | unknown | Confirm email |
| `/api/account/revoke-email-change` | POST | unknown | Revoke change |
| `/api/account/email-change-history` | GET | authenticated | History |

### activity (2)

| Route | Methods | Auth |
|-------|---------|------|
| `/api/activity` | GET | authenticated |
| `/api/activity/log` | POST | authenticated |

### admin (194)

Grouped by subdomain. All require admin-guard unless noted.

| Subdomain | Routes | Purpose |
|-----------|--------|---------|
| **Users** | `/api/admin/users`, `/api/admin/users/[id]/*` | User CRUD, suspend, recalc trust, fraud signals |
| **Employers** | `/api/admin/employers*`, `/api/admin/employer-accounts`, `/api/admin/employer-usage` | Employer management |
| **Organizations** | `/api/admin/organizations`, `/api/admin/org-health`, `/api/admin/claim-requests` | Org + claim queue |
| **Analytics** | `/api/admin/analytics/*` | Funnels, heatmaps, journeys, abuse, real-time |
| **Disputes** | `/api/admin/dispute*`, `/api/admin/compliance-disputes`, `/api/admin/resolve-dispute` | Dispute resolution |
| **Trust** | `/api/admin/trust/adjust`, `/api/admin/reputation/recalc`, `/api/admin/users/[id]/recalculate` | Trust admin tools |
| **Verification** | `/api/admin/approve-verification`, `/api/admin/reject-verification`, `/api/admin/verification-requests` | Verification queue |
| **Financials** | `/api/admin/financials/*`, `/api/admin/board` | Revenue (gated) |
| **Impersonation** | `/api/admin/impersonate/*`, `/api/admin/stop-impersonation` | Admin impersonation |
| **Sandbox v2** | `/api/admin/sandbox-v2/*` (26 routes) | Synthetic data lab |
| **Simulation lab** | `/api/admin/simulation-lab/*` (12 routes) | Load testing |
| **Control center** | `/api/admin/control-center/*`, `/api/admin/dashboard/overview` | Platform KPIs |
| **Feature flags** | `/api/admin/feature-flags/*` | Feature gating |
| **Audit** | `/api/admin/audit-logs`, `/api/admin/incidents/*` | Audit trail |

### analytics (5)

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/analytics/heatmap` | GET | authenticated | Aggregated country/state heat map |
| `/api/analytics/event` | POST | authenticated | Event capture |
| `/api/analytics/capture` | POST | authenticated | Analytics capture |
| `/api/analytics/site-event` | POST | unknown | Site events |
| `/api/analytics/track` | POST | unknown | Tracking |

### auth (3)

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/auth/post-login-redirect` | GET | authenticated | Role-based redirect URL |
| `/api/auth/redirect-destination` | GET | authenticated | Redirect helper |
| `/api/auth/signup` | POST | unknown | Legacy (501) |

### cron (6)

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/cron/verification-reminder` | GET | cron/secret | SMS verification reminders |
| `/api/cron/worker-onboarding-reminders` | GET | cron/secret | Onboarding nudges |
| `/api/cron/nightly-intelligence-recalc` | POST | cron/secret | Trust score recalc |
| `/api/cron/trust-benchmarks` | POST | cron/secret | Industry benchmarks |
| `/api/cron/purge-deleted-users` | POST | cron/secret | Hard-delete soft-deleted users |
| `/api/cron/credentials-compliance` | POST | cron/secret | Credential compliance |

### employer (67) — Full list

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/employer/search-users` | GET | Candidate search |
| `/api/employer/search-employees` | GET | Employee search |
| `/api/employer/verified-workers` | GET | Verified candidates |
| `/api/employer/me` | GET | Current employer |
| `/api/employer/onboarding/create` | POST | Create employer account |
| `/api/employer/dashboard-stats` | GET | Dashboard KPIs |
| `/api/employer/notifications` | GET | Notifications |
| `/api/employer/entitlements` | GET | Plan entitlements |
| `/api/employer/legal-acceptance` | GET, POST | Legal gate |
| `/api/employer/usage` | GET | Lookup usage |
| `/api/employer/verification-limit` | GET | Verification quota |
| `/api/employer/compare` | GET | Candidate comparison |
| `/api/employer/listed-employees` | GET | Listed employees |
| `/api/employer/listing-summary` | GET | Listing summary |
| `/api/employer/resume-requests` | GET, POST | Resume requests |
| `/api/employer/rehire` | GET, POST | Rehire registry |
| `/api/employer/claim-request` | POST | Company claim |
| `/api/employer/companies-to-claim` | GET | Claimable companies |
| `/api/employer/file-dispute` | POST | File dispute |
| `/api/employer/dispute-employment` | POST | Dispute employment |
| `/api/employer/confirm-employment` | POST | Confirm employment |
| `/api/employer/request-employment-verification` | POST | Request verification |
| `/api/employer/request-verification` | POST | Request verification |
| `/api/employer/credentials` | GET, POST | WorkVouch credentials |
| `/api/employer/credentials/[id]` | GET | Credential detail |
| `/api/employer/workvouch-credential/view` | POST | Log credential view |
| `/api/employer/candidate/[id]/*` | GET | Candidate detail panels (8 sub-routes) |
| `/api/employer/analytics/*` | GET | Analytics export, rehire, trust-scores |
| `/api/employer/workforce-risk/*` | GET | Workforce risk (5 sub-routes) |
| `/api/employer/hiring-intelligence/summary` | GET | Enterprise hiring intelligence |
| `/api/employer/policies` | GET, POST | Trust policies |
| `/api/employer/automation/*` | GET, POST | Trust automation rules/alerts |
| `/api/employer/roster-upload` | POST | Bulk roster CSV |
| `/api/employer/add-seat` | POST | Add team seat |
| `/api/employer/update-company` | POST | Update company profile |
| `/api/employer/resolve-name` | POST | Employer name resolution |
| `/api/employer/simulation/consume` | POST | Simulation quota |

### onboarding (8)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/onboarding/status` | GET | Onboarding progress |
| `/api/onboarding/complete` | POST | Mark complete |
| `/api/onboarding/profile` | POST | Save profile |
| `/api/onboarding/vouch/state` | GET | Vouch onboarding state |
| `/api/onboarding/vouch/job` | POST | Add job in vouch flow |
| `/api/onboarding/vouch/contacts` | PUT | Save contacts |
| `/api/onboarding/vouch/sendinvite` | POST | Send invite |
| `/api/onboarding/vouch/done` | POST | Complete vouch flow |

### resume (6)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/resume/parse` | POST | AI resume parsing |
| `/api/resume/upload` | POST | Upload resume |
| `/api/resume/me` | GET | Current user resume |
| `/api/resume/export` | GET | PDF export |
| `/api/resume/confirm` | POST | Confirm parsed data |
| `/api/resume/view` | POST | Log resume view |

### stripe (8)

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/stripe/webhook` | POST | webhook | Subscription sync |
| `/api/stripe/checkout` | POST | unknown | Checkout |
| `/api/stripe/create-checkout` | POST | authenticated | Create checkout |
| `/api/stripe/create-checkout-session` | POST | public | Checkout session |
| `/api/stripe/portal` | POST | authenticated | Billing portal |
| `/api/stripe/billing-portal` | POST | authenticated | Billing portal |
| `/api/stripe/checkout-simple` | POST | unknown | Simple checkout |
| `/api/stripe/test` | GET | unknown | Test endpoint |

### trust (17)

| Route | Methods | Auth |
|-------|---------|------|
| `/api/trust/score` | GET | authenticated |
| `/api/trust/score/[profileId]` | GET | authenticated |
| `/api/trust/[userId]` | GET | authenticated |
| `/api/trust/explain` | GET | authenticated |
| `/api/trust/timeline` | GET | authenticated |
| `/api/trust/timeline/[profileId]` | GET | authenticated |
| `/api/trust/trajectory` | GET | authenticated |
| `/api/trust/forecast/[profileId]` | GET | authenticated |
| `/api/trust/benchmark/[profileId]` | GET | authenticated |
| `/api/trust/radar/[profileId]` | GET | authenticated |
| `/api/trust/network/[profileId]` | GET | authenticated |
| `/api/trust/network-depth/[profileId]` | GET | authenticated |
| `/api/trust/graph/[candidateId]` | GET | authenticated |
| `/api/trust/coverage` | GET | authenticated |
| `/api/trust/coworkers/[employmentRecordId]` | GET | authenticated |
| `/api/trust/report` | GET, POST | authenticated |
| `/api/trust/public/[profileId]` | GET | **public** |

### user (27)

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/user/me` | GET | Current user + impersonation flag |
| `/api/user/choose-role` | POST | Set employee/employer role |
| `/api/user/profile` | GET | Profile data |
| `/api/user/add-job` | POST | Add job |
| `/api/user/edit-job` | POST | Edit job |
| `/api/user/employment-history` | GET | Employment history |
| `/api/user/request-verification` | POST | Request verification |
| `/api/user/disputes` | POST | File dispute |
| `/api/user/dispute-status` | GET | Dispute status |
| `/api/user/dispute-evidence` | POST | Upload evidence |
| `/api/user/appeals` | POST | Submit appeal |
| `/api/user/trust-coaching` | GET | Trust coaching tips |
| `/api/user/trust-activity` | GET | Trust activity feed |
| `/api/user/references-insights` | GET | Reference insights |
| `/api/user/career-health` | GET | Career health score |
| `/api/user/hiring-confidence` | GET | Hiring confidence |
| `/api/user/behavioral-summary` | GET | Behavioral summary |
| `/api/user/profile-completeness` | GET | Profile completeness |
| `/api/user/profile-strength` | GET | Profile strength |
| `/api/user/profile-visibility` | GET, PATCH | Visibility settings |
| `/api/user/passport-pdf` | GET | Passport PDF |
| `/api/user/passport-visibility` | PATCH | Passport visibility |
| `/api/user/set-visibility` | POST | Set visibility |
| `/api/user/workvouch-credential` | GET, POST | Credential management |
| `/api/user/workvouch-credential/[id]` | GET, PATCH | Credential detail |
| `/api/user/filter-coworkers` | POST | Filter coworkers |

### sandbox (26), verification (8), enterprise (3), disputes (2), e2e (5)

See [01-project-structure.md](./01-project-structure.md) for sandbox/admin route details. Sandbox routes are dev-only and must not be exposed to Greenhouse.

---

## API Architecture Diagram

```mermaid
flowchart TB
  subgraph clients [Clients]
    WEB[Next.js Pages]
    MOB[mobile/ Expo]
    EXT[Future: Greenhouse]
  end

  subgraph edge [Edge]
    PROXY[proxy.ts — session refresh only for API]
  end

  subgraph api [app/api — 462 routes]
    EMP[/employer/*]
    TRUST[/trust/*]
    VER[/verification/*]
    USER[/user/*]
    ADMIN[/admin/*]
  end

  subgraph lib [lib/]
    AUTH[lib/auth/*]
    ACTIONS[lib/actions/*]
    TRUST_LIB[lib/trust/*]
    SEARCH[lib/search/*]
  end

  subgraph db [Supabase]
    ADMIN_CLIENT[admin service role]
    PG[(Postgres)]
  end

  WEB --> PROXY --> api
  MOB --> api
  EXT -.->|future| api
  api --> AUTH
  api --> ACTIONS
  api --> TRUST_LIB
  api --> SEARCH
  api --> ADMIN_CLIENT --> PG
```

---

## Audit Findings

1. **No unified API versioning** — only `/api/v1/trust-score` is versioned
2. **No Greenhouse-specific routes** — integration requires new namespace (recommend `/api/integrations/greenhouse/*`)
3. **Employer routes are the primary integration surface** — 67 routes, most authenticated
4. **Public trust endpoint exists** — `/api/trust/public/[profileId]` could serve ATS custom fields
5. **Stripe webhook pattern** — best reference for inbound ATS webhook implementation
