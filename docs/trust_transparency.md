# Trust Transparency - WorkVouch

**Purpose:** Right-to-explanation for trust scores. Legal defensibility and enterprise due diligence.

## How trust is calculated

- Canonical formula: See docs/schema/trust_schema.md and Admin Scoring Explained.
- Components: Tenure, review volume, sentiment, rating, fraud penalty, rehire multiplier. All contribute to a single 0-100 score.
- No silent changes: Every score change has a reason, audit log, and before/after state (audit_logs, intelligence_score_history, intelligence_history).

## Right to explanation

- Users and enterprises can request an explanation of a trust score.
- Admin Scoring Explained provides the formula (read-only) and, for a given user, component breakdown and historical changes.
- Dispute resolution and appeals use the same formula and audit trail; no black box adjustments without reason.

## Data minimization

- Only data necessary for verification and scoring is stored (employment, references, fraud flags, audit).
- Analytics: no raw IP; hashed only. No PII in event metadata. See docs/schema/analytics_schema.md.

## Export and compliance

- Audit and incident reports are exportable (admin/incidents export, audit logs) for compliance and enterprise procurement.
- See docs/data_ethics.md and docs/monetization_policy.md for data use and monetization limits.
