# 05 — Dashboard Map

> **Sprint:** Greenhouse Integration — Architecture Audit (Read-Only)  
> **Last updated:** 2026-08-07

---

## Layout Shells

| Role | Layout | Nav component |
|------|--------|---------------|
| **Worker** | `app/(app)/layout.tsx` → `WorkVouchLayoutClient` | `components/workvouch/WorkVouchSidebar.tsx` |
| **Employer** | `app/employer/layout.tsx` → `EmployerPortalLayout` | `components/employer/employer-sidebar.tsx` |
| **Admin** | `app/admin/layout.tsx` → `AdminClientLayout` | `components/admin/AdminSidebar.tsx` |
| **Enterprise** | `app/enterprise/layout.tsx` → `EnterprisePortalLayout` | Header nav + `EnterpriseOrgSidebarNav` |

Access control: `proxy.ts` + `lib/proxy/routeAccess.ts` + `lib/auth/roleRouting.ts`

---

## Worker (Employee) Dashboard

### Sidebar Navigation

| Nav item | Route |
|----------|-------|
| Dashboard | `/dashboard` |
| Coworker matches | `/coworker-matches` |
| Verification requests | `/requests` |
| Profile | `/profile` |
| Settings | `/settings` |

Navbar: notification bell → `/notifications`, profile menu

### Primary Pages

| Route | Purpose | Components | Data sources | Actions |
|-------|---------|------------|--------------|---------|
| `/dashboard` | Employee home — trust hero, stats, matches | `DashboardReputationHero`, `DashboardStatsGrid`, `DashboardMatchesSection`, `OnboardingChecklist` | `getDashboardHomeData()` — Supabase + admin aggregates | Share slug, onboarding CTAs |
| `/coworker-matches` | Coworker discovery, vouch requests | `DashboardClient`, `CoworkerMatchCard`, `TrustScoreHeroCard` | `getEmploymentMatchesForUser`, Supabase realtime on `reference_requests` | Confirm/deny match, request vouch, submit review |
| `/requests` | Verification + vouch request inbox | `RequestsPageClient` | Supabase `reference_requests`; `respondToRequest` action | Accept/reject requests |
| `/profile` | Profile, work history, trust, vouches | `JobVerificationSection`, `WvTrustScore` | `profiles`, `jobs`; trust/reference actions | Edit profile, job verification |
| `/my-jobs` | Work history CRUD | `JobList`, `AddJobButton` | Supabase `jobs` | Add/edit jobs |
| `/settings` | Account, email, privacy | `UserSettings`, `PublicPassportSettings` | Supabase auth + profile | Change email, privacy toggles |
| `/notifications` | Notification inbox | `NotificationsPanel` | `getUserNotifications()`, `GET /api/notifications` | Mark read |
| `/messages` | Worker inbox | `UserMessages` | `lib/actions/messages.ts` → `messages` table | Send/reply |
| `/verify/request` | Employment verification flow | `VerifyRequestClient` | Verification APIs | Submit verification |
| `/references/request` | Request vouch from connections | Request form | `getUserConnections()` | Send request |
| `/upload-resume` | Resume upload/parse | Resume UI | `/api/resume/parse`, `/api/resume/upload` | Upload & parse |
| `/onboarding/**` | Industry guided setup | Various | `/api/onboarding/*` | Complete vouch loop |

### Legacy Redirects

| Route | Redirects to |
|-------|--------------|
| `/dashboard/worker`, `/dashboard/employee` | `/dashboard` |
| `/dashboard/jobs` | `/profile` |
| `/dashboard/connections` | `/coworker-matches` |
| `/dashboard/settings` | `/settings` |

---

## Employer Dashboard

### Sidebar Navigation

| Nav item | Route |
|----------|-------|
| Dashboard | `/employer/dashboard` |
| Search | `/employer/search-users` |
| Verified candidates | `/employer/verified-workers` |
| Compare | `/employer/compare` |
| Claim company | `/employer/claim` |
| Directory | `/employer/directory` |
| Saved | `/employer/candidates` |
| Messages | `/employer/messages` |
| Notifications | `/employer/notifications` |
| Billing | `/employer/billing` |
| Settings | `/employer/settings` |

