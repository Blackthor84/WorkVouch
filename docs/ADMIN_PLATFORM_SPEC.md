# Internal Admin + Superadmin Platform — Specification

**Enterprise, security-critical, auditable control infrastructure.**  
Quality bar: Stripe, Airbnb, LinkedIn, Meta, Google internal tooling.

This is **not** an MVP. This is **not** cosmetic. This is **internal, admin-only** infrastructure.  
When in doubt: **security, privacy, and operational control** over convenience.

---

## 1. Non-Negotiable Rules

| # | Rule | Implementation |
|---|------|----------------|
| 1 | Admin power must be **real** and **backend-enforced** | All admin APIs use `requireAdminForApi()` or `requireSuperAdminForApi()`; RLS/service role. No UI-only checks. |
| 2 | Superadmin strictly more powerful than admin | Only superadmin: promote/demote admins, silence CRITICAL alerts, system settings. See `lib/roles.ts` and promote/demote routes. |
| 3 | Sandbox **full parity** with production | Same APIs, same schema, same UI. Filter by `is_sandbox`. Sandbox Analytics route mirrors prod views. |
| 4 | Sandbox data **never** affects production | Every mutation and query isolates by `is_sandbox`. No shared writes. |
| 5 | **Every** admin action must be auditable | All mutations write to `admin_audit_logs` before returning success. |
| 6 | No admin action may succeed without an audit log | `writeAdminAuditLog` / `insertAdminAuditLog` throws on failure; caller must fail the action (rollback/500). |
| 7 | Analytics internal and admin-only | All analytics tables RLS service-role only; all analytics APIs require admin and log VIEW_ANALYTICS. |
| 8 | Alerts actionable and escalatable | Severity (INFO/WARNING/CRITICAL), recommended action, escalation, superadmin to silence CRITICAL. |
| 9 | System **fail closed** (deny by default) | 403 when role insufficient; no silent grant. |
| 10 | Privacy compliance (GDPR/CCPA) | IP hashed at capture; DNT respected; no PII in analytics metadata. |
| 11 | **No silent failures** | Audit write failure → action fails. Capture write failure → 500. Alert dispatch errors logged to `admin_alert_deliveries`. |

---

## 2. Role & Identity Model (Source of Truth)

- **Auth:** Supabase Auth. Session: Next.js (Supabase `getUser()`).
- **Roles live ONLY in:** `auth.users.raw_app_meta_data.role` (app_metadata.role in session).
- **Allowed values:** `"user"` | `"admin"` | `"superadmin"`.
- **Fallback:** `profiles.role` used when app_metadata.role not set (see `getAdminContext`).

**Rules:**

- Admins **cannot** promote/demote admins. Only superadmins can.
- Superadmins **cannot** demote themselves (enforced in `app/api/admin/users/[id]/demote/route.ts`).
- No UI-only role enforcement; **backend checks mandatory everywhere**.

**Implementation:**

- `lib/admin/getAdminContext.ts` — single source of truth for admin context (role from auth then profile).
- `lib/auth/admin-role-guards.ts` — `getRoleFromSession`, `requireAdmin(session)`, `requireSuperAdmin(session)` (return 403 Response or null).
- `lib/auth/normalizeRole.ts` — canonical `"admin"` | `"super_admin"`.
- `lib/roles.ts` — `canModifyUser`, `canAssignRole` (superadmin cannot demote self via canAssignRole(isSelf)).

---

## 3. Global Role Guards (Mandatory)

**For API routes (return 403, never redirect):**

- `requireAdminForApi()` → returns `AdminSession | null`. If null, return `adminForbiddenResponse()` (403).
- `requireSuperAdminForApi()` → returns `AdminSession | null`. If null, return 403.

**For session-based guards (return 403 Response or null):**

- `requireAdmin(session)` — `lib/auth/admin-role-guards.ts`. Returns `NextResponse.json({ error: "Forbidden" }, { status: 403 })` or null.
- `requireSuperAdmin(session)` — same file. Returns 403 or null.

**Usage:** Use in **all** admin APIs, server actions, and analytics endpoints. Never throw uncaught; return 403.

**Implementation:**

- `lib/admin/requireAdmin.ts` — `requireAdmin()`, `requireSuperAdmin()`, `requireAdminForApi()`, `requireSuperAdminForApi()`.
- `lib/admin/getAdminContext.ts` — `adminForbiddenResponse()`.
- `lib/auth/admin-role-guards.ts` — `requireAdmin(session)`, `requireSuperAdmin(session)`.

---

## 4. Database Foundation

### 4.1 Admin Audit Logs (Immutable)

