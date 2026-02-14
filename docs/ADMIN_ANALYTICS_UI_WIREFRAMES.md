# Admin Analytics UI — Enterprise Internal Dashboard Wireframes

**Product design + frontend spec for internal control and intelligence.**  
Not a marketing dashboard. Audience: engineers, trust & safety, executives.

---

## 1. Global UI Rules

| Rule | Application |
|------|-------------|
| **Powerful, serious, deliberate** | Dense data OK. No playful copy. Clear hierarchy. Actions have consequences. |
| **Sandbox ≠ Production** | Sandbox: persistent yellow/amber theme, labels, banner. Production: red accent bar. Never ambiguous. |
| **Context before data** | Destructive or sensitive views show scope/filters and “what you’re looking at” before tables/feeds. |
| **Clarity > minimalism** | Prefer information density and scannability over empty space. Tooltips explain metrics. |
| **“What should I do next?”** | Every view has a clear primary action or takeaway (e.g. “Review 3 abuse signals”, “Compare funnel to prod”). |

---

## 2. Layout Structure

### 2.1 Global Admin Layout (existing, align to this)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STICKY TOP BAR                                                               │
│ 🔒 ADMIN MODE | ENV: PROD / SANDBOX | ROLE: ADMIN/SUPERADMIN | email@...     │
│ Production: bg-red-700. Sandbox view: bg-amber-600.                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Optional] SANDBOX MODE — NO PRODUCTION DATA (sticky sub-bar, amber)          │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT                                                  │
│ (persistent) │                                                                │
│              │  - Breadcrumb when nested (e.g. Analytics > Real-Time)        │
│ Dashboard    │  - View title + short description                             │
│ Users        │  - Filters bar (time, env, segment)                            │
│ Employers    │  - Content area                                               │
│ Reviews      │  - Empty / loading / error states                             │
│ Sandbox      │                                                                │
│ Analytics ▼  │                                                                │
│   Overview   │                                                                │
│   Real-Time  │                                                                │
│   Geography  │                                                                │
│   Funnels    │                                                                │
│   Heatmaps   │                                                                │
│   Journeys   │                                                                │
│   Abuse      │                                                                │
│   Sandbox    │                                                                │
│ Audit Logs   │                                                                │
│ System       │                                                                │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### 2.2 Analytics routes (recommended)

| Route | Purpose |
|-------|---------|
| `/admin/analytics` | Overview (default) |
| `/admin/analytics/real-time` | Live view |
| `/admin/analytics/geography` | Map + drilldown |
| `/admin/analytics/funnels` | Conversion funnels |
| `/admin/analytics/heatmaps` | Click/scroll (privacy-safe) |
| `/admin/analytics/journeys` | User/session investigation |
| `/admin/analytics/abuse` | Abuse & security |
| `/admin/analytics/sandbox` | Sandbox-only analytics (mirror of prod views) |

---

## 3. Screen-by-Screen Wireframes

### 3.1 Analytics Overview

**Purpose:** Executive + operational snapshot. Answer: “How is the product doing right now?”

**Layout (wire):**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Overview                                                         │
│ Internal control snapshot. All metrics are admin-only; sandbox isolated.     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All] [Sandbox] [Production]   [Last 24h ▼] [Refresh]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Active now  │ │ New users   │ │ Conversion  │ │ Abuse       │            │
│ │ (5 min)     │ │ 24h / 7d    │ │ rate        │ │ signals     │            │
│ │    N        │ │  N / N      │ │   X%        │ │   N         │            │
│ │ [→ Real-Time]│ │ (tooltip)  │ │ (tooltip)   │ │ [→ Abuse]   │            │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘            │
│ ┌─────────────┐ ┌─────────────┐                                              │
│ │ Sandbox     │ │ Error rate  │                                              │
│ │ activity %  │ │ (24h)       │                                              │
│ │   X%        │ │   X%        │                                              │
│ │ (tooltip)   │ │ [→ Errors]  │                                              │
│ └─────────────┘ └─────────────┘                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Page performance (top paths)          │ Visitor map (country counts)         │
│ Path            Views   Unique        │ Country        Count                  │
│ /dashboard       ...    ...           │ US             ...                   │
│ /careers         ...    ...           │ ...                                  │
│ [View all →]                          │ [→ Geography]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Widget behavior:**

