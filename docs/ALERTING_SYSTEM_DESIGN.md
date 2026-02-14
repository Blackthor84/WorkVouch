# Real-Time Alerting and Notification System — Design

Enterprise admin platform alerting: detect problems, surface instantly, notify the right admins — without noise. Sandbox and production are strictly separated; every action is auditable.

---

## 1. Principles

| Principle | Application |
|-----------|-------------|
| **Actionable** | Every alert has a clear recommended action and context. No “something is wrong” without “do this.” |
| **Context** | No alert without context: what happened, why it matters, affected scope (no PII in alerts). |
| **Explicit severity** | INFO / WARNING / CRITICAL. Severity drives UI color, channel, and escalation. |
| **Sandbox ≠ Production** | Sandbox alerts never mix with production. Tables and UI filter by `is_sandbox`. Sandbox alerts do not trigger production notification channels. |
| **Auditable** | Alert creation, dismissal, acknowledgement, escalation, and silencing are logged (admin_audit_logs or equivalent). |

---

## 2. Alert Types (Required)

### Security

| Type | Description | Default severity |
|------|-------------|-------------------|
| `multi_account_same_ip` | Multiple accounts from same IP hash | WARNING |
| `vpn_proxy_abuse` | VPN / proxy abuse | WARNING |
| `failed_login_loop` | Failed login loops | WARNING |
| `scraping_behavior` | Scraping behavior | WARNING |
| `sandbox_misuse` | Sandbox misuse attempts | CRITICAL (in prod context) |

### Trust & Safety

| Type | Description | Default severity |
|------|-------------|-------------------|
| `trust_score_drop` | Sudden trust score drops | WARNING |
| `review_fraud_spike` | Review fraud spikes | CRITICAL |
| `employer_abuse` | Employer abuse signals | WARNING |

### System

| Type | Description | Default severity |
|------|-------------|-------------------|
| `error_rate_spike` | Error rate spikes | CRITICAL |
| `admin_action_failed` | Failed admin actions | WARNING |
| `audit_log_failure` | Audit logging failures | CRITICAL |
| `analytics_capture_failure` | Analytics capture failures | WARNING |

### Sandbox

| Type | Description | Default severity |
|------|-------------|-------------------|
| `sandbox_test_action` | Sandbox test actions executed | INFO |
| `sandbox_emergency_action` | Sandbox-only emergency actions | WARNING |
| `sandbox_prod_divergence` | Sandbox vs prod divergence | INFO |

---

## 3. Severity Levels

| Level | Value | UI | Notification | Escalation |
|-------|--------|-----|--------------|------------|
| INFO | `info` | Neutral (slate) | In-app only | No |
| WARNING | `warning` | Amber | Aggregate (e.g. digest) or in-app | After threshold |
| CRITICAL | `critical` | Red | Immediate (email + optional Slack) | Yes; superadmin can silence |

Severity is stored as `TEXT` in DB: `info` | `warning` | `critical`.

---

## 4. Notification Channels

| Channel | Use | When |
|---------|-----|------|
| **Admin panel (in-app)** | Notification center / Alerts page | All severities; read/unread tracked |
| **Email** | SendGrid to admin list | CRITICAL immediately; WARNING in digest (configurable) |
| **Slack** | Webhook | CRITICAL (optional); WARNING if configured |
| **Future** | PagerDuty / webhook | Extensible via `admin_alert_deliveries` and config |

Rules:

- **CRITICAL:** Notify immediately (in-app + email; Slack if `SLACK_ALERT_WEBHOOK_URL` set).
- **WARNING:** In-app always; email/Slack aggregated or on threshold (e.g. 5 in 15 min).
- **INFO:** In-app only.

---

## 5. Schema

### 5.1 `admin_alerts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `category` | TEXT | `security` \| `trust_safety` \| `system` \| `sandbox` |
| `alert_type` | TEXT | e.g. `multi_account_same_ip`, `error_rate_spike` |
| `severity` | TEXT | `info` \| `warning` \| `critical` |
| `title` | TEXT | Short headline |
| `summary` | TEXT | One-paragraph “what happened” |
| `context` | JSONB | Structured context (e.g. ip_hash, session_id, counts). No PII. |
| `recommended_action` | TEXT | What to do next |
| `is_sandbox` | BOOLEAN | **Required.** Sandbox alerts never mixed with prod. |
| `status` | TEXT | `new` \| `read` \| `acknowledged` \| `dismissed` \| `escalated` |
| `acknowledged_by` | UUID | Admin who acknowledged |
| `acknowledged_at` | TIMESTAMPTZ | |
| `dismissed_by` | UUID | Admin who dismissed |
| `dismissed_at` | TIMESTAMPTZ | |
| `silenced_until` | TIMESTAMPTZ | Superadmin only; suppress notifications until time |
| `escalation_count` | INT DEFAULT 0 | |
| `source_ref` | JSONB | Optional: e.g. `{ "abuse_signal_id": "..." }`, `{ "audit_log_id": "..." }` for link to audit |
| `created_at` | TIMESTAMPTZ | |