**Table:** `public.admin_audit_logs`

**Columns:** id, admin_user_id, admin_email, admin_role, action_type, target_type, target_id, before_state, after_state, reason (NOT NULL), is_sandbox (NOT NULL DEFAULT false), ip_address, user_agent, created_at.

**Rule:** If an audit log cannot be written, the admin action **must** fail.

**Implementation:**

- Migration: `supabase/migrations/20250230200000_admin_audit_logs_enterprise_schema.sql`
- REVOKE UPDATE, DELETE on `admin_audit_logs`.
- Write path: `lib/admin/audit-enterprise.ts` (`writeAdminAuditLog`) — **throws** on insert failure.

### 4.2 Internal Analytics Tables

- **site_sessions** — session_token, user_id, user_role, ip_hash, user_agent, device_type, os, browser, country, region, city, timezone, asn, isp, is_vpn, is_authenticated, is_sandbox, started_at, last_seen_at.
- **site_page_views** — session_id (FK), user_id, path, referrer, duration_ms, is_sandbox, created_at.
- **site_events** — session_id (FK), user_id, event_type, event_metadata, is_sandbox, created_at.
- **abuse_signals** — session_id, signal_type, severity, metadata, is_sandbox, created_at.

**Implementation:** `supabase/migrations/20250230200002_internal_analytics_site_visits_events.sql`, `20250230200003_analytics_enterprise_sessions_abuse.sql`. RLS: service role only.

---

## 5. Sandbox System (Full Parity)

- Sandbox is **not** a mock; it mirrors production behavior exactly.
- Every admin mutation must include `is_sandbox` (from `getAdminSandboxModeFromCookies()` or context).
- Queries must isolate sandbox vs prod (`WHERE is_sandbox = $1` or filter param).
- Missing sandbox flag on mutable actions → **fail action** (enforced in audit payload and business logic).

**Sandbox supports:** User suspension/reinstate, employer suspension, trust score manipulation, review moderation, feature flags, abuse simulation, analytics, alerts. Same APIs; env filter.

**Implementation:**

- `lib/sandbox/sandboxContext.ts` — `getAdminSandboxModeFromCookies()`.
- All audit writes include `is_sandbox`.
- Analytics and alerts tables have `is_sandbox`; all APIs filter by env.

---

## 6. Admin Action Enforcement Pattern

**Every admin action MUST:**

1. Call `requireAdmin()` / `requireSuperAdmin()` (or ForApi variant) → 403 if not allowed.
2. Determine sandbox vs prod (`getAdminSandboxModeFromCookies()`).
3. Load **before** state (for audit).
4. Perform mutation (sandbox-isolated where applicable).
5. **Write audit log** (before_state, after_state, reason, is_sandbox).
6. Return success.

**If step 5 fails:** Rollback / return 500. Audit write **throws** in `writeAdminAuditLog`.

---

## 7. Admin API Routes (Required)

| Area | Routes | Guard | Audit |
|------|--------|-------|-------|
| Users | List, suspend, disable, reinstate, promote, demote | Admin or Superadmin (promote/demote: Superadmin only) | Yes |
| Employers | Suspend, reinstate, force verification | Admin | Yes |
| Reviews & Trust | Remove/restore reviews, adjust trust, lock trust | Admin | Yes |
| System | Maintenance, read-only, feature flags | Superadmin | Yes |
| Analytics | Overview, real-time, geography, funnels, heatmaps, journeys, abuse | Admin | VIEW_ANALYTICS |
| Alerts | List, get, acknowledge, dismiss, silence | Admin (silence: Superadmin) | Yes |

**Implementation:** All under `app/api/admin/**`. Promote/demote: `requireSuperAdminForApi`, self-demote blocked in demote route.

---

## 8. Admin UX — Global Experience

- **Persistent bar:** 🔒 ADMIN MODE | ENV: PROD (red) or 🧪 SANDBOX (yellow) | ROLE | EMAIL.
- **Sidebar:** Dashboard; Analytics (Overview, Real-Time, Geography, Funnels, Heatmaps, User Journeys, Abuse & Security, Sandbox Analytics); Alerts; Audit Logs; System Settings (superadmin only).

**Implementation:** `components/admin/AdminGlobalBar.tsx`, `components/admin/AdminSidebar.tsx`, `app/admin/layout.tsx`.

---

## 9. Analytics UX (Enterprise-Grade)

Overview, Real-Time (SSE), Geography, Funnels, Heatmaps (privacy-safe), User Journeys, Abuse & Security, Sandbox Analytics. Each view audited (VIEW_ANALYTICS); sandbox/prod filter.

