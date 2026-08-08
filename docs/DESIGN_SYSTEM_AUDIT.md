# WorkVouch Design System Audit

**Date:** August 7, 2026  
**Canonical reference:** Live Demo (`/demo`, `components/demo-center/`, `components/wv/`)  
**Goal:** One design system — no page should look older than another.

---

## Executive Summary

WorkVouch has **~299 route pages** and **200+ shared components**. A unified dark-glass design language exists in `components/wv/` and the Live Demo, but **most production surfaces still use legacy tokens** (`text-grey-*`, `bg-white`, Heroicons, inline card styles).

| Metric | Count | Status |
|--------|-------|--------|
| Pages using `WvContainer` / `WvPageHeader` | ~35 | ⚠️ 12% |
| Files importing `components/ui/button` | ~140 | Legacy bridge |
| Files importing `components/ui/card` | ~130 | Legacy bridge |
| Files using `@heroicons/react` | ~130 | ❌ Should be Lucide |
| Files using `lucide-react` | ~35 | ✅ Canonical |
| Files with `text-grey-*` / `text-slate-*` | ~200+ | ❌ Use `text-wv-*` |
| Page files with light surfaces (`bg-white`, `bg-gray-50`) | ~70 | ❌ Dark-first only |

**This sprint:** Extended the Wv design system with state/table primitives, aligned legacy `ui/*` shims, and migrated high-traffic employee routes.

---

## Canonical Design System (`components/wv/`)

### Layout
| Component | Purpose |
|-----------|---------|
| `WvShell` | Full-page dark canvas + ambient gradient |
| `WvContainer` | Max-width wrapper (`narrow` / `default` / `wide`) |
| `WvPageHeader` | Eyebrow + title + description + action slot |

### Primitives
| Component | Purpose |
|-----------|---------|
| `WvCard` | Glass card — `rounded-2xl`, `border-wv-border`, `bg-wv-surface` |
| `WvButton` | CTA — gradient primary, glass secondary, ghost, outline, danger |
| `WvInput` | Form input — `rounded-xl`, focus ring brand blue |
| `WvBadge` | Status chips — default, success, warning, danger, brand |
| `WvStatCard` | Metric display |
| `WvTrustScore` | Trust ring visualization |

### States (NEW)
| Component | Purpose |
|-----------|---------|
| `WvEmptyState` | Dashed border, icon, title, description, action |
| `WvLoadingState` | Lucide spinner + label |
| `WvSkeleton` | Pulse placeholder blocks |
| `WvErrorState` | Red alert surface + optional retry |
| `WvSuccessState` | Green confirmation surface |

### Data (NEW)
| Component | Purpose |
|-----------|---------|
| `WvTable` | Dark glass table with hover rows |

### Tokens (`wvTokens`)
| Token | Value |
|-------|-------|
| Card radius | `rounded-2xl` |
| Control radius | `rounded-xl` |
| Badge radius | `rounded-full` |
| Page padding | `py-8`, `px-4 sm:px-6 lg:px-8` |
| Section gap | `gap-8` |
| Card shadow | `shadow-xl shadow-black/20` |
| Transition | `duration-200` (controls), `duration-300` (cards) |
| Motion | `pageTransition`, `staggerItem` from `motion.ts` |

### Colors (CSS variables via Tailwind)
- Background: `bg-wv-bg` (`#0a0a0f`)
- Surface: `bg-wv-surface`, `bg-wv-surface-hover`
- Border: `border-wv-border`, `border-wv-border-hover`
- Text: `text-wv-foreground`, `text-wv-muted`, `text-wv-subtle`
- Brand: `wv-brand-blue`, `wv-brand-green`, `wv-brand-violet`

---

## Inconsistency Audit by Category

### 1. Spacing & Layout
| Issue | Examples | Fix |
|-------|----------|-----|
| Mixed max-widths | `max-w-7xl`, `max-w-4xl`, `container` | Use `WvContainer` sizes |
| Inconsistent page padding | `py-8`, `py-12`, `py-16`, `p-4 sm:p-6 md:p-8` | Standardize `WvContainer className="py-8"` |
| Ad-hoc section gaps | `space-y-12`, `gap-6`, `mb-8` mixed | Use `gap-8` / `space-y-6` |