- **Active now:** Distinct sessions with `last_seen_at` in last 5 min. Click → Real-Time.
- **New users (24h / 7d):** Counts from auth/signup or first-session logic. Tooltip: “First-time sessions (or signups) in window.”
- **Conversion rate:** Funnel completion (e.g. Landing→Signup→Dashboard). Tooltip: “% of sessions that reached final step.” Click → Funnels.
- **Abuse signals:** Count in last 24h. Click → Abuse view.
- **Sandbox activity %:** % of page views that are `is_sandbox`. Tooltip: “Share of traffic in sandbox.”
- **Error rate:** Error events / page views. Click → Error breakdown or Abuse if error-type signals.

**State:** `env`, `timeRange`. Fetch overview API on mount and when filters change. Loading: skeleton cards. Error: message + “Retry” and optional audit ref.

---

### 3.2 Real-Time View

**Purpose:** Live site awareness. Answer: “Who is on the site right now?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Real-Time                                                        │
│ Live visitors and activity. Data streams every few seconds.                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All] [Sandbox] [Production]   [Pause stream]                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐  ┌─────────────────────────────────┐ │
│ │ LIVE VISITORS (last 5 min)          │  │ SANDBOX vs PROD                 │ │
│ │         N                           │  │ Sandbox:  N                     │ │
│ │   (animated pulse when N > 0)      │  │ Prod:     N                     │ │
│ └─────────────────────────────────────┘  └─────────────────────────────────┘ │
│ ┌─ Live page view stream ─────────────────────────────────────────────────┐ │
│ │ Time     Path              Env      │                                    │
│ │ 14:32:01 /dashboard        prod     │  (sandbox rows: amber left border) │
│ │ 14:32:00 /careers          sandbox  │                                    │
│ │ ... (new rows at top, max ~50)      │                                    │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Live events feed (optional) ───────────────────────────────────────────┐ │
│ │ event_type         path        at     │                                    │
│ │ signup_complete    /signup     14:31  │                                    │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Visual:**

- Animated dot or pulse next to “LIVE VISITORS” when count > 0.
- Sandbox rows: left border or background tint (e.g. amber-50).
- Stream: newest first; optional “New” badge on latest 3 rows for a few seconds.

**State:** SSE connection (or polling), `env`. Reconnect on filter change. Show “Connecting…” then “Live” with last update time. On error: “Stream unavailable” + Retry.

---

### 3.3 Geography View

**Purpose:** Where users come from. Answer: “Which countries/regions drive traffic?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Geography                                                        │
│ Traffic by country, region, city. No raw IP; geo from headers.               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All] [Sandbox] [Production]   [Last 24h ▼] [Authenticated ▼] [Refresh]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Map (or table fallback) ────────────────────────────────────────────────┐ │
│ │  [World map heatmap: country fill by count]                              │ │
│ │  Click country → region list → click region → city list                  │ │
│ │  (If no map lib: "Table view" only)                                      │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Table view ─────────────────────────────────────────────────────────────┤ │
│ │ Country   Region    City (approx)   Sessions   Views                      │ │
│ │ US        CA        San Francisco   N         N                          │ │
│ │ ...                                                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Filters:** Time range, Sandbox/Prod, Authenticated vs Anonymous (if available). Empty state: “No geo data in selected window (e.g. local or missing headers).”

---

### 3.4 Funnels View

**Purpose:** Conversion intelligence. Answer: “Where do we lose people?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Funnels                                                           │
│ Conversion steps. Compare sandbox vs prod.                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All] [Sandbox] [Production]   [24h ▼] [Country ▼] [Device ▼] [Refresh]     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Funnel: Landing → Signup → Dashboard → Profile                               │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Step          Entered   Converted   Drop-off                             │ │
│ │ Landing       N         —           —                                   │ │
│ │ Signup        N         N           X%  ████████░░                       │ │
│ │ Dashboard     N         N           X%  ██████░░░░                       │ │
│ │ Profile       N         N           X%  ████░░░░░░                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ [Comparison] Sandbox vs Prod (side-by-side bars for same steps)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**UI:** Horizontal funnel bars (width or bar length = relative count). Drop-off % and optional bar per step. Comparison mode: two columns or overlaid bars (sandbox amber, prod blue/slate).

---

### 3.5 Heatmaps (Privacy-Safe)