**Implementation:** `app/admin/analytics/**`, `components/admin/AdminAnalyticsDashboard.tsx`, APIs under `app/api/admin/analytics/**`. See `docs/ADMIN_ANALYTICS_UI_WIREFRAMES.md` and `docs/INTERNAL_ANALYTICS_AND_ALERTING_SPEC.md`.

---

## 10. Alerting & Notifications

- **Types:** Security, Trust & Safety, System, Sandbox.
- **Severity:** INFO, WARNING, CRITICAL. Controls UI, channel, escalation.
- **Delivery:** Admin UI, email, Slack webhook. CRITICAL → immediate; superadmin required to silence CRITICAL.
- **Audit:** Alert ack/dismiss/silence write to `admin_audit_logs`.

**Implementation:** `docs/ALERTING_SYSTEM_DESIGN.md`, `lib/admin/alerts.ts`, `app/admin/alerts`, `supabase/migrations/20250301000000_admin_alerts_system.sql`.

---

## 11. Audit & Compliance

- Admin actions → `admin_audit_logs`.
- Analytics access → VIEW_ANALYTICS with section.
- Alert acknowledgements / dismissals / silence → audit.
- Sandbox toggles → reflected in is_sandbox on every audit row.
- Data exports → must log EXPORT_ANALYTICS (when export is implemented).

Audit logs are **immutable** (REVOKE UPDATE/DELETE).

---

## 12. Privacy & Safety

- **Hash IPs** immediately in capture (`lib/analytics/privacy.ts`).
- **Respect Do Not Track:** `app/api/analytics/capture/route.ts` returns success without persisting when DNT: 1.
- **No PII** in analytics metadata (path, event_type, buckets only).
- **Admin-only** analytics access (service role + requireAdminForApi on all analytics APIs).
- **Sandbox** clearly labeled in UI and in every audit row.

---

## 13. Error Handling

- No silent admin crashes: `app/admin/error.tsx` (error boundary) with message and link to audit logs.
- Clear error messages; reference audit IDs where applicable.
- **Deny by default:** 403 for insufficient role; 500 when audit write fails (action fails).

---

## 14. Deliverables Checklist

| # | Deliverable | Status / Location |
|---|-------------|-------------------|
| 1 | Schema migrations | admin_audit_logs, site_sessions, site_page_views, site_events, abuse_signals, admin_alerts — see migrations above. |
| 2 | Role guards | `requireAdmin`, `requireSuperAdmin`, `requireAdminForApi`, `requireSuperAdminForApi` — `lib/admin/requireAdmin.ts`; `lib/auth/admin-role-guards.ts`. |
| 3 | Admin APIs | `app/api/admin/**` (users, employers, reviews, audit-logs, analytics, alerts, system). |
| 4 | Sandbox enforcement | is_sandbox on audit and analytics; `getAdminSandboxModeFromCookies`; filter on all relevant APIs. |
| 5 | Analytics capture | POST `/api/analytics/capture`, POST `/api/analytics/event`; DNT respected; IP hashed. |
| 6 | Real-time analytics | GET `/api/admin/analytics/stream` (SSE). |
| 7 | Funnels & heatmaps | GET `/api/admin/analytics/funnels`, `/api/admin/analytics/heatmaps`. |
| 8 | Abuse detection | `lib/analytics/abuse.ts`; `abuse_signals`; alerts from signals. |
| 9 | Alerting system | `lib/admin/alerts.ts`; admin_alerts, admin_alert_deliveries; UI at `/admin/alerts`. |
| 10 | Admin analytics UI | `app/admin/analytics/**`; sidebar; breadcrumb; URL-driven tabs. |
| 11 | Audit integration | `writeAdminAuditLog` / `insertAdminAuditLog`; VIEW_ANALYTICS; alert actions. |
| 12 | Superadmin safety | Promote/demote superadmin-only; cannot demote self; silence alerts superadmin-only. |
| 13 | Inline security comments | Critical paths (requireAdmin, audit-enterprise, capture) document fail-closed and audit rules. |

---

## 15. Quality Bar

This system is:

- **Enterprise-grade** — Full parity with internal tooling standards.
- **Fully auditable** — Every admin action and analytics view logged.
- **Sandbox-isolated** — No production data in sandbox; no sandbox data in production.
- **Privacy-compliant** — GDPR/CCPA; hashed IP; DNT; no PII in analytics.
- **Abuse-resistant** — Abuse signals; alerts; superadmin-only for critical actions.
- **Investor-ready** — Fail closed; no silent failures; clear audit trail.

Build as if regulators, attackers, and Fortune 500 customers are watching.