Indexes: `(is_sandbox, created_at DESC)`, `(status, is_sandbox)`, `(severity, is_sandbox)`.

### 5.2 `admin_alert_deliveries`

Tracks delivery for audit and retry.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | |
| `alert_id` | UUID FK → admin_alerts | |
| `channel` | TEXT | `in_app` \| `email` \| `slack` |
| `recipient` | TEXT | Email or Slack channel/user id (or “all_admins”) |
| `sent_at` | TIMESTAMPTZ | |
| `error` | TEXT | If delivery failed |

---

## 6. Alert Generation Rules

- **Security:** From `abuse_signals` and auth middleware: when a signal is inserted or threshold crossed, call `createAlert()` with category `security`, appropriate `alert_type`, and `source_ref.session_id` / signal id. Use `abuse_signals.is_sandbox` for `is_sandbox`.
- **Trust & Safety:** From trust score job or review moderation: on sudden drop or fraud spike, call `createAlert()` with category `trust_safety`.
- **System:** From audit failure path, analytics capture failure, or error-rate job: call `createAlert()` with category `system`; on audit/analytics failure, severity CRITICAL.
- **Sandbox:** When sandbox-only emergency or test action runs, or when sandbox/prod divergence is detected, call `createAlert()` with category `sandbox` and `is_sandbox: true`.

All generators must set: `category`, `alert_type`, `severity`, `title`, `summary`, `context`, `recommended_action`, `is_sandbox`. Optional: `source_ref` for deep link to audit/abuse.

---

## 7. Notification Dispatch Logic

1. **On insert into `admin_alerts`:**
   - If `silenced_until` is set and `silenced_until > NOW()`, skip external channels (in-app still shown).
   - If severity is `critical`: send email to admin list; send Slack if webhook configured; record rows in `admin_alert_deliveries`.
   - If severity is `warning`: enqueue for digest or send in-app only (configurable); optionally record in-app delivery.
   - If severity is `info`: in-app only (no email/Slack).

2. **Recipients:** From env `ADMIN_ALERT_EMAILS` or `PLATFORM_ADMIN_EMAILS` (or query profiles where role in ('admin','superadmin') and email not null). Sandbox alerts: only notify when viewer is in sandbox; never send sandbox alerts to production email list.

3. **Failure handling:** If email/Slack fails: log error, write to `admin_alert_deliveries` with `error` set; trigger backup path (e.g. retry once or raise “alerting_failure” alert). Alerting failure itself raises a CRITICAL system alert (with minimal dependency to avoid loop).

---

## 8. Admin UX — Alert Center

**Route:** `/admin/alerts`

**Views:**

- **Live alerts feed:** List of alerts (newest first); filters: severity, category, sandbox vs prod; unread/read state.
- **Detail view:** What happened, why it matters, affected users/systems (no PII), recommended action, audit trail link (from `source_ref`).

**Behavior:**

- Sandbox toggle: when “Production” selected, only `is_sandbox = false`; when “Sandbox”, only `is_sandbox = true`. Default to current admin context (sandbox vs prod).
- Mark as read: PATCH `status` to `read` (and optionally track reader in a separate read-receipt table or in context).
- Acknowledge: PATCH `status` to `acknowledged`, set `acknowledged_by`, `acknowledged_at`; write to admin_audit_logs.
- Dismiss: PATCH `status` to `dismissed`, set `dismissed_by`, `dismissed_at`; write to admin_audit_logs. CRITICAL may require superadmin or reason.
- Silenced: Superadmin only; set `silenced_until`; write to admin_audit_logs.

---

## 9. Delivery & Escalation

- **Storage:** All alerts in DB; read/unread via `status` and optional read tracking.
- **Escalation:** If an alert remains `new` or `read` for N minutes (e.g. 15 for CRITICAL), increment `escalation_count` and re-send notifications (or escalate to PagerDuty later). Escalation event logged.
- **Superadmin override:** Only superadmin can set `silenced_until`. Silencing is logged with reason in admin_audit_logs.

---

## 10. Audit & Compliance