**Purpose:** UX friction discovery. Answer: “Where do people click and how far do they scroll?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Heatmaps                                                         │
│ Aggregated click density and scroll depth. No session replay, no PII.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Path ▼] [Click density | Scroll depth]   [24h ▼] [Sandbox/Prod]             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Click density (grid overlay concept) ───────────────────────────────────┐ │
│ │  Page: /dashboard                                                         │ │
│ │  [Grid of cells; darker = more clicks. No coordinates that identify user.]│ │
│ │  Legend: Low → High                                                       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ Scroll depth ────────────────────────────────────────────────────────────┐ │
│ │  0%  25%  50%  75%  100%                                                  │ │
│ │  ██   ██   ██   █    █   (% of sessions that reached depth)              │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Note: "No keystrokes, no session replay, no PII. Sampling may apply."      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Explicitly not shown:** Session replay, keystrokes, any PII. Empty state: “Send click/scroll_depth events from the app to populate heatmaps.”

---

### 3.6 User Journey View

**Purpose:** Deep investigation. Answer: “What did this user/session do?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › User Journeys                                                    │
│ Inspect a session or user timeline. Use for support or abuse review.        │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search: session ID or user ID]   [Search]                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Context (after search):                                                      │
│ Session ID   First seen   Last seen   Country   Device   Auth?   Sandbox?   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Timeline                                                                    │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Time       Type        Detail                                           │ │
│ │ 14:30:01   Page view   /                                                 │ │
│ │ 14:30:15   Page view   /careers                                          │ │
│ │ 14:30:22   Event       signup_start                                      │ │
│ │ 14:31:00   Page view   /dashboard                                        │ │
│ │ 14:31:05   Error       error_client  (if any)                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Trust score at time of visit (if available): X.X                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**State:** Search input, selected session/user, timeline data. Loading: skeleton. Not found: “No session or user matching ID.” No PII in timeline (path, event_type, time only).

---

### 3.7 Abuse & Security View

**Purpose:** Platform protection. Answer: “What should we act on?”

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Analytics › Abuse & Security                                                  │
│ Signals from abuse detection. Act on high severity.                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ [All] [Sandbox] [Production]   [24h ▼] [Signal type ▼] [Refresh]            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Summary by type          │  Severity: 🔴 High  🟠 Medium  🟡 Low             │
│ rapid_refresh    N       │                                                    │
│ scraping         N       │                                                    │
│ multi_account    N       │                                                    │
│ vpn_abuse        N       │                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Signal list (sort by time or severity)                                        │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Time     Type            Severity   Session (hash)   Sandbox?   [Details] │ │
│ │ 14:32    rapid_refresh   2          abc...           No        ...       │ │
│ │ 14:30    scraping        3          def...           Yes       ...       │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ Empty: "No abuse signals in window. Signals are created by automated rules."│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Severity:** Visual indicator (e.g. dot or badge). High = act soon; Medium = review; Low = monitor. Details: expand or modal with metadata (no PII).

---

### 3.8 Sandbox Analytics View

**Purpose:** Safe testing and validation. Same structure as prod analytics, clearly non-prod.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Persistent] 🧪 SANDBOX ANALYTICS — All data below is sandbox-only.         │
├─────────────────────────────────────────────────────────────────────────────┤
│ Analytics › Sandbox (Overview)                                               │
│ Same widgets as main Overview but data filtered to is_sandbox = true.        │
│ Optional: [Compare with Production] → side-by-side or diff view.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ (Same structure as Overview / Real-Time / etc., with:)                       │
│ - Yellow/amber theme (cards, borders, or tint)                                │
│ - "Sandbox" label on every widget or section                                 │
│ - No way to accidentally show prod data in this route                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation:** Reuse same components as `/admin/analytics/*` with `env=sandbox` and a wrapper that forces sandbox styling and labels.

---

## 4. Component Hierarchy

```
AdminLayout (existing)
├── AdminGlobalBar (existing)
├── AdminSidebar (existing, extend with analytics sub-nav)
└── Page content
    └── AnalyticsLayout (optional wrapper for /admin/analytics/*)
        ├── AnalyticsFilters (env, time range, segment)
        ├── Breadcrumb
        └── View-specific content

Shared analytics components (suggested):
├── MetricCard (value, label, tooltip, onClick → deep link)
├── EnvTabs (All | Sandbox | Production)
├── TimeRangeSelect (24h, 7d, 30d)
├── DataTable (sortable, optional export)
├── LiveStreamPanel (SSE-driven list, sandbox row styling)
├── FunnelBars (steps, entered, converted, drop-off)
├── SeverityBadge (abuse)
├── EmptyState (message, action)
├── LoadingSkeleton (cards or rows)
└── ErrorState (message, retry, optional audit ref)
```

