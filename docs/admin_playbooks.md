# Admin Playbooks — WorkVouch

**Purpose:** Standard responses for trust & safety, security, and system events. Fail closed; audit everything.

---

## Trust & safety

- **Dispute / appeal:** Resolve via admin dispute flow. Log resolution and reason in admin_audit_logs. Recalculate trust only through canonical path (recalculateTrustScore with reason).
- **Fraud flag:** Add fraud_flag; recalculate trust. If systemic, create alert and consider incident. Do not remove fraud flags without reason and audit.
- **Overlap abuse:** Use overlap verification rules (no self-verify, no reciprocal). Record abuse signal; freeze trust if policy requires; escalate to incident if systemic. See `lib/overlap/verification.ts`.

---

## Security

- **Critical alert:** Acknowledge with reason. Resolve or mitigate. CRITICAL resolution requires superadmin. Log in admin_audit_logs and incident_actions if incident created.
- **Abuse signals spike:** Review abuse_signals and analytics. Create incident if needed. Do not silence without reason (superadmin only for silence).

---

## System

- **Sandbox parity:** All admin actions available in sandbox with is_sandbox set. Test in sandbox first where possible.
- **Superadmin:** Cannot demote self. Cannot demote another superadmin. Promote/demote only via dedicated API with reason and audit.
- **Audit failure:** If admin_audit_logs insert fails, the action must fail (no silent success). Fix audit pipeline before retrying action.

---

## Incident lifecycle

- **Open → Mitigated → Resolved.** Critical incidents require superadmin to resolve. All status changes and actions logged in incident_actions and admin_audit_logs.
- **Export:** Use Admin → Incidents → Export for compliance and handoff. See `app/api/admin/incidents/export/route.ts`.

---

## References

- Schema: `docs/schema/trust_schema.md`, `admin_schema.md`, `analytics_schema.md`
- Data ethics: `docs/data_ethics.md`
- Monetization: `docs/monetization_policy.md`
