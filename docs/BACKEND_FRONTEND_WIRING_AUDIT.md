# WorkVouch Backend + Frontend Wiring Audit

**Date:** 2025-01-29  
**Scope:** Database, RLS, employee flow, employer flow, paywall integrity, data visibility, security.  
**Conclusion:** **No** — system is not fully wired. Missing links, one critical vulnerability, and several fixes required.

---

## PART 1 — DATABASE AUDIT

### Tables verified (Supabase migrations + Prisma)

| Table / concept | Status | Notes |
|-----------------|--------|--------|
| **employment_records** | ✅ | `supabase/migrations/20250129000001_employment_and_matching.sql`. FK to `profiles(id)`. Indexes on user_id, company_normalized, verification_status. Constraint: end_date >= start_date. |
| **employment_matches** | ✅ | Same migration. FK to employment_records, profiles. Indexes. Constraint: overlap_end >= overlap_start. No unique constraint on (employment_record_id, matched_user_id) — duplicates possible if logic allows. |
| **references** | ⚠️ Dual schema | **Supabase:** `employment_references` (migration 02) — FK to employment_matches, profiles. UNIQUE(employment_match_id, reviewer_id). **Prisma:** `CoworkerReference` (jobHistoryId, fromUserId, toUserId) — different model (jobs-based). Two systems coexist. |
| **trust_scores** | ✅ | Base table in `supabase/schema.sql`; migration 02 adds columns (employment_verified_count, average_reference_rating, fraud_flags_count, last_updated). |
| **fraud_flags** | ✅ | Migration 02. FK to profiles. Indexes. No INSERT policy (service role only). |
| **disputes** | ✅ | Migration 04. `disputes` + `dispute_evidence` + `appeals` + `dispute_actions`. Unique index one open per (related_record_id, dispute_type). |
| **rehire_logs** | ✅ | Migration 03. FK to employment_records, employer_accounts. Migration 08 adds rehire_status, reason, justification. |
| **employer_accounts** | ✅ | `workvouch_schema_additions.sql` + migration 06. user_id, stripe_customer_id, plan_tier, subscription_status, subscription_interval, lookup_quota, etc. |
| **Stripe metadata storage** | ✅ | Webhook writes plan_tier, stripe_subscription_id, subscription_status, subscription_interval, lookup_quota to employer_accounts. Metadata (employerId, supabase_user_id) used at checkout. |

### Issues (database)

1. **Dual schema:** Prisma has JobHistory/CoworkerReference/EmployerAccount; Supabase has employment_records, employment_matches, employment_references, employer_accounts (with user_id). Some APIs use Supabase (match-employment, employment-references), others use Prisma or mixed. Clarify which is source of truth for employment/references.
2. **employment_matches:** No unique constraint on (employment_record_id, matched_user_id) in migration — duplicate matches possible if API is called twice.
3. **employer_candidate_view:** Exists (migration 03) but **no API route uses it**; employer routes query profiles/jobs/employment_records directly. Tier gating is in API logic, not via this view.

---

## PART 2 — RLS POLICY AUDIT

### Employees

| Requirement | Status | Notes |
|-------------|--------|--------|
| Can only see own employment records | ✅ | "Users can manage own employment_records" USING/WITH CHECK user_id = auth.uid(). |
| Can see matched coworkers only after overlap match | ✅ | "Users can view own employment_matches" — via employment_record_id (own record) or matched_user_id = self. |
| Can leave references only for confirmed matches | ⚠️ | **RLS:** "Users can insert employment_references as reviewer" WITH CHECK (auth.uid() = reviewer_id) — does **not** enforce match_status = 'confirmed'. **API** `/api/employment-references` correctly enforces match_status === 'confirmed'. So RLS is permissive; API is the enforcement. |

### Employers

