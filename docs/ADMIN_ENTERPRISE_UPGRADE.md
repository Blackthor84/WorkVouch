# WorkVouch Admin Panel — Enterprise Governance Upgrade

## 1) Files created

| Path | Purpose |
|------|--------|
| `lib/roles.ts` (extended) | Role hierarchy: user, employer, admin, superadmin, system. `canModifyUser`, `canAssignRole`. |
| `lib/admin/requireAdmin.ts` (extended) | `assertAdminCanModify(admin, targetUserId, targetRole, newRole?)`. |
| `lib/admin/activityLog.ts` | `insertUserActivity({ userId, type, metadata })` for `user_activity_log`. |
| `lib/admin/anomalyAlerts.ts` | `insertAnomalyAlert({ userId, alertType, metadata })` for anomaly engine. |
| `lib/admin/getAuditRequestMeta.ts` | `getAuditRequestMeta(req)` → ipAddress, userAgent for audit logs. |
| `supabase/migrations/20250212000000_enterprise_admin_governance.sql` | user_activity_log, system_settings, fraud_signals, anomaly_alerts; admin_audit_logs ip_address, user_agent. |
| `app/api/admin/users/[id]/activity/route.ts` | GET user activity log (timeline). |
| `app/api/admin/users/[id]/employment/route.ts` | GET employment records for user. |
| `app/api/admin/users/[id]/peer-reviews/route.ts` | GET peer reviews for user. |
| `app/api/admin/users/[id]/fraud-signals/route.ts` | GET fraud signals for user. |
| `app/api/admin/users/[id]/audit-log/route.ts` | GET admin audit entries for user. |
| `app/api/admin/users/[id]/intelligence-breakdown/route.ts` | GET full intelligence breakdown (tenure, volume, sentiment, rehire, raw, final, version). |
| `app/api/admin/fraud/route.ts` | GET fraud signals list (dashboard). |
| `app/api/admin/export/route.ts` | GET CSV export: type=users\|peer_reviews\|fraud_flags\|employment\|audit_logs. |
| `app/api/admin/system/settings/route.ts` | GET/PATCH system settings (maintenance_mode; superadmin for PATCH). |
| `app/api/admin/maintenance/route.ts` | GET maintenance status (public, for middleware/signup/review flows). |
| `app/api/admin/bulk/route.ts` | POST bulk: suspend, soft_delete, recalculate, fraud_flag, downgrade_employers, delete_reviews. |
| `app/api/admin/employers/[id]/overrides/route.ts` | PATCH employer overrides (plan_tier, billing cycle, usage counters; superadmin only). |
| `app/admin/fraud/page.tsx` | Fraud detection dashboard. |
| `app/admin/export/page.tsx` | Data export & compliance (CSV download links). |
| `app/admin/system/page.tsx` | System panel (maintenance toggle, parity link). |
| `app/admin/system/parity/page.tsx` | Production parity validator (sandbox vs production). |
| `components/admin/user-forensics-tabs.tsx` | Tabs: Overview, Employment, Peer Reviews, Intelligence, Fraud, Audit, Session Activity, Payment. |
| `components/admin/fraud-dashboard-client.tsx` | Fraud dashboard table + deep link to user. |
| `components/admin/system-panel-client.tsx` | Maintenance mode toggle. |
| `components/admin/parity-report-client.tsx` | Parity check UI (stub). |

## 2) Files modified

| Path | Changes |
|------|--------|
| `lib/roles.ts` | Added ROLE_ORDER, AssignableRole, SystemRole, roleLevel(), canModifyUser(), canAssignRole(), isSystem(). |
| `lib/admin/requireAdmin.ts` | Added assertAdminCanModify(). |
| `lib/admin/audit.ts` | Added optional ipAddress, userAgent to insertAdminAuditLog. |
| `app/api/admin/users/[id]/route.ts` | Role checks: assertAdminCanModify; only superadmin can edit Stripe IDs; getAuditRequestMeta(req) for audit. |
| `app/api/admin/users/[id]/suspend/route.ts` | assertAdminCanModify before suspend. |
| `app/api/admin/users/[id]/unsuspend/route.ts` | assertAdminCanModify before unsuspend. |
| `app/api/admin/users/[id]/soft-delete/route.ts` | assertAdminCanModify before soft delete. |
| `app/admin/users/[id]/page.tsx` | Replaced single card with UserForensicsTabs (overview + 7 other tabs). |
| `app/admin/page.tsx` | Grouped into sections: Users, Employers, Fraud, Intelligence, Simulation, Billing, Compliance, System. Added Fraud, Export, System panel links. |
| `app/admin/intelligence-health/AdminIntelligenceHealthClient.tsx` | Added intelligenceVersion card and HealthData fields. |
| `app/api/admin/intelligence-health/route.ts` | Added intelligenceVersion, avgSentimentDriftLast7Days, concurrentRecalcCollisions, rehireFlagChangeFrequency (placeholders). |