- **Alert creation:** Stored in `admin_alerts` with `created_at`; optional system actor in audit (e.g. “system” or service account) for creation.
- **Alert dismissal:** Logged in `admin_audit_logs`: action_type `alert_dismissed`, target_type `system`, target_id = alert id, reason.
- **Alert acknowledgement:** Logged in `admin_audit_logs`: action_type `alert_acknowledged`, target_type `system`, target_id = alert id.
- **Alert escalation:** Logged (e.g. in metadata or admin_audit_logs): action_type `alert_escalated`.
- **Admin who acknowledged/dismissed:** Stored in `admin_alerts` and in audit log row.

---

## 11. Failure Handling

- If alert insert fails: log error; optionally retry; if critical condition, try backup notification (e.g. email only) and record “alerting_failure” in a safe way.
- If notification dispatch fails: write to `admin_alert_deliveries` with error; trigger backup path; failure can raise a meta-alert (e.g. “Alert delivery failed for alert_id X”) with minimal dependencies to avoid cascade.

---

## 12. Sandbox-Safe Alert Separation

- **Storage:** Every row has `is_sandbox`. No row is “both”; queries always filter by `is_sandbox` per current context.
- **UI:** Default filter = current mode (sandbox vs prod). No mixing in same list unless “All” explicitly chosen (and then clearly labeled).
- **Channels:** Production notification list never receives sandbox alerts. Sandbox alerts only visible when admin is in sandbox mode or viewing sandbox alerts.
- **Creation:** Callers (abuse, audit, jobs) must pass `is_sandbox` from the context of the event (e.g. from `abuse_signals.is_sandbox` or request/session).

---

## 13. Severity Escalation Logic

- **INFO:** No auto-escalation.
- **WARNING:** After T minutes (e.g. 30) unresolved, optionally re-notify or bump to “escalated” in UI; no severity change unless business rule says so.
- **CRITICAL:** After T minutes (e.g. 15) unresolved, increment `escalation_count`, re-send notifications; after N escalations (e.g. 2), consider PagerDuty or superadmin-only notification. Escalation logged.

---

## 14. Implementation Checklist

- [ ] Migration: `admin_alerts`, `admin_alert_deliveries`, indexes, RLS (service role only).
- [ ] Lib: `createAlert()`, `dispatchNotifications()`, `acknowledgeAlert()`, `dismissAlert()`, `escalateAlert()`, `silenceAlert()` (superadmin).
- [ ] APIs: GET list, GET by id, PATCH acknowledge/dismiss/silence; internal POST or server-only createAlert usage from abuse/audit/jobs.
- [ ] Admin UI: Alert Center page, filters (severity, category, sandbox/prod), detail view, audit link from `source_ref`.
- [ ] Wire: Abuse detection → createAlert on threshold; audit failure → createAlert; optional error-rate job → createAlert.
- [ ] Env: `ADMIN_ALERT_EMAILS` or use existing admin list; `SLACK_ALERT_WEBHOOK_URL` optional; `ALERT_CRITICAL_ESCALATION_MINUTES`, `ALERT_WARNING_AGGREGATE_MINUTES`.

This design keeps the platform protected even when admins are not watching, while keeping sandbox and production strictly separated and every action auditable.

---

## 15. Implementation Summary (Done)

| Item | Location |
|------|----------|
| **Schema** | `supabase/migrations/20250301000000_admin_alerts_system.sql` — `admin_alerts`, `admin_alert_deliveries`, RLS |
| **Alert lib** | `lib/admin/alerts.ts` — `createAlert`, `dispatchNotifications`, `createAlertFromAbuseSignal`, `markAlertRead`, `acknowledgeAlert`, `dismissAlert`, `silenceAlert`, `escalateAlert` |
| **APIs** | `GET/PATCH /api/admin/alerts`, `GET/PATCH /api/admin/alerts/[id]` — list, detail, read/ack/dismiss/silence |
| **Admin UI** | `app/admin/alerts/page.tsx`, `components/admin/AlertsClient.tsx` — filters (env, severity, category, status), detail view, actions |
| **Sidebar** | `components/admin/AdminSidebar.tsx` — "Alerts" link under Analytics |
| **Abuse → Alert** | `lib/analytics/abuse.ts` — after inserting abuse signal, calls `createAlertFromAbuseSignal` (fire-and-forget) |

**Env (optional):** `ADMIN_ALERT_EMAILS` or `PLATFORM_ADMIN_EMAILS` for critical email; `SLACK_ALERT_WEBHOOK_URL` for Slack.
