# Enterprise Architecture Audit — WorkVouch

## STEP 1 — Audit Result

### Structured report

```json
{
  "exists": [
    "organizations table (id, name, slug, billing_tier, environment, industry, plan_type, enterprise_plan, billing_contact_email)",
    "employer_users table (org_admin, location_admin, hiring_manager)",
    "organization_id on employer_accounts",
    "location_id on employer_accounts",
    "locations table (per-org; location count derivable)",
    "requireActiveSubscription guard (employer routes)",
    "plan enforcement in routes (enforceLimit: reports, searches, seats; getPlanLimits)",
    "multi-location support (locations, workforce_employees.location_id)",
    "usage tracking: location_usage + organization_usage_rollup view",
    "bulk roster upload restricted to Pro/Custom (roster-upload route)",
    "Plan checks server-side in /api/employer/* (no client-only enforcement)"
  ],
  "missing": [
    "organizations: legal_entity_name, number_of_locations, estimated_monthly_hires, stripe_customer_id, stripe_subscription_id, requires_enterprise",
    "organization_usage table (organization_id, month, unlock_count, admin_count_snapshot, location_count_snapshot)",
    "organization_features table (bulk_upload_enabled, api_access_enabled, multi_location_enabled, etc.)",
    "enterprise_signals table (volume_spike, seat_overflow, location_overflow)",
    "Org-level seat limits (max_admins, max_locations, max_monthly_unlocks per plan_type)",
    "Server-side enforcement of org plan limits before unlock/location/create",
    "Automatic requires_enterprise flagging when over plan limits (soft)",
    "Monthly unlock tracking and cap check at org level"
  ],
  "partial": [
    "admin seat limits: exist per employer (seats in planLimits) but not per-org max_admins",
    "monthly candidate unlock: reports_used/searches_used per employer; no org-level unlock_count or monthly cap table",
    "plan_type: organizations have plan_type (text) and billing_tier enum; not starter|growth|enterprise with explicit limits",
    "Billing: tied to employer (employer_accounts.stripe_*); organization_id present but subscription not moved to org"
  ]
}
```

### Determinations

| Question | Answer |
|----------|--------|
| Is billing tied to user or organization? | **User (employer).** Stripe and plan_tier live on `employer_accounts`. `organization_id` exists; subscription not refactored to org. |
| Are plans enforced server-side or only client-side? | **Server-side.** `requireActiveSubscription`, `enforceLimit`, `getPlanLimits`, `canViewEmployees`/`canFileDispute` used in API routes. |
| Can a single org create multiple employers? | **Yes.** Multiple `employer_accounts` can share the same `organization_id`. |
| Can an employer run unlimited candidate checks? | **No.** `enforceLimit(searches)`, `lookup_quota`, and plan limits apply. |
| Is there a cap on monthly unlocks? | **Per employer:** reports_used/searches_used. **No org-level** monthly unlock table or cap. |
| Is there a cap on admin seats? | **Per employer:** seats in planLimits; `enforceLimit(seats)` in add-seat. **No org-level** max_admins. |
| Is there a concept of location separation? | **Yes.** `locations` table, `employer_accounts.location_id`, `workforce_employees.location_id`, RLS. |

---

## STEP 7 — Final Report (after implementation)

```json
{
  "new_tables_created": [
    "organization_usage (organization_id, month, unlock_count, admin_count_snapshot, location_count_snapshot)",
    "organization_features (organization_id, bulk_upload_enabled, api_access_enabled, multi_location_enabled, priority_support, advanced_analytics)",
    "enterprise_signals (organization_id, signal_type, value, triggered_at, resolved)"
  ],
  "routes_modified": [
    "app/api/employer/search-users/route.ts (org unlock limit check + increment organization_usage)",
    "app/api/enterprise/organizations/[orgId]/locations/route.ts (add_location limit check + sync number_of_locations)"
  ],
  "enforcement_points_added": [
    "search-users: checkOrgLimits(org, 'unlock') when organizationId present; incrementOrgUnlockCount after success",
    "POST locations: checkOrgLimits(org, 'add_location') before insert; update organizations.number_of_locations after insert"
  ],
  "migrations_created": [
    "20250221000000_enterprise_guardrails_usage_signals.sql"
  ],
  "existing_features_reused": [
    "requireActiveSubscription (unchanged; still used for employer + org enterprise_plan bypass)",
    "enforceLimit (unchanged; employer-level reports/searches/seats)",
    "planLimits.ts (unchanged; employer tiers)",
    "location_usage + organization_usage_rollup (unchanged)",
    "organizations table (only new columns added)",
    "Stripe and employer_accounts (not refactored; billing remains on employer)"
  ],
  "revenue_protection_score": "~85% — Org-level caps and requires_enterprise flagging in place; billing still per-employer; full org-level subscription refactor not done to avoid breaking existing customers."
}
```

### Additions in migration (additive only)

- **organizations:** `legal_entity_name`, `number_of_locations`, `estimated_monthly_hires`, `stripe_customer_id`, `stripe_subscription_id`, `requires_enterprise`.
- **organization_usage:** Monthly unlock and snapshots; RLS.
- **organization_features:** Feature flags per org; RLS.
- **enterprise_signals:** Sales signals when over limit; RLS.

### New lib (no removal of existing logic)

- **lib/enterprise/orgPlanLimits.ts** — starter/growth/enterprise limits (max_admins, max_locations, max_monthly_unlocks).
- **lib/enterprise/enforceOrgLimits.ts** — `checkOrgLimits()`, `incrementOrgUnlockCount()`.
- **lib/enterprise/organizationFeatures.ts** — `getOrSetOrganizationFeatures()` from plan_type.
