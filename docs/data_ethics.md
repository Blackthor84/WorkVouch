# Data Ethics - WorkVouch

**Principle:** No data monetization that violates user trust. System must fail closed.

## Non-negotiable

1. We do not sell raw user data. No PII dumps, no resale of profiles, employment, or references.
2. Internal analytics: Sessions, page views, events, abuse signals. IP stored as hash only. No raw IP. No PII in event metadata. Admin-only read. See docs/schema/analytics_schema.md.
3. Audit logs: Every admin action is logged with reason. No silent actions. If audit write fails, the action fails.
4. Data minimization: We collect only what is needed for trust verification, product operation, and security.

## Allowed use

- Aggregated, anonymized insights: e.g. industry benchmarks, funnel conversion (no user-level export).
- Employer intelligence dashboards: Data scoped to employer's own candidates/employees per contract and RBAC.
- Access tiers: Product features and API access by plan, not data dumps.
- Trust verification APIs: Verification outcomes (e.g. score band, verified employments count) where contractually allowed; no raw reference text or PII export.

## Internal safeguards

- Raw export prevention: Admin export and API responses must not expose bulk raw PII except where required for support/dispute with strict access control.
- Data access audit: Admin-only analytics and export actions are logged (who, when, what scope).
- Sandbox parity: All admin actions available in sandbox with is_sandbox set; production and sandbox data strictly separated.

## GDPR / CCPA alignment

- Right to explanation for trust scores (see Admin Scoring Explained and docs/schema/trust_schema.md).
- Data minimization and purpose limitation.
- Exportable audit and incident reports for compliance and enterprise due diligence.
