# Backend Claims Implementation — Production Systems

This document describes the production-grade backend systems added to enforce homepage and employer claims: verified employment, coworker matching, trust scoring, reference validation, fraud prevention, employer dashboard logic, rehire tracking, and secure admin impersonation.

---

## 1. Schema & Migrations

**Location:** `supabase/migrations/`

| File | Contents |
|------|----------|
| `20250129000001_employment_and_matching.sql` | `employment_records`, `employment_matches`, enums (`employment_verification_status`, `employment_match_status`), indexes, RLS, trigger to normalize `company_normalized` |
| `20250129000002_references_fraud_trust.sql` | `employment_references` (unique on `employment_match_id` + `reviewer_id`), `fraud_flags`, new columns on `trust_scores` (`employment_verified_count`, `average_reference_rating`, `fraud_flags_count`, `last_updated`) |
| `20250129000003_employer_view_rehire_admin.sql` | `rehire_logs`, `admin_sessions`, view `employer_candidate_view` |

**Run order:** 001 → 002 → 003 (in Supabase SQL Editor or via `supabase db push` if using CLI).

**Existing tables preserved:** `jobs`, `references`, `trust_scores` remain; new tables are additive. `employment_records` is the canonical verified-employment layer; `employment_references` is the match-based reference layer (existing `references` is job-based).

---

## 2. RLS Policies Summary

- **employment_records:** Users can CRUD own rows (`user_id = auth.uid()`).
- **employment_matches:** Users can SELECT where they are record owner or matched user; can UPDATE (confirm/reject) own matches. INSERT is done only via service role in API.
- **employment_references:** Users can SELECT where reviewer or reviewed; can INSERT as reviewer (API enforces confirmed match + no duplicate).
- **fraud_flags:** SELECT only for admin/superadmin. INSERT only via service role (no policy = deny for anon/authenticated).
- **rehire_logs:** Employers can SELECT own logs (`employer_id` in their `employer_accounts`).
- **admin_sessions:** Admins can manage own sessions (`admin_id = auth.uid()`).

---

## 3. API Routes

| Route | Method | Purpose |
|-------|--------|--------|
| `app/api/match-employment/route.ts` | POST | Create employment record (or use existing `employment_record_id`), run coworker matching (same `company_normalized`, overlap ≥ 30 days), create pending `employment_matches`, send SendGrid email to matched users. Auth: user can only submit for self. |
| `app/api/employment-references/route.ts` | POST | Submit reference for a **confirmed** employment match. Zod body: `employment_match_id`, `rating` (1–5), `comment` optional. Rate limit: 10/hour per user. Recalculates trust score for reviewed user. |

**Existing auth:** All routes use `getServerSession(authOptions)`. No change to NextAuth config.

---

## 4. Trust Score Engine

**File:** `lib/trustScore.ts`

- **Formula (server-side only):**  
  `Base = (verified_employments * 15) + (avg_rating * 10) + (reference_count * 5) - (fraud_flags * 25)`  
  Capped 0–100.
- **Exports:** `computeTrustScore(inputs)`, `recalculateTrustScore(userId)`.
- **When to call `recalculateTrustScore`:** After reference submitted, match confirmed, or fraud flag added (from your API or cron).
- **Never calculate on frontend.**

Upsert uses `trust_scores` with `onConflict: "user_id"`. New columns from migration 002 are optional in app code until you start writing them.

---

## 5. Fraud Prevention

- **Table:** `fraud_flags` (id, user_id, reason, severity 1–5, created_by, created_at).
- **Insert:** Only via service role (e.g. in API or cron). Triggers: e.g. >3 rejected matches, 3+ references from same IP range, circular validation, employer report — implement in your API/cron and then insert into `fraud_flags` and call `recalculateTrustScore(userId)`.
- **employment_records:** Column `verification_status` can be set to `'flagged'` when a fraud flag is created (do this in the same API/cron that inserts `fraud_flags`).

---

## 6. Employer Dashboard Data

