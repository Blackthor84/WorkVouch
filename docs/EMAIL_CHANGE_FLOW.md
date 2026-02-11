# Email change flow (enterprise two-step verification)

No email changes instantly. All changes go through verification or superadmin force with reason.

## User self-service (two-step)

1. **Request** — POST `/api/account/request-email-change` with `new_email`.
   - Auth required. New email validated; must not be in use.
   - Rate limit: max 3 requests per 24h per user.
   - Row inserted in `email_change_requests` (token, 24h expiry).
   - Verification email sent to **new** email (confirm link).
   - Alert email sent to **old** email (IP, timestamp, revoke link).
   - Logged: `system_audit_logs` + `[SECURITY][EMAIL_CHANGE_REQUEST]`.

2. **Confirm** — User clicks link → `/settings?confirm-email-change=TOKEN` or POST `/api/account/confirm-email-change` with `token`.
   - Token must be pending and not expired (24h).
   - Single-use: request marked completed.
   - Auth and profiles updated; row in `email_change_history`; fraud signal + intelligence recalc.
   - Logged: `system_audit_logs`, `admin_audit_logs`, `[SECURITY][EMAIL_CHANGE_CONFIRMED]`.

3. **Revoke** — From old-email link: POST `/api/account/revoke-email-change` with `token`.
   - Request marked revoked. Logged: `[SECURITY][EMAIL_CHANGE_REVOKED]`.

## Superadmin force

- POST `/api/admin/users/[id]/force-email-change` with `new_email` and `reason` (min 10 chars).
- Superadmin only. Updates auth + profiles; inserts `email_change_history` (changed_by: admin).
- Notifications sent to both old and new email. No silent changes.

## Direct email update

- **Removed** from POST `/api/account/update-profile` (name only).
- **Removed** from PATCH `/api/admin/users/[id]/update` (name, role, status only). Email change is via force-email-change only.

## Observability

- `[SECURITY][EMAIL_CHANGE_REQUEST]`
- `[SECURITY][EMAIL_CHANGE_CONFIRMED]`
- `[SECURITY][EMAIL_CHANGE_REVOKED]`
- `[SECURITY][EMAIL_CHANGE_FORCED_ADMIN]`

All include user_id, ip, timestamp where applicable.
