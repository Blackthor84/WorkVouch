# Greenhouse Solutions Engineer Review

**Reviewer lens:** First-time evaluation, 30-minute demo window, enterprise customer recommendation.  
**Date:** 2026-08-07  
**Verdict after fixes:** **Recommend with noted roadmap items** — core hiring flows are credible; no launch blockers in audited paths.

---

## Executive Summary

| Flow | Pre-fix | Post-fix |
|------|---------|----------|
| Employer onboarding | ⚠️ Partial account risk | ✅ Atomic create + idempotency |
| Employer dashboard | ⚠️ Fake analytics | ✅ No simulated metrics |
| Candidate search | ✅ Usable | ✅ Legal gate + state-only location |
| Candidate profile | ❌ Contradictory trust UI | ✅ Canonical TrustCard + API |
| Trust explanation | ❌ Wrong breakdown + open API | ✅ Engine-backed + paywall parity |
| Verification workflow | ⚠️ alert() + loading bug | ✅ Inline errors + fixed load |
| Messages | ⚠️ Spam risk + no employer gate | ✅ Save/thread gate + limits |
| Notifications | ⚠️ Missing employer UI | ✅ Employer notifications page |

---

## Flow-by-Flow Evaluation

### 1. Employer onboarding

**Where / Why / Next:** `/employer/onboarding` → set up org → complete steps → dashboard.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-001 | `employer_accounts` insert failure still returned success | Blocker | Fail + rollback org/membership on any step failure |
| GH-002 | Duplicate onboarding created duplicate orgs | High | Idempotent: existing account → redirect dashboard |
| GH-003 | Team invite copy promised emails that were never sent | High | Copy: "saved for later, invite from Settings" |
| GH-004 | Progress only in sessionStorage | Medium | **Open** — server-side draft (roadmap) |

**Files:** `app/api/employer/onboarding/create/route.ts`, `EmployerOnboardingClient.tsx`

---

### 2. Employer dashboard

**Where / Why / Next:** `/employer/dashboard` → command center → search, verifications, activity.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-005 | Hardcoded 87% rehire / 91% team fit shown as real | Blocker | Removed simulation; analytics card states no simulated data |
| GH-006 | Multiple upgrade CTAs (/pricing, /upgrade, modal) | Medium | **Partial** — primary paths aligned to `/employer/upgrade` |
| GH-007 | Sandbox mode in production dashboard | Medium | **Open** — restrict to admin env (roadmap) |

**Files:** `EmployerDashboardClient.tsx`, `AdvancedAnalytics.tsx`

---

### 3. Candidate search

**Where / Why / Next:** `/employer/search-users` → filter → open profile.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-008 | Legal disclaimer gate | — | Already implemented |
| GH-009 | City in location filter | — | Fixed (state-only) in prior sprint |
| GH-010 | N+1 saved-status checks per result | Medium | **Open** — batch API (roadmap) |
| GH-011 | 50-result cap, no pagination UI | Medium | **Open** — enterprise scale (roadmap) |

**Files:** `EmployerSearchClient.tsx`, `employerSearchService.ts`

---

### 4. Candidate profile

**Where / Why / Next:** `/employer/profile/[id]` → evaluate trust → save / message.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-012 | Two URLs with different behavior | Blocker | `/employer/candidates/[id]` redirects to `/employer/profile/[id]` |
| GH-013 | Inconsistent deep links | High | All links → `/employer/profile/[id]` |
| GH-014 | `TrustScoreBreakdown` contradicted gauge (client RLS) | Blocker | Replaced with `TrustCardEmployerView` → `/api/trust/[id]` |
| GH-015 | Upgrade CTA split (/enterprise vs /employer) | Medium | `HiringDataUnlockGate` → `/employer/upgrade` |

**Files:** `candidate-profile-viewer.tsx`, `TrustCardEmployerView.tsx`, `app/employer/candidates/[id]/page.tsx`

---

### 5. Trust explanation