**Migrated:** `/my-jobs`, `/messages`, `/notifications`, `/upload-resume`

### 2. Typography
| Legacy | Canonical |
|--------|-----------|
| `text-grey-dark dark:text-gray-200` | `text-wv-foreground` |
| `text-grey-medium dark:text-gray-400` | `text-wv-muted` |
| `text-slate-900`, `text-slate-500` | `text-wv-foreground` / `text-wv-muted` |
| Inline `text-3xl font-bold` headers | `WvPageHeader` |

**Migrated:** Dashboard caption, messages/notifications headers

### 3. Buttons
| Source | Status |
|--------|--------|
| `WvButton` | ✅ Canonical |
| `components/ui/button` | Aligned styles — prefer Wv for new code |
| Inline `rounded-lg bg-blue-600` | ❌ ~50+ occurrences |
| Demo `DemoButton` | Duplicate of WvButton — keep for demo isolation |

### 4. Cards
| Source | Status |
|--------|--------|
| `WvCard` | ✅ Canonical |
| `components/ui/card` | Aligned to glass — missing motion/padding props |
| Inline `rounded-xl border border-slate-200 bg-white` | ❌ Notifications skeleton (fixed) |
| `GlassCard` in demo-center | Same as WvCard — demo-only |

### 5. Input Fields
| Source | Issue |
|--------|-------|
| `WvInput` | ✅ Canonical |
| `components/ui/input` | **Was light-theme** — **FIXED** to Wv tokens |
| Inline inputs in onboarding forms | Mixed — migrate incrementally |

### 6. Icons
| Library | Files | Rule |
|---------|-------|------|
| Heroicons | ~130 | ❌ Replace with Lucide |
| Lucide | ~35 | ✅ Canonical |

**Worst offenders:** `job-list.tsx`, `DashboardActions.tsx`, onboarding clients, employer panels

### 7. Tables
| Pattern | Status |
|---------|--------|
| Raw `<table className="min-w-full divide-y divide-gray-200">` | ❌ Admin tables |
| `WvTable` | ✅ NEW — use everywhere |

### 8. Empty States
| Pattern | Status |
|---------|--------|
| Inline dashed boxes | ❌ Scattered |
| `workvouch/EmptyState` | Re-exports `WvEmptyState` ✅ |
| `WvEmptyState` | ✅ NEW canonical |

### 9. Loading States
| Pattern | Status |
|---------|--------|
| `animate-pulse bg-slate-200` (light) | ❌ Was in notifications |
| `WvSkeleton` / `WvLoadingState` | ✅ NEW canonical |
| Custom skeletons per feature | Consolidate to Wv |

### 10. Error States
| Pattern | Status |
|---------|--------|
| Inline red text in Card | ❌ my-jobs (fixed) |
| `app/error.tsx` inline button | **FIXED** → `WvErrorState` |
| `WvErrorState` | ✅ NEW |

### 11. Success States
| Pattern | Status |
|---------|--------|
| Inline green banners | Scattered |
| `WvSuccessState` | ✅ NEW |

### 12. Badges
| Source | Status |
|--------|--------|
| `WvBadge` | ✅ Canonical |
| `components/ui/badge` | **FIXED** — delegates to WvBadge |
| Inline `rounded-full bg-green-100` | ❌ Employer/trust components |

### 13. Colors (Anti-patterns)
| Pattern | Occurrences | Action |
|---------|-------------|--------|
| `bg-gray-50`, `bg-white` pages | ~70 page files | Migrate to `bg-wv-bg` |
| `dark:bg-[#0D1117]` hardcoded | ~15 employee pages | Use `bg-wv-bg` |
| `bg-grey-background` | Legacy marketing | Replace with `bg-wv-surface` |

### 14–17. Radius, Shadows, Transitions, Animations
| Element | Canonical |
|---------|-----------|
| Cards | `rounded-2xl` |
| Buttons/inputs | `rounded-xl` |
| Card shadow | `shadow-xl shadow-black/20` |
| Hover | `hover:-translate-y-0.5` on interactive cards |
| Page enter | `pageTransition` / Framer fade-up |
| Lists | `staggerItem` in grids |