### Primary Pages

| Route | Purpose | Components | Data sources | Actions |
|-------|---------|------------|--------------|---------|
| `/employer/dashboard` | Employer home — analytics, risk, rehire | `EmployerDashboardClient`, `EmployerAnalytics`, `WorkforceRiskDashboard`, `RehireRegistrySection` | `getEmployerDashboardData()`, `/api/employer/*` | Export, upgrade, view candidates |
| `/employer/search-users` | **Primary candidate search** | `EmployerSearchClient` | `GET /api/employer/search-users`; legal acceptance gate | Search, open profile, purchase report |
| `/employer/candidates/[id]` | Candidate detail | `candidate-profile-viewer`, `TrustCardEmployerView` | Employer candidate APIs, trust graph | Message, request verification, file dispute |
| `/employer/verified-workers` | Verified candidate directory | `VerifiedWorkersDashboardClient` | `/api/employer/verified-workers` | View verified candidates |
| `/employer/compare` | Side-by-side comparison | `CompareViewClient` | Query params + search data | Compare 2–4 profiles |
| `/employer/candidates` | Saved candidates | `SavedCandidates` | `lib/actions/employer/saved-candidates.ts` | Open profile, message |
| `/employer/messages` | Employer inbox | `EmployerMessages` | `lib/actions/employer/messages.ts` | Send/reply |
| `/employer/notifications` | Employer notifications | `EmployerNotificationsPanel` | `/api/employer/notifications` | Mark read |
| `/employer/billing` | Subscription & invoices | `EmployerBilling` | Stripe portal/checkout | Manage subscription |
| `/employer/settings` | Company profile | `CompanyProfileSettings` | Supabase employer tables | Update company |
| `/employer/reports/[candidateId]` | Purchased report | `CandidateReportView` | `getCandidateReport()` | View report |
| `/employer/trust-graph/[candidateId]` | Trust network viz | Trust graph UI | `GET /api/trust/graph/[candidateId]` | Explore network |
| `/employer/onboarding/start` | Employer onboarding | Onboarding wizard | `/api/employer/onboarding/create` | Complete setup |
| `/employer/job-posts` | Job postings | Job posts UI | `job_postings` table | CRUD jobs |
| `/employer/listed-employees` | Listed employees | Listed employees UI | `/api/employer/listed-employees` | Manage listings |

### Greenhouse Integration Touchpoints (Employer)

| Page | Why relevant |
|------|--------------|
| `/employer/settings` | ATS connection config (future) |
| `/employer/search-users` | Candidate lookup — map Greenhouse applicant → WorkVouch profile |
| `/employer/candidates/[id]` | Attach trust score + verification to ATS candidate record |
| `/employer/candidates` | Sync saved/shortlisted candidates |
| `/employer/notifications` | Push verification events to ATS activity feed |

---

## Admin Dashboard

**Layout:** Requires `admin_users` row; ~92 pages total.

### Primary Sidebar (Control Center — super admin)

| Route | Purpose | Components | Data |
|-------|---------|------------|------|
| `/admin` | Platform overview | `ControlCenterDashboard`, `AdminOverviewClient` | `/api/admin/dashboard/overview` |
| `/admin/users` | User management | `AdminUsersTable` | `/api/admin/users` |
| `/admin/trust` | Trust system tools | `TrustCenterClient` | Trust admin APIs |
| `/admin/reviews` | Review moderation | `ReviewsModerationClient` | Peer review APIs |
| `/admin/matches` | Coworker match monitor | `MatchesMonitorClient` | Match admin APIs |

### Production Nav

| Route | Purpose |
|-------|---------|
| `/admin/signups` | New signups |
| `/admin/organizations` | Employer orgs |
| `/admin/claim-requests` | Company claim queue |
| `/admin/employer-usage` | Usage/billing |
| `/admin/flagged-content` | Content moderation |
| `/admin/trust-scores` | Trust bands |
| `/admin/analytics/*` | Analytics hub (overview, real-time, geography, funnels, heatmaps, journeys, abuse) |
| `/admin/alerts` | Admin alerts |
| `/admin/incidents` | Incident tracking |
| `/admin/audit-logs` | Audit trail |
| `/admin/financials` | Revenue (gated) |
| `/admin/system-health` | System integrity |
| `/admin/verifications` | Verification queue |