---

## 5. State Handling Notes

- **Env (All / Sandbox / Production):** URL query `?env=` or segment. Persist in sidebar or context so switching views keeps env when possible.
- **Time range:** Per-view or global; query param `?range=24h`. Default 24h for overview/funnels/abuse; 5 min for real-time.
- **Real-Time:** SSE or polling; store last payload, connection status, and “paused” flag. Cleanup on unmount (close EventSource / clear interval).
- **Geography drilldown:** Country → region → city in local state or URL; fetch on demand.
- **Journey search:** Single session/user ID; store result and timeline; clear on new search.
- **Heavy queries:** Use loading skeletons; consider “Export” as async job + notification if needed later.

---

## 6. Accessibility Considerations

- **Top bar:** Already has `role="banner"` and `aria-label="Admin mode active"`. Sandbox banner: `role="alert"` and `aria-live="polite"`.
- **Sidebar:** Nav with current page indicated (e.g. `aria-current="page"`). Analytics sub-items as a grouped nav.
- **Metric cards:** If clickable, use `<button>` or `<a>` with clear label (e.g. “View real-time”).
- **Tooltips:** Use `title` and/or a proper tooltip component with `aria-describedby`; ensure keyboard and screen reader accessible.
- **Tables:** `th` with scope, captions where helpful. Sortable headers: `aria-sort` and keyboard support.
- **Live stream:** `aria-live="polite"` for the stream region so new rows are announced without interrupting.
- **Severity:** Don’t rely on color only; pair with text (e.g. “High”) or icon.
- **Empty/error states:** Focus management (e.g. focus Retry button) and clear, concise copy.

---

## 7. Frontend Implementation Notes (React / Next.js)

- **Routes:** App Router: `app/admin/analytics/page.tsx` (overview), `app/admin/analytics/real-time/page.tsx`, etc. Shared layout in `app/admin/analytics/layout.tsx` (breadcrumb, optional AnalyticsFilters).
- **Data:** Use server components for initial load where possible; client for filters, SSE, and interactivity. Fetch from existing APIs: `/api/admin/analytics/overview`, `.../stream`, `.../funnels`, `.../abuse`, etc.
- **Sandbox styling:** CSS class or data attribute when `env === 'sandbox'` (e.g. `data-env="sandbox"`); apply amber border/bg in Tailwind.
- **Real-Time SSE:** Client component with `useEffect`: `new EventSource(url)`, parse `data:`, update state, cleanup on unmount and on env change.
- **Tooltips:** Use Radix Tooltip or similar; keep delay short for admin (e.g. 200ms).
- **Comparison (Sandbox vs Prod):** Two API calls (one with `env=sandbox`, one with `env=production`) or one “comparison” endpoint; render two columns or overlaid bars.
- **Audit:** All analytics views already trigger VIEW_ANALYTICS audit log; no extra client call. Error states can reference “See Audit Logs” for debugging.

---

## 8. Summary Checklist

- [ ] Sticky top bar: ADMIN MODE, ENV, ROLE, EMAIL (existing).
- [ ] Sidebar: Analytics section with sub-routes (Overview, Real-Time, Geography, Funnels, Heatmaps, Journeys, Abuse, Sandbox).
- [ ] Overview: 6 metric cards (active, new users, conversion, abuse count, sandbox %, error rate) + page performance + visitor map; each card clickable to deep view.
- [ ] Real-Time: Live count, sandbox vs prod, page view stream, optional events; animated indicator; sandbox row styling.
- [ ] Geography: Map or table; country → region → city; filters (time, env, auth).
- [ ] Funnels: Steps with entered/converted/drop-off; comparison mode sandbox vs prod.
- [ ] Heatmaps: Click density + scroll depth; privacy note; no replay/keystrokes/PII.
- [ ] Journeys: Search by session/user ID; timeline of page views + events; trust score if available.
- [ ] Abuse: Summary by type; list with severity; details without PII.
- [ ] Sandbox Analytics: Dedicated route(s) with sandbox-only data and yellow theme.
- [ ] Tooltips, empty states, loading states, error states with retry/audit ref.
- [ ] A11y: landmarks, aria-labels, keyboard, live regions, severity not by color only.

This document is the single source of truth for building the admin analytics UI. Implement screen by screen; reuse shared components and existing APIs.
