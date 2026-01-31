# Security Agency Bundle — End-to-End Audit Report

## 1. Stripe Integration

### What was already working
- **Webhook** (`app/api/stripe/webhook/route.ts`): `customer.subscription.created` / `updated` call `updateEmployerFromSubscription`, which uses `getTierFromSubscription()` and updates `employer_accounts.plan_tier`, `stripe_subscription_id`, and overage item IDs.
- **Downgrade/cancel**: `customer.subscription.deleted` calls `updateEmployerPlanTier(customerId, "starter")`, so plan_tier is reset on cancel.
- **Price map**: `lib/stripe/config.ts` had `STRIPE_PRICE_SECURITY` mapped to a tier (previously `security_bundle`).

### What was missing / wired
- **plan_tier naming**: You requested `plan_tier = "security_agency"`. The Stripe price → tier map now uses **"security_agency"** (not `security_bundle`) so that:
  - `STRIPE_PRICE_SECURITY` → `"security_agency"`
  - `STRIPE_PRICE_SECURITY_BUNDLE` (optional env alias) → `"security_agency"`
- Webhook and downgrade logic unchanged; they now persist `"security_agency"` when the Security price is on the subscription.

---

## 2. Plan Limits

### What was already working
- **getPlanLimits()** in `lib/planLimits.ts`: `security_bundle` had reports: 80, searches: -1, seats: 10, allowOverage: true.
- **enforceLimit()** in `lib/enforceLimit.ts`: Uses `getPlanLimits(row.plan_tier)` and blocks when at limit and `!allowOverage`; allows overage when `allowOverage` is true.
- **normalizeTier()**: Normalized `security_bundle` and `security` to the same key.

### What was wired
- **security_agency** added as a plan key with:
  - reports: **80**
  - searches: **-1** (unlimited)
  - seats: **20**
  - allowOverage: **true**
- **security_bundle** limits updated to seats: **20** (to match).
- **normalizeTier()** now treats `security_agency`, `security_bundle`, and `security` as **security_agency** for limits.
- No change to `enforceLimit()` logic; it already respects unlimited (-1) and allowOverage.

---

## 3. Feature Unlock Wiring

### What was already working
- **checkFeatureAccess()** in `lib/feature-flags.ts`: Reads `feature_flags` and `feature_flag_assignments`, respects `required_subscription_tier` and tier rank (`TIER_RANK`).
- **TIER_RANK** included `security_bundle: 4` (top tier).

### What was wired
- **security_agency** added to `TIER_RANK` with rank 4.
- **SECURITY_AGENCY_AUTO_FEATURES**: When the employer’s `plan_tier` is `security_agency` or `security_bundle`, the following features are **auto-enabled server-side** (no flag assignment needed):
  - `risk_snapshot`
  - `workforce_dashboard`
  - `rehire_system`
  - `license_upload`
  - `internal_employer_notes`
  - `structured_hiring_dashboard`
  - `inconsistency_detection`
- Logic runs at the start of `checkFeatureAccess()`: if the employer has security_agency/security_bundle and the feature key is in the set, the function returns `true` (and caches).

---

## 4. Dashboard Variant

### What was missing / wired
- **SecurityDashboard** component (`components/employer/SecurityDashboard.tsx`): New client component that fetches:
  - `/api/employer/usage` → reports used this month
  - `/api/employer/security-summary` → expiring licenses, high-risk employees, pending verifications, internal notes count
- **Security summary API** (`app/api/employer/security-summary/route.ts`): Returns `expiringLicensesCount`, `highRiskEmployeesCount`, `pendingVerificationsCount`, `internalNotesCount` for the current employer (session).
- **Employer dashboard** (`components/employer/EmployerDashboardClient.tsx`): When `planTier === "security_agency"` or `"security_bundle"` or `"security-bundle"`, the **SecurityDashboard** is rendered above the Usage Panel (reports used, expiring licenses, high-risk employees, pending verifications, internal notes summary).

---

## 5. Database Verification

### What was already present
- **feature_flags** and **feature_flag_assignments**: Defined in `supabase/create_feature_flags_tables.sql` (with `key` in production schema).
- **admin_actions**: `supabase/create_admin_actions_table.sql` and `admin_actions_add_details.sql` (adds `details`).

### What was added
- **guard_licenses** (`supabase/security_agency_guard_licenses.sql`): Table for Security Agency license uploads (employer_id, profile_id, license_type, file_path, file_name, expiration_date, status). RLS enabled; service_role policy.
- **employer_internal_notes** (`supabase/security_agency_employer_internal_notes.sql`): Table for internal notes (employer_id, profile_id, author_id, content). RLS enabled; service_role policy.
- **plan_tier enum** (`supabase/plan_tier_security_agency.sql`): `ALTER TYPE plan_tier ADD VALUE IF NOT EXISTS 'security_agency';` for DBs that use an enum.

---

## 6. Audit Logging