## 3) DB schema changes

- **user_activity_log**: id, user_id, type, metadata (jsonb), created_at. RLS: user select own; admin select all. Inserts via service role.
- **system_settings**: key (PK), value (jsonb), updated_at, updated_by. maintenance_mode row: enabled, block_signups, block_reviews, block_employment, banner_message. RLS: admin select; superadmin update.
- **fraud_signals**: id, user_id, signal_type, metadata, created_at. RLS: admin select.
- **anomaly_alerts**: id, user_id, alert_type, metadata, created_at. RLS: admin select.
- **admin_audit_logs**: added ip_address (text), user_agent (text).

## 4) Security checks added

- **Role hierarchy**: Admin cannot modify superadmin. Admin cannot escalate own role. Only superadmin can assign superadmin. System role is internal-only.
- **assertAdminCanModify(admin, targetUserId, targetRole, newRole?)**: Used in PATCH user, suspend, unsuspend, soft-delete. Throws if actor cannot modify target or assign new role.
- **Stripe IDs**: PATCH user only allows stripe_customer_id / stripe_subscription_id when admin.isSuperAdmin.
- **Hard delete**: Already superadmin-only (hard-delete route).
- **Bulk actions**: Each target user checked with assertAdminCanModify.
- **Employer overrides**: requireSuperAdmin() in PATCH /api/admin/employers/[id]/overrides.
- **System settings / maintenance**: PATCH and system panel require superadmin.

## 5) Logging improvements

- **Admin audit**: insertAdminAuditLog() now accepts optional ipAddress and userAgent. getAuditRequestMeta(req) used in PATCH user route (pattern for other routes).
- **user_activity_log**: insertUserActivity() available for timeline (call from auth, review create/delete, employment add/delete, admin actions).
- **anomaly_alerts**: insertAnomalyAlert() available for alert engine (rapid_reviews, sentiment_shift, employer_negative_spike, overlap_failures).

## 6) Deprecated files removed

- None. All existing functionality retained.

## 7) New admin navigation structure

Sections on `/admin`:

1. **Users** — Manage Users, Signups  
2. **Employers** — Claim Requests, Employer Usage  
3. **Fraud** — Fraud Detection Dashboard, Fraud Workflow  
4. **Intelligence** — Enterprise Intelligence (dashboard, preview, health, employer reputation)  
5. **Simulation** — Sandbox v2, Preview, Preview Control, Beta, Investor (superadmin)  
6. **Billing** — Ads Manager  
7. **Compliance** — Disputes, Verifications, Data Export  
8. **System** — Vertical Control; (superadmin) System Panel, Hidden Features, Superadmin Control  

New routes:

- `/admin/fraud` — Fraud dashboard (deep link to user).  
- `/admin/export` — CSV export (users, peer reviews, fraud flags, employment, audit logs).  
- `/admin/system` — Maintenance mode toggle, parity link.  
- `/admin/system/parity` — Parity validator (stub).  
- `/admin/users/[id]` — Now tabbed: Overview, Employment Records, Peer Reviews, Intelligence (with breakdown), Fraud Signals, Audit Log, Session Activity, Payment & Plan (if employer).

---

## Optional next steps (not implemented)

- **Phase 8 (Employer admin)** — Override subscription tier, billing cycle, reset usage, add/remove credit, revenue simulation: API stub at `PATCH /api/admin/employers/[id]/overrides` (plan_tier, billing_cycle_*, usage counters). UI can be added on employer-usage or a dedicated employer detail page.
- **Phase 10 (Diff history)** — Old score / new score / trigger / timestamp: would require intelligence_score_history or similar; currently only current breakdown is shown.
- **Phase 11 (Anomaly engine)** — Conditions (>10 reviews in 5 min, etc.): call insertAnomalyAlert() from review/employment endpoints or a cron when conditions are detected.
- **Phase 12 (Rate limits, CSRF)** — Rate limit review/employment creation and CSRF validation in forms; IP logging pattern is in place for audit.
- **Maintenance mode enforcement** — Call `GET /api/admin/maintenance` from signup, review creation, and employment creation flows (and optionally middleware) to block when enabled.
