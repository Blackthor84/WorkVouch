# Monetization Policy — WorkVouch

**Principle:** Monetization must not violate user trust or sell raw user data.

---

## Allowed monetization

1. **Subscription and access tiers**  
   Employers pay for plans (free, basic, pro, enterprise). Access to features and APIs is tiered. No “pay for raw data dumps.”

2. **Employer intelligence dashboards**  
   Aggregated, scoped views (e.g. hiring confidence, rehire eligibility) for the employer’s own workforce/candidates. No cross-employer PII or raw reference export.

3. **Trust verification APIs**  
   APIs that return verification outcomes (e.g. score band, verified employment count, rehire eligibility) where contractually allowed. No bulk export of raw references or PII.

4. **Aggregated, anonymized insights**  
   Industry benchmarks, funnel metrics, and similar. No user-level or employer-level identification in external reporting.

---

## Prohibited

- **Selling or licensing raw user data:** No sale of profiles, employment records, reference text, or PII.
- **Data dumps:** No product or feature that allows bulk export of raw reference text or PII for resale or unconstrained use.
- **Use of data for purposes unrelated to trust and hiring:** No repurposing of user/employer data for advertising, credit, or other unrelated monetization without explicit consent and legal basis.

---

## Enforcement

- Internal flags and code review to prevent raw export and misuse.
- Audit logs for data access and admin exports.
- Admin-only analytics visibility; no client-side exposure of raw analytics tables.

See `docs/data_ethics.md` for data ethics and `docs/schema/admin_schema.md` for audit contract.
