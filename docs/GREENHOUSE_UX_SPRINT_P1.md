# Greenhouse Critical UX — Sprint P1 Report

**Mission:** Polish for Greenhouse product review — no new features, no workflow changes.  
**Date:** August 7, 2026

---

## Pages in scope

| Page | Route | Status |
|------|-------|--------|
| Employer Dashboard | `/employer/dashboard` | ✅ Polished |
| Employer Search | `/employer/search-users` | ✅ Polished |
| Candidate Profile (employer) | `/employer/candidates/[id]` | ✅ Header/actions polished |
| Candidate Detail | `/candidate/[id]` | ✅ Full Wv migration |
| Trust Card | `components/trust/TrustCard.tsx` | ✅ WvBadge + WvLoadingState |
| Verification Requests | `/requests`, `/verify/request` | ✅ Copy + Wv states |
| Employer Onboarding | `/employer/onboarding/start` | ✅ Loading state |
| Messages (employer) | `/employer/messages` | ✅ Full Wv migration |
| Messages (employee) | `/messages` | ✅ (prior sprint) |
| Notifications | `/notifications` | ✅ Full Wv migration |

---

## Files modified

### Employer portal
- `components/employer/EmployerDashboardClient.tsx`
- `components/employer/EmployerSearchClient.tsx`
- `components/employer/employer-messages.tsx`
- `components/employer/candidate-profile-viewer.tsx`
- `components/employer/CandidateCard.tsx`
- `app/employer/search-users/page.tsx`
- `app/employer/messages/page.tsx`
- `app/employer/candidates/[id]/page.tsx`
- `app/employer/onboarding/start/page.tsx`

### Employee / shared
- `app/(app)/candidate/[id]/CandidateProfileView.tsx`
- `app/(app)/notifications/NotificationsPanel.tsx`
- `app/(app)/requests/page.tsx`
- `app/(app)/verify/request/page.tsx`
- `app/(app)/verify/request/VerifyRequestClient.tsx`
- `components/trust/TrustCard.tsx`

---

## Components migrated

| Before | After |
|--------|-------|
| `ui/card`, `ui/button`, Heroicons (dashboard quick actions) | `WvCard`, `WvButton`, Lucide |
| Inline search empty/error states | `WvEmptyState`, `WvErrorState`, `WvLoadingState` |
| Light-theme candidate detail (`bg-white`, `text-slate-*`) | `WvContainer`, `WvCard`, `WvBadge`, `WvEmptyState` |
| Heroicons notifications | Lucide + `WvCard` list items |
| Legacy employer messages layout | `WvCard`, `WvInput`, `WvEmptyState`, `WvLoadingState` |
| Trust card inline badge spans | `WvBadge` |
| Trust card text loading | `WvLoadingState` |

---

## UX improvements

### Copy (what / next / why)

| Page | Improvement |
|------|-------------|
| Dashboard | Header explains command center purpose; quick actions label verification path |
| Search | Intro copy + empty state guides first search; results explain compare flow |
| Candidate detail | Section headers + empty states for jobs/references |
| Verification requests | Title clarifies accept/decline + profile accuracy |
| Verify request | Explains why verification matters for trust score |
| Employer messages | Empty state directs to search candidates |
| Notifications | Empty state explains what will appear + CTA to matches |

### States

- **Loading:** Dashboard workforce stats, search, messages, onboarding, trust card
- **Empty:** Search (pre-search + no results), messages, notifications, candidate jobs/refs
- **Error:** Search errors, candidate not found (employer route)

### Accessibility

- `aria-label` on search button, compare checkboxes, send message
- Focus rings on notification links and recent search chips
- Lucide icons marked `aria-hidden` where decorative

---

## Before/after screenshots

Screenshots must be captured locally after deploy:

```bash
npm run dev
```

| Screen | URL | Capture |
|--------|-----|---------|
| Employer dashboard | `/employer/dashboard` | Desktop 1440px + mobile 390px |
| Search (empty) | `/employer/search-users` | Before first search |
| Search (results) | `/employer/search-users` | After query |
| Candidate profile | `/employer/candidates/[id]` | Header + trust section |
| Candidate detail | `/candidate/[id]` | Full profile card |
| Trust card | Employee dashboard | Trust score widget |
| Requests | `/requests` | Incoming list |
| Verify request | `/verify/request` | Modal open |
| Onboarding | `/employer/onboarding/start` | Step 1 |
| Employer messages | `/employer/messages` | Empty + thread |
| Notifications | `/notifications` | List + empty |

Store under `docs/screenshots/greenhouse-p1/` for the review deck.

---

## Remaining issues

| Area | Issue | Priority |
|------|-------|----------|
| Candidate profile viewer | Inner panels still use legacy `Card` + analytics widgets | P2 |
| Dashboard | Feature-flagged widgets (workforce risk, rehire) retain mixed styles | P2 |
| EmploymentVerificationPanel | Not fully Wv on candidate page | P2 |
| VerificationRequestModal | Modal shell still legacy dialog styles | P2 |
| Employer onboarding wizard | Step bodies mostly Wv; progress bar could use Wv tokens | P3 |

---

## Regression risks

- **Employer messages thread grouping** — logic unchanged; only UI wrapper changed
- **Search disclaimer flow** — unchanged; error now uses `WvErrorState` (may show larger block)
- **Candidate profile viewer** — save/message handlers unchanged; button labels slightly different
- **Dashboard WvButton grid** — fourth “Upgrade” tile always visible (was conditional grid of 3–4)

---

## QA checklist

### Employer flows
- [ ] Dashboard loads stats without layout shift
- [ ] Quick actions navigate to profile, employees, candidates
- [ ] Search: empty → query → results → compare selection
- [ ] Search: legal disclaimer modal still works
- [ ] Candidate profile: save, message, trust graph link
- [ ] Candidate not found shows error state
- [ ] Messages: empty state → select thread → send
- [ ] Onboarding loads with spinner

### Employee flows
- [ ] Notifications: mark read, mark all read, empty state CTA
- [ ] Requests page header copy renders
- [ ] Verify request opens modal and closes to dashboard
- [ ] Candidate detail: locked overlay for free employer views
- [ ] Trust card on dashboard loads score

### Responsive
- [ ] Employer search grid stacks on mobile
- [ ] Messages single column on mobile
- [ ] Candidate detail readable at 390px width
- [ ] Dashboard quick actions stack on narrow screens

### Keyboard
- [ ] Tab through search filters and submit
- [ ] Enter sends employer message
- [ ] Notification links focusable with visible ring

---

## Success criteria

| Criterion | Met? |
|-----------|------|
| Scoped pages use Wv design system | ✅ Core surfaces |
| No new features / workflows | ✅ |
| Clear page purpose + next step copy | ✅ |
| Loading / empty / error states | ✅ Key paths |
| Heroicons removed from scoped pages | ✅ Mostly; inner panels remain |
| Enterprise SaaS polish in first 5 min | ⚠️ Validate with live Greenhouse walkthrough |

---

## Rollback

Revert commit or individual files listed above. No schema or API changes.