### What was already working
- **admin_actions**: Used for impersonation and feature-flag changes; has `admin_id`, `impersonated_user_id`, `action_type`, and optional `details`.

### What was wired
- **lib/audit.ts**: `logAuditAction(actionType, payload)` inserts into `admin_actions` with `action_type`, `admin_id`, `impersonated_user_id` (target), and `details`. Never throws.
- **Events logged:**
  - **Verification requested**: `app/api/employer/request-verification/route.ts` calls `logAuditAction("verification_requested", { admin_id, employer_id, profile_id, details })` after a successful request.
  - **License uploaded**: `app/api/security/upload-license/route.ts` calls `logAuditAction("license_uploaded", { admin_id, employer_id, details })` after a successful upload.
  - **Risk flagged**: `lib/risk/calculateAndPersist.ts` calls `logAuditAction("risk_flagged", { profile_id, details })` when `components.overall < 50` after storing risk.
  - **Internal note created**: `app/api/employer/rehire/route.ts` POST calls `logAuditAction("internal_note_created", { employer_id, profile_id, details })` when `internalNotes` is set.

---

## 7. Admin Panel

### What was already working
- **EmployerUsageClient** showed plan as a generic badge and listed reports, searches, seats, overages.

### What was wired
- **Security Agency badge**: When `planTier` is `security_agency`, `security_bundle`, or `security-bundle`, the plan column shows a **“Security Agency”** badge (variant `info`) instead of the raw tier name.
- **Usage metrics**: Unchanged; still shown (reports, searches, seats, limits, overages).
- **License activity count**: **GET /api/admin/employer-usage** now queries `guard_licenses` (when the table exists) and returns **licenseCount** per employer. **EmployerUsageClient** has a **“Licenses”** column showing that count.

---

## 8. Upload-License & Guard Licenses

### What was already working
- **POST /api/security/upload-license**: Existed; checked `plan_tier === "security-bundle"` and returned mock license data.

### What was wired
- **Plan check**: Accepts **security_agency** and **security_bundle** (and hyphenated forms) via normalized `plan_tier`.
- **Persist**: On success, inserts a row into **guard_licenses** (employer_id, file_name, license_type, status) and returns the new `id` in the response.
- **Audit**: Calls `logAuditAction("license_uploaded", ...)` after a successful upload.

---

## 9. Testing — Development Test Account

To test the Security Agency Bundle without Stripe:

1. **Set plan_tier in DB** (Supabase SQL or dashboard):
   - `UPDATE employer_accounts SET plan_tier = 'security_agency' WHERE id = '<employer_account_id>';`
   - If your schema uses an enum, run `supabase/plan_tier_security_agency.sql` first.
2. **Run migrations** (if not already applied):
   - `supabase/security_agency_guard_licenses.sql`
   - `supabase/security_agency_employer_internal_notes.sql`
   - `supabase/admin_actions_add_details.sql` (for audit `details`)
3. **Verify**:
   - Employer dashboard shows **SecurityDashboard** (reports used, expiring licenses, high-risk count, pending verifications, internal notes).
   - Risk Snapshot, Workforce Dashboard, and Rehire Registry UI are enabled (feature flags auto-on for security_agency).
   - **POST /api/security/upload-license** with a file and Security Agency plan returns 200 and creates a row in `guard_licenses`.
   - Admin employer list shows **“Security Agency”** badge and **Licenses** count for that employer.
   - Audit events appear in `admin_actions` for verification requested, license uploaded, risk flagged, and internal note created (when applicable).

---

## Summary

| Area | Status |
|------|--------|
| Stripe → plan_tier **security_agency** | Wired (price map + webhook) |
| Webhook / downgrade updates plan_tier | Already working |
| Plan limits **security_agency** (80 / unlimited / 20 / overage) | Wired |
| enforceLimit() | Already working |
| Feature auto-enable for security_agency | Wired (server-side) |
| SecurityDashboard + security-summary API | Wired |
| guard_licenses table | Migration added |
| employer_internal_notes table | Migration added |
| feature_flags / feature_flag_assignments | Already present |
| admin_actions audit | Already present; events wired |
| Admin Security Agency badge + Licenses column | Wired |
| Upload-license → guard_licenses + audit | Wired |
| plan_tier enum **security_agency** | Migration added |

### Blockers / Notes

- **Enum vs text**: If `employer_accounts.plan_tier` is a Postgres **enum**, run `plan_tier_security_agency.sql` so `security_agency` is a valid value. If it’s **text**, no enum migration is needed.
- **admin_actions.details**: Audit events use a `details` column; ensure `admin_actions_add_details.sql` has been run.
- **guard_licenses**: Upload-license inserts into this table; run `security_agency_guard_licenses.sql` before testing uploads.
- **High-risk count**: Security summary uses `profiles.risk_score < 50`; depends on Risk Intelligence Engine having run and `risk_score` populated.
