# Admin Schema — Canonical Contract

**Purpose:** Single source of truth for admin, audit, alerts, and incidents. No admin action without audit. Fail-closed.

---

## 1. `admin_audit_logs`

**Immutable.** Every admin action MUST write here. If insert fails, the action MUST fail. REVOKE UPDATE/DELETE.

| Column (canonical) | Type        | Required | Description |
|--------------------|-------------|----------|-------------|
| `id`               | UUID        | yes      | Primary key. |
| `admin_user_id`    | UUID        | yes      | Who performed the action. |
| `admin_email`      | TEXT        | no       | |
| `admin_role`       | TEXT        | yes      | admin | superadmin. |
| `action_type`      | TEXT        | yes      | e.g. user_suspend, trust_adjustment. |
| `target_type`      | TEXT        | yes      | user | employer | trust_score | etc. |
| `target_id`        | UUID        | no       | |
| `before_state`     | JSONB       | no       | |
| `after_state`      | JSONB       | no       | |
| `reason`           | TEXT        | yes      | Justification. Required. |
| `is_sandbox`       | BOOLEAN     | yes      | Default false. Sandbox parity. |
| `ip_address`      | TEXT        | no       | |
| `user_agent`       | TEXT        | no       | |
| `created_at`        | TIMESTAMPTZ | yes      | |

**Indexes:** admin_user_id, action_type, target_type, created_at DESC.

---

## 2. `user_roles` / admin identification

Admin vs superadmin separation. Superadmin cannot demote self (enforced in application).

- Roles: `admin`, `superadmin`.
- Sandbox parity: ALL admin actions available in sandbox with is_sandbox = true and audited.

---

## 3. `admin_alerts`

Real-time alerting. Sandbox and production strictly separated by `is_sandbox`.

| Column (canonical) | Type        | Required | Description |
|--------------------|-------------|----------|-------------|
| `id`               | UUID        | yes      | Primary key. |
| `category`         | TEXT        | yes      | security | trust_safety | system. |
| `alert_type`       | TEXT        | yes      | |
| `severity`         | TEXT        | yes      | info | warning | critical. CHECK. |
| `title`            | TEXT        | yes      | |
| `summary`          | TEXT        | yes      | |
| `context`          | JSONB       | no       | Default {}. |
| `recommended_action` | TEXT      | no       | |
| `is_sandbox`       | BOOLEAN     | yes      | Default false. |
| `status`           | TEXT        | yes      | new | read | acknowledged | dismissed | escalated. |
| `acknowledged_by`  | UUID        | no       | |
| `acknowledged_at`  | TIMESTAMPTZ | no       | |
| `dismissed_by`     | UUID        | no       | |
| `dismissed_at`     | TIMESTAMPTZ | no       | |
| `silenced_until`   | TIMESTAMPTZ | no       | |
| `escalation_count` | INT         | yes      | Default 0. |
| `source_ref`       | JSONB       | no       | Default {}. |
| `created_at`       | TIMESTAMPTZ | yes      | |

---

## 4. `admin_alert_deliveries`

Delivery audit (in_app, email, slack).

| Column (canonical) | Type        | Required | Description |
|--------------------|-------------|----------|-------------|
| `id`               | UUID        | yes      | Primary key. |
| `alert_id`         | UUID        | yes      | FK admin_alerts(id). |
| `channel`          | TEXT        | yes      | |
| `recipient`        | TEXT        | no       | |
| `sent_at`          | TIMESTAMPTZ | yes      | |
| `error`            | TEXT        | no       | |

---

## 5. `incidents`

Automated incident records. Immutable. Sandbox vs prod by `environment`.

| Column (canonical)   | Type        | Required | Description |
|----------------------|-------------|----------|-------------|
| `id`                 | UUID        | yes      | Primary key. |
| `incident_type`      | TEXT        | yes      | |
| `severity`           | TEXT        | yes      | low | medium | high | critical. CHECK. |
| `title`              | TEXT        | yes      | |
| `description`        | TEXT        | yes      | |
| `environment`        | TEXT        | yes      | prod | sandbox. CHECK. |
| `status`             | TEXT        | yes      | open | mitigated | resolved. |
| `detected_at`        | TIMESTAMPTZ | yes      | |
| `mitigated_at`       | TIMESTAMPTZ | no       | |
| `resolved_at`        | TIMESTAMPTZ | no       | |
| `triggered_by`       | TEXT        | no       | |
| `related_alert_ids`  | UUID[]      | no       | Default []. |
| `affected_users`     | INTEGER     | no       | |
| `affected_employers`  | INTEGER     | no       | |
| `created_at`         | TIMESTAMPTZ | yes      | |

---

## 6. `incident_actions`

Every action on an incident (admin or automated). Audit trail.

| Column (canonical) | Type        | Required | Description |
|--------------------|-------------|----------|-------------|
| `id`               | UUID        | yes      | Primary key. |
| `incident_id`      | UUID        | yes      | FK incidents(id). |
| `admin_user_id`    | UUID        | no       | |
| `admin_role`       | TEXT        | no       | |
| `action_type`      | TEXT        | yes      | |
| `action_metadata`   | JSONB       | no       | Default {}. |
| `created_at`        | TIMESTAMPTZ | yes      | |

---

## Admin action contract

All admin actions must:
1. Enforce role (admin/superadmin).
2. Enforce sandbox (is_sandbox for audit).
3. Write to admin_audit_logs (reason required).
4. Fail if audit write fails.

Actions include: user suspension, employer suspension, trust adjustments, review moderation, overlap invalidation. Critical incidents require superadmin resolution where configured.