| Requirement | Status | Notes |
|-------------|--------|--------|
| Cannot see private user emails | ❌ | **CRITICAL:** GET `/api/employer/search-users` returns `email: profile.email` for every candidate (see Part 5). RLS limits to public profiles only, but email is still returned. |
| Can only view candidate data if subscription active | ⚠️ | Employer routes check `getCurrentUser` + `hasRole('employer')` and some check `plan_tier` or `enforceLimit`. **No route checks `subscription_status === 'active'`.** Webhook sets plan_tier to starter on subscription.deleted, so canceled subs lose tier; but no explicit block for past_due/canceled. |
| Access level matches Stripe tier | ⚠️ | `canViewEmployees` (plan-enforcement-supabase) checks `plan_tier === 'basic' || 'pro'`. Stripe webhook sets `starter` / `team` / `pro`. So **basic** is never set by webhook — only starter, team, pro. planLimits normalizes free/basic → starter. search-employees uses canViewEmployees → Lite (starter) gets 403. search-users does **not** use canViewEmployees; it only uses enforceLimit(searches). So **Lite (starter) can call search-users** and get results (with email). |
| Cannot modify trust score or references | ✅ | No employer API updates trust_scores or employment_references; employers use rehire, credentials, disputes (employer_disputes/compliance_disputes). |

### Admins

| Requirement | Status | Notes |
|-------------|--------|--------|
| Can impersonate securely | ✅ | admin_sessions table; RLS "Admins can manage own admin_sessions". Impersonation API exists (`/api/admin/impersonate`). |
| Can modify dispute status | ✅ | "Only admins update dispute status" on disputes; dispute_actions for admin log. |
| Cannot bypass audit logging | ⚠️ | dispute_actions and audit_logs exist; admin dispute route logs to dispute_actions. **audit_logs** has no INSERT policy (service role only). Not all modification paths may call logAudit (e.g. trust score recalc from reference submit does not write audit_logs in the same flow). |

---

## PART 3 — EMPLOYEE FLOW TEST

| Step | Status | File / finding |
|------|--------|-----------------|
| 1. Employee adds employment record | ✅ | POST `/api/match-employment` — creates employment_records (service role). Auth: user_id must equal session.user.id. |
| 2. Matching engine runs | ✅ | Same route: same company_normalized + overlap >= 30 days → inserts employment_matches (pending). |
| 3. Match is created | ✅ | employment_matches inserted with match_status 'pending'. |
| 4. Overlap confirmation occurs | ❌ **BROKEN** | **No API updates employment_matches.match_status to 'confirmed' or 'rejected'.** RLS allows users to UPDATE own employment_matches. So confirmation can only happen via client calling Supabase client directly. No server-side handler found. |
| 5. Reference can be submitted | ✅ | POST `/api/employment-references` — checks match_status === 'confirmed', then inserts employment_references. Recalculates trust score. |
| 6. Trust score recalculates | ✅ | recalculateTrustScore(reviewedUserId) in employment-references route. lib/trustScore.ts uses employment_records (verified), employment_references, fraud_flags; server-side only. |
| 7. Fraud detection triggers | ✅ | fraud_flags table; no INSERT policy (service role only). Admin/fraud-workflow uses it. |

**Missing link (exact fix required):**

- **File:** Add or extend API (e.g. `app/api/employment-matches/[id]/route.ts` or `app/api/confirm-match/route.ts`).
- **Fix:** Accept PATCH/POST with `match_status: 'confirmed' | 'rejected'`. Verify session user is part of the match (employment_record owner or matched_user_id). Update employment_matches.match_status. **When setting to 'confirmed'**, call `recalculateTrustScore` for both the record owner and the matched user (so trust score reflects verified overlap). Optionally notify the other party.

---

## PART 4 — EMPLOYER FLOW TEST