---

## Page Tier Audit

### Tier A — Wv-aligned (reference)
- `/demo`, `/demo-center/*`
- `/employer/dashboard`, `/employer/search-users`, `/employer/onboarding/start`
- `/requests`, `/profile`
- **NEW:** `/my-jobs`, `/messages`, `/notifications`, `/upload-resume`

### Tier B — Partial Wv (layout ok, components legacy)
- `/dashboard` — Wv bg, legacy dashboard components
- `/coworker-matches` — mixed Heroicons + wv skeletons
- Employer portal pages (billing, settings, candidates)

### Tier C — Legacy light/dark split (priority migration)
- `/notifications` panel internals
- Onboarding step clients (`*-client.tsx`)
- Admin dashboards (`AdminAnalyticsDashboard`, etc.)
- Public marketing (`/careers/*`, `/passport/*`, `/u/*`)
- `/jobs/new` (32 light-theme class usages)

### Tier D — Admin/playground (intentionally dense; lower priority)
- `/admin/playground/*`, `/admin/sandbox-v2/*`
- Simulation lab UIs

---

## Implementation (This Sprint)

### Created
- `components/wv/tokens.ts`
- `components/wv/WvEmptyState.tsx`
- `components/wv/WvLoadingState.tsx`
- `components/wv/WvErrorState.tsx`
- `components/wv/WvSuccessState.tsx`
- `components/wv/WvTable.tsx`

### Aligned (legacy bridge)
- `components/ui/input.tsx` → Wv dark glass styles
- `components/ui/badge.tsx` → delegates to `WvBadge`
- `components/ui/label.tsx` → `text-wv-muted`
- `components/workvouch/EmptyState.tsx` → re-exports `WvEmptyState`

### Pages migrated
- `app/(app)/my-jobs/page.tsx`
- `app/(app)/messages/page.tsx`
- `app/(app)/notifications/page.tsx`
- `app/(app)/upload-resume/page.tsx`
- `app/(app)/dashboard/page.tsx` (typography token)
- `app/error.tsx`

---

## Remaining Work (Phased)

### Phase 2 — Employee app components (~40 files)
- `DashboardStatsGrid`, `DashboardMatchesSection`, `DashboardOnboardingCard`
- `job-list.tsx`, `CoworkerMatchesClient`, onboarding `*-client.tsx`
- Replace Heroicons → Lucide in employee surfaces

### Phase 3 — Employer portal (~30 files)
- `EmployerDashboardClient` panels, candidate viewer, workforce risk
- Consolidate duplicate stat cards → `WvStatCard`

### Phase 4 — Public/marketing (~50 pages)
- Careers pages share one template with `WvShell`
- Passport/public profile pages

### Phase 5 — Admin (~80 pages)
- `WvTable` for all admin data tables
- Retire light chart/tooltip themes in analytics

### Phase 6 — Delete duplicates
- `DemoButton` / `GlassCard` — keep demo-only, document parity with Wv
- Remove unused `StatCard`, `ConfidenceScore` visual duplicates after migration

---

## QA Checklist

| Check | Route |
|-------|-------|
| Dark bg, no white flash | `/my-jobs`, `/messages`, `/notifications` |
| Consistent page header | All migrated pages |
| Empty state styling | `/my-jobs` (no jobs) |
| Error state | `/my-jobs` (API error), global error boundary |
| Input dark styling | Any form using `ui/input` |
| Badge colors | Components using `ui/badge` |
| Mobile padding | `WvContainer` responsive px |
| No Heroicons on migrated pages | `/my-jobs` (Lucide Briefcase) |

---

## Rollback

All changes are additive or page-level. Revert individual page files to restore prior layouts. Legacy `ui/*` components remain importable.

---

## Success Criteria

| Criterion | Status |
|-----------|--------|
| ONE component library documented | ✅ `components/wv/` + this doc |
| ONE empty/loading/error/success pattern | ✅ Wv state components |
| ONE table pattern | ✅ WvTable |
| Legacy ui aligned to tokens | ✅ input, badge, label |
| High-traffic pages consistent | ⚠️ 6 pages migrated; ~290 remain |
| No page looks older than demo | 🔄 In progress — Phase 2+ |