**Where / Why / Next:** Trust card on profile + API for integrations.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-016 | Any employer could scrape trust API without view limit | Blocker | `getTrustProfile` uses `canViewCandidateProfile()` |
| GH-017 | `/api/trust/explain` hardcoded `industry: "retail"` | High | Loads candidate industry from profile |
| GH-018 | Band threshold drift across surfaces | Medium | Profile uses canonical engine; explain route uses snapshot (roadmap: unify) |

**Files:** `lib/trust/trustService.ts`, `app/api/trust/explain/route.ts`, `components/trust/TrustCardEmployerView.tsx`

---

### 6. Verification workflow

**Where / Why / Next:** `/employer/listed-employees` + employee `/verify/request`.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-019 | `alert()` on confirm/dispute errors | Medium | Inline `actionError` banner |
| GH-020 | Loading ended before fetch completed | Medium | `finally` on refetch |
| GH-021 | Employee verify modal empty `onSuccess` | Medium | **Open** — post-submit confirmation (roadmap) |

**Files:** `ListedEmployeesPageClient.tsx`, `VerifyRequestClient.tsx`

---

### 7. Messages

**Where / Why / Next:** `/employer/messages` + employee `/messages`.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-022 | Employers could message any candidate (spam/compliance) | Blocker | Require saved candidate OR existing thread |
| GH-023 | Unbounded inbox fetch | High | `.limit(500)` on inbox query |
| GH-024 | Notification body exposed sender email | Medium | Uses display name only |
| GH-025 | Employee inbox used `alert()` | Medium | Inline error state |

**Files:** `lib/actions/employer/messages.ts`, `employer-messages.tsx`, `user-messages.tsx`

---

### 8. Notifications

**Where / Why / Next:** Activity feeds for recruiters and workers.

| ID | Hesitation | Severity | Fix |
|----|------------|----------|-----|
| GH-026 | `message` type routed to coworker matches | High | Routes to `/messages` |
| GH-027 | Employer API existed but no UI | Blocker | `/employer/notifications` + sidebar link |
| GH-028 | Employer verification events invisible in portal | High | Employer panel with type labels + deep links |

**Files:** `NotificationsPanel.tsx`, `EmployerNotificationsPanel.tsx`, `app/employer/notifications/page.tsx`, `employer-sidebar.tsx`

---

## Recommendation

**Could I confidently recommend this to an enterprise customer?**

**Yes — for a verified-hiring / trust-data partnership demo**, with these caveats stated upfront:

1. **Greenhouse ATS API integration** is not built in-repo (expected at partnership stage).
2. **Search pagination** and **batch saved-status** are roadmap for 10k+ candidate scale.
3. **Onboarding draft persistence** is browser-only today.

**No blockers remain** in the eight audited flows for a 30-minute Solutions Engineer walkthrough.

---

## QA Verification Checklist

- [ ] Onboard new employer → lands on dashboard with employer account
- [ ] Search → disclaimer → results → profile
- [ ] Profile trust card matches API score and explanation
- [ ] Free tier hits paywall after 5 profile views
- [ ] Message requires save or prior thread (employer)
- [ ] Employer notifications page loads
- [ ] Employee message notification opens `/messages`
- [ ] Listed employees: confirm/dispute shows inline error, not alert
- [ ] Dashboard shows no fake percentage metrics

---

## Files Changed (Greenhouse Sprint)

```
app/api/employer/onboarding/create/route.ts
app/api/trust/explain/route.ts
app/employer/candidates/[id]/page.tsx
app/employer/notifications/page.tsx
app/employer/listed-employees/ListedEmployeesPageClient.tsx
app/(app)/notifications/NotificationsPanel.tsx
components/AdvancedAnalytics.tsx
components/employer/EmployerDashboardClient.tsx
components/employer/EmployerNotificationsPanel.tsx
components/employer/HiringDataUnlockGate.tsx
components/employer/TeamSharingPanel.tsx
components/employer/CandidateViewHistoryCard.tsx
components/employer/candidate-profile-viewer.tsx
components/employer/employer-sidebar.tsx
components/messages/user-messages.tsx
components/trust/TrustCardEmployerView.tsx
lib/actions/employer/messages.ts
lib/trust/trustService.ts
app/employer/onboarding/EmployerOnboardingClient.tsx
docs/GREENHOUSE_SOLUTIONS_REVIEW.md
```