- **View:** `employer_candidate_view` — exposes `user_id`, `full_name`, `industry`, `city`, `state`, `verified_employment_count`, `trust_score`, `reference_count`, `aggregate_rating`, `rehire_eligible_count`. **No email.**
- **Tier gating:** Enforce in API (not in view). Example: Lite = trust score only; Pro = trust + employment verification; Custom = full. Use `employer_accounts.plan_tier` or Stripe metadata and allow fields per tier when querying the view (or underlying tables) with service role.

---

## 7. Rehire Eligibility

- **employment_records:** Columns `rehire_eligible` (boolean, nullable), `marked_by_employer_id` (FK to `employer_accounts`). Only the employer who confirmed the match should set these (enforce in API).
- **rehire_logs:** Audit who marked, when, previous/new value. Insert from API when updating `rehire_eligible`.

---

## 8. Admin “View As User” (Impersonation)

- **Table:** `admin_sessions` (id, admin_id, impersonated_user_id, created_at, expires_at).
- **POST /api/admin/impersonate:** Unchanged auth (admin/superadmin only). Now also: inserts `admin_sessions` with `expires_at = now + 30 min`, creates a signed JWT (sessionId, impersonated_user_id, exp 30m) with `jose`, returns `{ impersonateUser, impersonationToken, expiresAt }`. Still returns `impersonateUser` for existing client `updateSession({ impersonateUser })`.
- **JWT secret:** `NEXTAUTH_SECRET` or `IMPERSONATION_JWT_SECRET`. Never expose raw user tokens.
- **Optional middleware:** Add root `middleware.ts` to read cookie `__workvouch_impersonation`, verify JWT and exp; if expired/invalid, clear cookie. Client can set this cookie from `impersonationToken` to enforce 30‑min expiry in future.

---

## 9. Security Hardening

- RLS enabled on all new tables; deny by default; access via role checks and service role where needed.
- **Validation:** `match-employment` and `employment-references` use **Zod** for request bodies.
- **Rate limit:** Reference submissions limited to 10/hour per user (in-memory in `employment-references` route).
- **Trust score:** Recalculation only in `lib/trustScore.ts` (server-side); log recalculations in your logging/monitoring.

---

## 10. File / Project Structure

```
app/api/
  match-employment/route.ts      # POST: create employment + run matching + email
  employment-references/route.ts # POST: submit reference (rate limited, Zod)
  admin/impersonate/route.ts     # (updated) admin_sessions + JWT

lib/
  trustScore.ts                  # computeTrustScore, recalculateTrustScore

supabase/migrations/
  20250129000001_employment_and_matching.sql
  20250129000002_references_fraud_trust.sql
  20250129000003_employer_view_rehire_admin.sql
```

---

## 11. Integration Checklist

1. Run migrations 001 → 003 in Supabase (SQL Editor or CLI).
2. Ensure `SENDGRID_API_KEY` and `NEXT_PUBLIC_APP_URL` (or `VERCEL_URL`) are set for match emails.
3. Optional: set `IMPERSONATION_JWT_SECRET` for impersonation JWT (else `NEXTAUTH_SECRET` is used).
4. Call `recalculateTrustScore(userId)` from:
   - `app/api/employment-references/route.ts` (done),
   - Your “confirm match” API when `employment_matches.match_status` → `confirmed`,
   - Your fraud-flag creation path after inserting into `fraud_flags`.
5. Employer dashboard: query `employer_candidate_view` (or underlying tables) with service role and apply tier checks (Lite/Pro/Custom) in your API.
6. Rehire: when an employer marks rehire, update `employment_records.rehire_eligible` and `marked_by_employer_id`, and insert into `rehire_logs`.

---

## 12. Production Notes

- **employment_records** stores normalized `company_normalized` (lowercase, trimmed) for matching.
- **employment_matches** overlap is computed in API (≥ 30 days); emails sent via SendGrid.
- **employment_references** requires match_status = `confirmed`; duplicate (employment_match_id, reviewer_id) is blocked by DB constraint.
- Trust score formula and caps are in `lib/trustScore.ts` only; do not replicate on frontend.
- Admin impersonation remains session-based for the UI; JWT + admin_sessions add server-side expiry and auditability.
