# Automated Incident Reporting and Response System

**Automated, structured, auditable incident response.** Integrates with admin/superadmin, internal analytics, abuse detection, alerting, sandbox/production, and immutable audit logs.

---

## 1. Non-Negotiable Rules

| Rule | Implementation |
|------|----------------|
| Incidents generated automatically from alerts | CRITICAL alerts → `createIncidentFromAlert(alertId)` in `lib/admin/alerts.ts`. |
| Lifecycle: open → mitigated → resolved | `incidents.status`; status changes via `updateIncidentStatus`; no delete. |
| Incidents are immutable records | No UPDATE on core fields; only status/mitigated_at/resolved_at updated. incident_actions append-only. |
| Sandbox incidents never mix with production | `incidents.environment` = `prod` \| `sandbox`; all list/detail/export filter by environment. |
| Superadmin has override authority | CRITICAL incidents require superadmin to resolve (enforced in API). |
| Every incident action is audited | incident_actions table + admin_audit_logs (INCIDENT_CREATED, INCIDENT_MITIGATED, INCIDENT_RESOLVED, INCIDENT_ACTION, EXPORT_INCIDENTS). |
| Fail safe (no silent dismissal) | Status change and add-action require reason; API returns errors; audit write can throw. |
| Exportable | GET /api/admin/incidents/export?format=json|csv; audited. |

---

## 2. Incident Definition (When Created)

- **CRITICAL alert fires** → automatic incident (see `createAlert` + `createIncidentFromAlert`).
- **Multiple WARNING alerts aggregate** → extend by calling `createIncident` from a job or threshold check (e.g. count WARNING in last 15 min).
- **Security threshold exceeded** → call `createIncident` from abuse or analytics code with `incident_type` and `triggered_by`.
- **Audit logging fails** → in audit failure path, call `createIncident` with type `system` and severity `critical` (and optionally notify superadmin).
- **Sandbox/prod divergence, trust integrity** → call `createIncident` from respective detectors.

---

## 3. Severity Levels

- **LOW** — Informational.
- **MEDIUM** — Degraded behavior.
- **HIGH** — Active abuse or risk.
- **CRITICAL** — System integrity at risk. Resolution requires superadmin.

Severity drives notification urgency, escalation, and who can resolve.

---

## 4. Database Schema

**incidents:** id, incident_type, severity, title, description, environment (prod|sandbox), status (open|mitigated|resolved), detected_at, mitigated_at, resolved_at, triggered_by, related_alert_ids (UUID[]), affected_users, affected_employers, created_at.

**incident_actions:** id, incident_id (FK), admin_user_id, admin_role, action_type, action_metadata (JSONB), created_at.

Migration: `supabase/migrations/20250302000000_incidents_system.sql`. RLS: service role only.

---

## 5. Incident Creation (Automated)

- **From CRITICAL alert:** After `createAlert` with severity `critical`, `createIncidentFromAlert(alertId)` is invoked (fire-and-forget). Incident gets same title/summary, environment from alert is_sandbox, related_alert_ids = [alertId].
- **Audit:** Incident creation writes to `incident_actions` (action_type `incident_created`) and to `admin_audit_logs` (INCIDENT_CREATED with system actor).
- **Notifications:** Alerts already dispatch (email/Slack for CRITICAL). Incidents do not duplicate notification; they add structure and lifecycle.

---

## 6. Lifecycle

- **OPEN** — Active issue. Admins can add actions, mark mitigated.
- **MITIGATED** — Damage contained. mitigated_at set. Superadmin or admin can resolve.
- **RESOLVED** — Root cause addressed. resolved_at set. **CRITICAL incidents require superadmin to resolve.**

Status changes require a reason and write to incident_actions and admin_audit_logs.

---

## 7. Admin UX — Incident Command Center

- **Route:** `/admin/incidents`.
- **Views:** Filters for open, mitigated, resolved; environment (prod/sandbox); severity. Default view: open.
- **List columns:** Detected, severity, title, env, status, affected scope, link to detail.
- **Detail view:** Title, description, severity, env, status, triggered_by, related alerts link, **timeline** (incident_actions), and actions: add mitigation note, mark mitigated, resolve (superadmin for CRITICAL).
- **Export:** JSON and CSV with current filters; EXPORT_INCIDENTS audit log.

---

## 8. Automated Response Playbooks (Extension Point)

Playbooks can be implemented as:

- **On incident creation:** After `createIncident`, call `runPlaybook(incidentId, playbookKey)`. Playbook executes safe automations (e.g. log, tag) and for destructive actions (rate limit, freeze trust scores, read-only mode) creates an incident_action requiring admin confirmation or runs only when configured.
- **Scheduled:** Cron or job that finds open HIGH/CRITICAL incidents and runs playbooks (e.g. escalate after T minutes).
- **Always log:** Every playbook action must write to incident_actions (and optionally admin_audit_logs).

Current codebase provides incident creation and lifecycle; playbook engine can be added in `lib/admin/incidents.ts` (e.g. `runPlaybook(incidentId, key)`) and invoked from createIncident or a background job.

---

## 9. Notifications & Escalation

- **CRITICAL incident** — Already notified via CRITICAL alert (email/Slack). No duplicate; incident is the structured record.
- **Escalation timers** — Can be added: job that checks open CRITICAL/HIGH incidents and after T minutes increments escalation or notifies again (e.g. via alert or email).
- **Sandbox incidents** — Clearly labeled in UI; do not trigger production notification channels (same as alerts).

---

## 10. Audit & Compliance

- **Incident creation** — INCIDENT_CREATED in admin_audit_logs; incident_actions row (incident_created).
- **Status changes** — INCIDENT_MITIGATED / INCIDENT_RESOLVED; incident_actions (status_mitigated, status_resolved).
- **Admin actions** — INCIDENT_ACTION; incident_actions row.
- **Export** — EXPORT_INCIDENTS with count, format, filters.

Incident records are immutable (no row delete); exportable via CSV/JSON for investors, regulators, enterprise customers.

---

## 11. Sandbox Parity

- Sandbox incidents use same schema, same UI, same lifecycle and filters.
- Environment = sandbox; visually separated in list and detail.
- Sandbox incidents never affect production data; production incidents never show sandbox-only data in the same list unless "All env" is selected.

---

## 12. Error Handling

- If incident creation fails (e.g. DB error), alert flow still completes; incident creation is best-effort after alert insert.
- If incident system is down and a CRITICAL alert fires, alert dispatch still runs (email/Slack). Optionally: in catch of createIncidentFromAlert, create a CRITICAL incident about "incident system failure" via a minimal path (e.g. log and notify superadmin) to avoid recursive failure.

---

## 13. Deliverables Checklist

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | Incident schemas | `supabase/migrations/20250302000000_incidents_system.sql` |
| 2 | Incident creation logic | `lib/admin/incidents.ts` (createIncident, createIncidentFromAlert) |
| 3 | Playbook extension point | Documented above; runPlaybook can be added in same lib |
| 4 | Admin incident UI | `app/admin/incidents/page.tsx`, `components/admin/IncidentsClient.tsx` |
| 5 | Notifications | Via existing CRITICAL alert dispatch; incidents are structured records |
| 6 | Sandbox-safe handling | environment column; filters in list/export |
| 7 | Audit integration | admin_audit_logs + incident_actions |
| 8 | Export | GET /api/admin/incidents/export (JSON/CSV, audited) |
| 9 | Inline documentation | Comments in lib and API routes |

This system is enterprise-grade, SOC-ready, auditable, sandbox-aware, and exportable for investors and regulators.