| Step | Status | Notes |
|------|--------|--------|
| Employer signs up | ✅ | Auth + profile + employer_accounts (via Supabase/Prisma as per codebase). |
| Stripe subscription created | ✅ | Checkout session via `/api/create-checkout-session` or `/api/stripe/create-checkout`; redirect to Stripe. |
| Subscription tier stored | ✅ | Webhook `checkout.session.completed` / `customer.subscription.created|updated` → updateEmployerFromSubscription; employer_accounts.plan_tier, subscription_status, etc. |
| Tier mapped to access level | ⚠️ | getTierFromSubscription returns starter/team/pro. canViewEmployees checks basic/pro (so starter/team map to starter in planLimits; team/pro both get limits). search-employees uses canViewEmployees → 403 for starter. search-users does not use tier for data shape — only enforceLimit(searches). |
| Employer dashboard loads | ✅ | Auth + employer_accounts fetched in various employer routes. |
| Candidate lookup enforces tier restrictions | ⚠️ | search-employees: canViewEmployees (basic/pro) + jobs + profiles — returns email. search-users: isEmployer + enforceLimit(searches) only — returns email, no tier-based restriction on what data is returned. |
| Lite vs Pro vs Custom gating | ⚠️ | Lite (starter): search-employees 403; search-users allowed (limit enforced). Pro (team/pro): search-employees allowed; search-users allowed. Custom: no Stripe price; contact sales. No route uses employer_candidate_view for tiered fields. |
| No unrestricted API endpoints | ❌ | search-users returns candidate data (including email) to any authenticated employer with search quota; no check that subscription_status is active and no stripping of email. |

**Critical:** GET `/api/employer/search-users` returns candidate `email`. Design: "Employers cannot see private user emails." Either strip email from response or gate by consent/tier.

---

## PART 5 — PAYWALL INTEGRITY TEST

| Check | Result |
|-------|--------|
| API routes returning candidate data | GET `/api/employer/search-users` — profiles (id, full_name, **email**, professional_summary) + skills + jobs. GET `/api/employer/search-employees` — jobs + profiles (full_name, **email**, industry) + references. Both return candidate data; search-users exposes email to any employer with quota. |
| Server components fetching trust_scores | Trust score read via API (e.g. employer analytics) or server-side in lib/trustScore; not exposed to client without auth. |
| Public endpoints exposing references | No public endpoint returns references without auth. Employer routes require getCurrentUser + isEmployer/hasRole. |
| Access always checked via session role + subscription tier | **No.** search-users checks session + isEmployer + enforceLimit(searches). It does **not** check subscription_status or tier for data shape (e.g. hide email for Lite). |
| No client-only protection | Server-side auth is used; no client-only guard. |
| Direct Supabase public access bypassing role checks | Employer uses createServerSupabase() (user JWT) in search-users, so RLS applies. employer_candidate_view is not used by API; if called via client, RLS on underlying tables would apply. |

---

## PART 6 — DATA VISIBILITY MATRIX

| Role | Can View Employment | Can View References | Can View Trust Score | Can Submit Reference | Can Modify Rehire Status |
|------|---------------------|---------------------|----------------------|----------------------|---------------------------|
| **Employee (self)** | Own only (RLS) | Own + as reviewer (RLS) | Own (RLS) | Yes, for confirmed match only (API) | No |
| **Employer** | Via API (jobs/employment_records) tier-dependent | Via API (references/search-employees) | Via API (trust-scores, etc.) | No | Yes (rehire route, own org) |
| **Admin** | All (RLS) | All (RLS) | All (RLS) | No (admin) | No (employer-only rehire) |

**Gaps:** Employer can see candidate email via search-users and search-employees (design said cannot see private user emails). Logic for “private” vs “public” email is not implemented; email is returned for all candidates returned by the API.

---

## PART 7 — SECURITY CHECK

| Check | Status |
|-------|--------|
| No destructive deletes | No hard deletes found on critical tables; soft delete on references (is_deleted). |
| Audit logs triggered on modifications | dispute_actions and audit_logs exist. logAudit used in admin dispute flow. **Not** called on every trust score change or reference insert; only dispute resolution path. |
| Dispute system integrated | Compliance disputes + disputes tables; POST /api/disputes; admin resolve. |
| No missing validation (Zod or equivalent) | Match-employment, employment-references, rehire, disputes use Zod where inspected. |
| No direct DB writes from client | Writes go through API or Supabase with RLS. Employment_matches update by client via Supabase RLS is possible (no API for confirm/reject). |