### Extended (not in primary sidebar)

Sandbox v2, simulation lab, intelligence dashboards, investor demos, ads system, impersonation, fraud workflow, enterprise load simulation.

> **Admin surfaces must not be modified for Greenhouse integration.**

---

## Enterprise Dashboard

### Top-Level (no org sidebar)

| Route | Purpose | Components | Data |
|-------|---------|------------|------|
| `/enterprise` | Entry landing | `EnterprisePortalLayout` | Static |
| `/enterprise/dashboard` | Hiring intelligence | `HiringIntelligenceDashboardClient` | `/api/employer/hiring-intelligence/summary` |
| `/enterprise/team-risk` | Team risk view | `TeamRiskClient` | Enterprise risk APIs |
| `/enterprise/upgrade` | Enterprise upgrade | Upgrade UI | Stripe/enterprise billing |
| `/enterprise/playground` | Hiring insights lab | Playground UI | Simulation APIs |

Header nav: Dashboard, Candidates (`/employer/candidates`), Risk, Upgrade

### Org-Scoped — `/enterprise/[orgId]/*`

**Auth:** `requireEnterpriseOwner(orgId)`  
**Sidebar:** Overview, Locations, Employees, Resume Imports, Peer References, Analytics, Billing, Admin Controls

| Route | Purpose | Data |
|-------|---------|------|
| `/enterprise/[orgId]/overview` | Org KPIs | `organizations`, `workforce_employees`, `locations` |
| `/enterprise/[orgId]/locations` | Location management | `locations` (country/state only) |
| `/enterprise/[orgId]/employees` | Workforce roster | `workforce_employees` |
| `/enterprise/[orgId]/resume-imports` | Bulk resume imports | Workforce import tables |
| `/enterprise/[orgId]/peer-references` | Peer reference management | `workforce_peer_references` |
| `/enterprise/[orgId]/billing` | Org billing | Stripe/org billing |
| `/enterprise/[orgId]/admin-controls` | Org admin settings | Org config |

---

## Navigation Flow Diagram

```mermaid
flowchart TB
  subgraph worker [Worker Zone]
    WD[/dashboard]
    CM[/coworker-matches]
    REQ[/requests]
    PROF[/profile]
    MJ[/my-jobs]
    SET[/settings]
  end

  subgraph employer [Employer Zone]
    ED[/employer/dashboard]
    ES[/employer/search-users]
    EC[/employer/candidates/id]
    EM[/employer/messages]
    EB[/employer/billing]
    ESET[/employer/settings]
  end

  subgraph admin [Admin Zone]
    AD[/admin]
    AU[/admin/users]
    AV[/admin/verifications]
  end

  WD --> CM
  WD --> REQ
  PROF --> MJ
  ED --> ES
  ES --> EC
  EC --> EM
```

---

## Data Source Patterns

| Pattern | Used by | Files |
|---------|---------|-------|
| Server Component + Supabase | Worker layouts, profile | `lib/supabase/server.ts` |
| Server actions | Dashboard data, notifications | `lib/actions/*` |
| Client fetch to API | Employer dashboard, search | `app/api/employer/*` |
| Supabase realtime | Coworker matches, requests | `lib/supabase/browser.ts` |
| Admin service role | All API routes | `lib/supabase-admin.ts` |

---

## Observations

1. **Worker dashboard is multi-page** — canonical home is `/dashboard`; matches/requests/profile are peer surfaces.
2. **Employer search canonical URL** is `/employer/search-users` (legacy `/employer/search` redirects).
3. **Admin has 92 pages** — primary nav covers ~25; rest are labs/sandbox.
4. **Enterprise has two modes** — hiring intelligence vs org workforce management.
5. **Greenhouse integration should target employer zone first** — highest recruiter workflow density.
