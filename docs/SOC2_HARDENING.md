# SOC-2 Hardening — WorkVouch

## STEP 1 — Access control

- **Admin routes** (`/api/admin/*`): Require **ADMIN** role. Use `requireAdminForApi()` or `getAdminContext()`; return **403** when `!admin.isAdmin` via `adminForbiddenResponse()`.
- **Sandbox routes** (`/api/sandbox/*`): Require **SANDBOX** env and **ADMIN** role. Use `requireSandboxMode()` (returns 403 if `!isSandbox()`) then `requireSandboxV2Admin()` or `requireSandboxV2AdminWithRole()`.
- **Guards**: All admin and sandbox routes must enforce the above; no production data mutation from sandbox; no sandbox actions when not in sandbox mode.

## STEP 2 — Impersonation audit

- **Table**: `impersonation_audit` — append-only; no UPDATE/DELETE.
- **Logged**: Start impersonation, End impersonation; admin_user_id, admin_email, target_user_id, target_identifier, event (start|end), environment (production|sandbox), ip_address, user_agent, created_at.
- **Wired**: Admin impersonate (start), Admin impersonate/exit (end), Sandbox impersonate (start), Sandbox impersonate/exit (end).
- **Read-only view**: Admin → Audit Logs → "Impersonation audit" section; API: `GET /api/admin/audit-logs/impersonation`.

## STEP 3 — Rule versioning

- **Table**: `sandbox_rule_versions` — immutable versions for trust scoring, culture weighting, abuse thresholds.
- **On change**: Insert new version row; set previous version inactive (`is_active_sandbox` / `is_active_production` = false); **never delete** old versions.
- **Rule sets**: trust_score_formula, overlap_verification, review_weighting, penalty_thresholds, fraud_detection_thresholds.
- **DB**: `REVOKE DELETE ON sandbox_rule_versions` so old versions cannot be removed.

## STEP 4 — Data isolation

- **Sandbox writes**: All sandbox writes must set `is_sandbox = true` (audit rows) or use only `sandbox_*` tables.
- **Queries**: Filter by environment; production code must not read sandbox_* for production decisions; sandbox code must not write to production user/employer tables.
- **No cross-environment joins**: Do not join production profiles/employment with sandbox_* in a way that affects production outcomes.
- **Checklist** (before deploy): See `docs/SANDBOX_SAFETY_AND_DEMO.md`. Assert: every sandbox API returns 403 when `NEXT_PUBLIC_APP_MODE !== 'sandbox'`; every admin/sandbox write to audit includes `is_sandbox` where applicable; no production table is written from `/api/sandbox/*` handlers.

## STEP 5 — Audit logs (immutable, exportable)

- **admin_audit_logs**: Append-only; `REVOKE UPDATE`, `REVOKE DELETE`. Every admin action MUST write here; if insert fails, the action fails.
- **audit_logs**: Append-only; `REVOKE UPDATE`, `REVOKE DELETE`.
- **impersonation_audit**: Append-only; `REVOKE UPDATE`, `REVOKE DELETE`.
- **Export**: Admin → Export (CSV) supports `audit_logs`; extend if needed for impersonation_audit.

## Acceptance criteria

- Sandbox can never affect production (guards + isolation).
- Admin actions are always traceable (admin_audit_logs + impersonation_audit).
- Scoring/rule logic changes are auditable (rule_versions, no deletes).
- Impersonation is transparent (start/end logged, visible in Admin Audit Logs).
- System is App-Store and enterprise safe (immutable logs, role-based access, environment isolation).