---

## OUTPUT SUMMARY

### Fully wired? **No**

### Missing links

1. **Confirm/reject employment match (server-side):** No API updates `employment_matches.match_status` to `confirmed`/`rejected` or calls `recalculateTrustScore` on confirm. Either add PATCH/POST API for match confirmation and trigger trust score recalc, or document that client updates via Supabase RLS and add a DB trigger / backend job to recalc trust score when match_status becomes confirmed.
2. **employer_candidate_view unused:** Tier-gated candidate view exists in DB but no employer API uses it; all candidate data is built from ad-hoc queries. Consider using the view and enforcing tier in API (Lite = trust only, Pro = +employment, etc.).
3. **subscription_status not enforced:** No employer route checks `subscription_status === 'active'` before returning candidate data. Recommend checking subscription_status (or equivalent) for paywalled routes.

### Security risks

1. **CRITICAL — Candidate email exposure:** GET `/api/employer/search-users` and GET `/api/employer/search-employees` return candidate `email`. Design: employers cannot see private user emails. **Fix:** Remove `email` from employer-facing search responses, or gate by user consent and/or tier (e.g. Pro only, or only when candidate has shared contact).
2. **RLS reference insert:** RLS allows insert into employment_references whenever reviewer_id = auth.uid(); it does not enforce match_status = confirmed. API enforces it; if service role or another path inserts references, confirmed-match rule could be bypassed. Prefer tightening RLS (e.g. check match_status via subquery) or document that API is the single writer.

### Broken flows

1. **Employee overlap confirmation → trust score:** Match confirmation (status → confirmed) is only possible via client Supabase update (or missing API). Trust score is not recalculated when a match is confirmed; it is only recalculated when a reference is submitted. So “confirm overlap” does not update trust score until a reference is left.

### Stripe gating confirmation

- **Webhook:** Present; updates employer_accounts (plan_tier, subscription_status, stripe_subscription_id, lookup_quota, etc.).
- **Checkout:** Uses metadata (employerId or supabase_user_id) to link customer to employer.
- **Enforcement:** plan_tier and enforceLimit(searches/reports) are used. subscription_status is not checked. Tier names: Stripe sets starter/team/pro; some middleware checks basic/pro (basic not set by webhook; planLimits normalizes basic → starter).

### RLS issues

1. **employment_references INSERT:** Does not enforce that employment_match.match_status = 'confirmed'. API does; RLS is permissive.
2. **Employers can view public profiles:** RLS allows employers to see public profiles (including email in schema); API then returns that email. So RLS + API together expose email.

### Critical vulnerabilities

1. **Candidate email exposed to employers** via GET `/api/employer/search-users` and GET `/api/employer/search-employees`. Exact files: `app/api/employer/search-users/route.ts` (lines selecting and returning `email`), `app/api/employer/search-employees/route.ts` (same).

### Exact files requiring fixes

| Priority | File | Fix |
|----------|------|-----|
| **Critical** | `app/api/employer/search-users/route.ts` | Remove `email` from profile select and from response object (or gate behind consent/tier). |
| **Critical** | `app/api/employer/search-employees/route.ts` | Remove `email` from profile/job response (or gate behind consent/tier). |
| **High** | New or existing API | Add server-side confirm/reject employment match: update employment_matches.match_status; on 'confirmed', call recalculateTrustScore for both users. |
| **Medium** | Employer paywalled routes | Consider checking subscription_status === 'active' (or equivalent) before returning candidate data. |
| **Medium** | RLS | Optional: tighten employment_references INSERT to require match_status = 'confirmed' via subquery. |

---

*Audit traced actual code and schema; no functionality was assumed.*
