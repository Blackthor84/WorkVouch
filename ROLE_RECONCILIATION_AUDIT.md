# Sprint 12.5 — Production Role Reconciliation Audit

**Date:** 2026-08-20  
**Scope:** Read-only audit — no code, database, migration, or production data changes were made.  
**Production snapshot (operator-confirmed):**

| `profiles.role` | Count |
|-----------------|-------|
| `user`          | 18    |
| `employer`      | 1     |
| `super_admin`   | 1     |

**Production schema facts:**
- `profiles.role` is **TEXT** (not an enum).
- `public.user_role` enum **does not exist**.
- Current CHECK constraint allows **`user`, `employer`, `super_admin`** (does **not** allow `employee`).

---

## Executive recommendation

# SAFE TO CONVERT `user` → `employee`

**Conditions (must all be satisfied before migration):**

1. Run the **pre-flight classification query** (§18) in Supabase SQL Editor — confirm none of the 18 `user` rows have `employer_accounts` or were intentionally left as ambiguous pending accounts.
2. Apply a **combined migration** that (a) backfills `user` → `employee`, (b) updates the CHECK constraint, (c) ensures RLS allows `employee` profile reads, (d) replaces `handle_new_user()` — **do not run Sprint 12.4 file alone** (see §H).
3. Verify RLS policies on production include `"Employees read own profile"` (or equivalent) **before or in the same migration** as the backfill.

**Do not demote or reclassify accounts merely because they use a corporate/hotel email domain.** Legacy signup always defaulted non-founder accounts to `user`; a company email does not imply `employer`.

---

## A. Is `user` functionally equivalent to `employee`?

**Yes — for routing, dashboards, and worker workflows.**

Evidence:

| Layer | Behavior for `profiles.role = 'user'` |
|-------|----------------------------------------|
| **`resolveUserRole()`** | Maps `user` → **`employee`** via `EMPLOYEE_ALIASES` (`lib/auth/resolveUserRole.ts`) |
| **Proxy / route guards** | Uses `resolveUserRole()` → employee zone (`proxy.ts`, `lib/proxy/routeAccess.ts`, `lib/auth/roleRouting.ts`) |
| **Post-login redirect** | `getPostLoginRedirect()` → `/dashboard` (employee path) |
| **Employer integrations** | `hasRole("employer")` is **exact match** → `user` is **not** employer |
| **Greenhouse Connect** | `requireEmployerIntegration()` requires `hasRole("employer")` + `employer_accounts` row |

**Semantic origin:** `user` was the original platform default for “regular signed-up person” (worker/candidate), not a generic unclassified account.

- `supabase/add_role_column_to_profiles.sql`: `DEFAULT 'user'`, backfill NULL → `'user'`.
- `supabase/schema.sql` / all legacy `handle_new_user()` variants: insert `'user'` into `user_roles`; set `profiles.role = 'user'`.
- `supabase/migrations/20260316120000_strict_roles_signup_and_backfill.sql`: explicitly documents `'user'` as legacy alias to backfill → `'employee'`.

**Caveats (not routing-equivalence gaps, but exact-string checks):**

| Location | `user` behavior | `employee` behavior |
|----------|-----------------|----------------------|
| `needsWorkerVouchOnboarding()` | **Skipped** (`role !== "employee"`) | Enforced if loop incomplete |
| `OnboardingProvider` overlay | Hidden (checks raw `user.role === "employee"`) | Shown |
| `hasRole("employee")` | **false** (exact match) | true |
| RLS `"Workers only"` policy | **Matches** (`role = 'user'`) | Needs `"Employees read own profile"` policy |
| `/api/onboarding/complete` body | Accepts `"user"` and writes it to DB | Accepts only if client sends `"employee"` (legacy API) |
| `/api/resume/upload` | **Allowed** (`user` OR `employee`) | Allowed |

For the 18 production accounts, **`user` has been operating as the employee/worker persona** via `resolveUserRole()`. The gaps above are implementation inconsistencies, not evidence that `user` means something other than employee.

---

## B. Is it safe to migrate existing `role='user'` records to `role='employee'`?

**Yes, with pre-flight checks and RLS verification.**

Safe because:
- No code path grants **employer** or **admin** access from `user`.
- Only **1** production `employer` row exists (separate account); converting the 18 `user` rows cannot collide with it.
- `choose-role` already writes `'employee'` in application code — production CHECK currently **blocks** that value; migration fixes a broken state.
- Trust, verification, resume, and coworker flows do not require the literal string `'user'`.

**Pre-flight must confirm:** none of the 18 rows have `employer_accounts`, `tenant_memberships` with employer roles, or other signals that the account was meant to be employer. (See §18.)

**Behavior change to expect after conversion:**
- `needsWorkerVouchOnboarding()` may start redirecting users who have not completed `worker_onboarding_loop_completed_at` into the vouch onboarding loop. This is **correct employee behavior**, not a regression — legacy `user` bypassed that gate.

---

## C. If not equivalent — what does `user` actually represent?

In this codebase, `user` is **not** a third product role alongside employee/employer/admin. It is:

1. **Legacy DB default** from signup triggers (`handle_new_user()` → `'user'`).
2. **Legacy `user_roles` enum value** mirrored to `profiles.role` as TEXT.
3. **Normalized alias** for employee in `resolveUserRole()`.
4. **Admin-context label** in `getAdminContext()` meaning “non-admin platform user” (unrelated to `profiles.role` routing).

It does **not** mean “unclassified pending user” — pending is **`NULL`** in the current model.

---

## D. Should `user` remain an allowed legacy role?

**No — not as a canonical `profiles.role` value going forward.**

Reasons:
- Application choose-role writes `'employee'` / `'employer'` only.
- Sprint 12.4 CHECK target is `NULL | employee | employer | super_admin`.
- Keeping `'user'` in CHECK perpetuates dual semantics and breaks choose-role → employee on production today.

**Optional transitional approach:** include `'user'` in CHECK **only during a short migration window**, then remove after backfill. Prefer backfill + new CHECK in one transaction.

Legacy `'user'` may remain in **`user_roles`** table inserts (Sprint 12.4 trigger still writes `'user'` there for RLS compatibility) — that is separate from `profiles.role`.

---

## E. Should new signups receive NULL until choose-role?

**Yes.** This is the current application contract:

- `SignupClient.tsx` omits `role` from auth metadata.
- `resolveUserRole({ role: null })` → `"pending"` → `/choose-role`.
- Sprint 12.4 / `20260316120000` trigger design: founder → `super_admin`; everyone else → `NULL`.

---

## F. What should `handle_new_user()` write for a normal signup?

| Signup type | `profiles.role` | Notes |
|-------------|-----------------|-------|
| **Normal new user** | `NULL` | Pending `/choose-role` |
| **Employee (after choose-role)** | `'employee'` | Written by `POST /api/user/choose-role`, **not** by trigger |
| **Employer (after choose-role)** | `'employer'` | Written by choose-role; also sets `plan: 'free'` |
| **Founder / super admin** | `'super_admin'` | Only when email matches `founder@tryworkvouch.com` (or `FOUNDER_EMAIL` env in app) |

Trigger must **not** read auth metadata `role: "employee"` (root cause of Sprint 12.3 signup failure).

Optional legacy `user_roles` insert (best-effort, non-blocking): `'superadmin'` for founder, `'employer'` if metadata `user_type=employer`, else `'user'`.

---

## G. Could changing existing `user` records break functionality?

| Area | Risk | Mitigation |
|------|------|------------|
| **Routing / proxy** | Low | Both map to employee zone today |
| **RLS profile SELECT** | **Medium** | Ensure `"Employees read own profile"` policy exists before backfill; keep `"Workers only"` during transition or update it to include `employee` |
| **Vouch onboarding gate** | Low–Medium | Users may be prompted to complete loop — intended for employees |
| **Onboarding overlay UI** | Low | May appear for converted users (improvement) |
| **Employer / Greenhouse** | **None** | Exact `employer` check unchanged |
| **Super admin** | **None** | Separate row, untouched |
| **Admin demote API** | Low | Still writes `'user'` on demote — would violate new CHECK unless admin tooling updated separately (out of scope for signup fix) |
| **Demo/simulation generators** | Low | Admin-only; still write `'user'` in some routes — sandbox/admin concern only |

**Corporate/hotel email account:** Treat as employee unless pre-flight shows `employer_accounts` or explicit employer onboarding artifacts. Email domain alone is **not** a role signal.

---

## H. Could the proposed Sprint 12.4 migration break existing users?

**Yes — if run as-is without prior backfill.**

`20260820180000_fix_production_signup_handle_new_user.sql` statement 2:

```sql
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('employee', 'employer', 'super_admin'));
```

With **18 rows** where `role = 'user'`, this **`ADD CONSTRAINT` will fail** (validation error). The migration aborts; signup trigger may be partially updated depending on transaction boundaries — run as a **single transaction**.

Sprint 12.4 also does **not** UPDATE existing rows. It is safe for the 1 employer and 1 super_admin row, but ** incompatible with 18 `user` rows**.

Additionally, after a successful Sprint 12.4 constraint change:
- New choose-role → `employee` would work (currently **broken** on production CHECK).
- Existing `'user'` rows would still violate CHECK if backfill skipped.

**Verdict:** Sprint 12.4 alone is **NOT safe to run** until legacy `'user'` rows are reconciled.

---

## I. Exact production migration SQL (recommended — DO NOT RUN from this audit)

Run in Supabase SQL Editor as **one transaction** after pre-flight (§18) returns no blockers.

```sql
BEGIN;

-- ── 0) Pre-flight assertions (abort if unexpected) ─────────────────────
DO $$
DECLARE
  bad_employer_users integer;
  bad_roles integer;
BEGIN
  SELECT count(*) INTO bad_employer_users
  FROM public.profiles p
  WHERE p.role = 'user'
    AND EXISTS (SELECT 1 FROM public.employer_accounts ea WHERE ea.user_id = p.id);

  IF bad_employer_users > 0 THEN
    RAISE EXCEPTION 'Abort: % user-role profile(s) have employer_accounts — investigate first', bad_employer_users;
  END IF;

  SELECT count(*) INTO bad_roles
  FROM public.profiles
  WHERE role IS NOT NULL
    AND lower(trim(role)) NOT IN ('user', 'worker', 'admin', 'superadmin', 'employee', 'employer', 'super_admin');

  IF bad_roles > 0 THEN
    RAISE EXCEPTION 'Abort: % profile(s) have unexpected role values — investigate first', bad_roles;
  END IF;
END $$;

-- ── 1) Normalize existing roles (founder first) ─────────────────────────
UPDATE public.profiles
SET role = 'super_admin'
WHERE lower(trim(coalesce(email, ''))) = 'founder@tryworkvouch.com';

UPDATE public.profiles
SET role = 'employee'
WHERE role IS NOT NULL
  AND lower(trim(role)) IN ('user', 'worker', 'admin', 'superadmin')
  AND lower(trim(coalesce(email, ''))) <> 'founder@tryworkvouch.com';

-- Do NOT touch role = 'employer' or 'super_admin' (except founder line above)

-- ── 2) RLS: ensure employees can read own profile (idempotent) ───────────
DROP POLICY IF EXISTS "Employees read own profile" ON public.profiles;
CREATE POLICY "Employees read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND role = 'employee');

-- Optional hardening: extend legacy worker policy (safe if both exist)
DROP POLICY IF EXISTS "Workers only" ON public.profiles;
CREATE POLICY "Workers only"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id AND role IN ('worker', 'user', 'employee'));

-- ── 3) CHECK constraint (canonical app roles) ───────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_valid_role;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (
    role IS NULL
    OR role IN ('employee', 'employer', 'super_admin')
  );

COMMENT ON COLUMN public.profiles.role IS
  'employee | employer | super_admin | NULL until /choose-role (non-founder). TEXT — not an enum.';

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- ── 4) Signup trigger (Sprint 12.4 — TEXT only, no user_role enum) ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_role text;
  v_founder_email constant text := 'founder@tryworkvouch.com';
BEGIN
  v_profile_role := CASE
    WHEN lower(trim(coalesce(NEW.email, ''))) = v_founder_email THEN 'super_admin'
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, full_name, email, industry, role)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    CASE
      WHEN NEW.raw_user_meta_data->>'industry' = 'law_enforcement' THEN 'law_enforcement'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'security' THEN 'security'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'hospitality' THEN 'hospitality'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'retail' THEN 'retail'::industry_type
      WHEN NEW.raw_user_meta_data->>'industry' = 'warehousing' THEN 'warehousing'::industry_type
      ELSE NULL
    END,
    v_profile_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = coalesce(nullif(excluded.full_name, ''), profiles.full_name),
    email = coalesce(excluded.email, profiles.email),
    industry = coalesce(excluded.industry, profiles.industry),
    role = coalesce(profiles.role, excluded.role);

  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (
        NEW.id,
        CASE
          WHEN v_profile_role = 'super_admin' THEN 'superadmin'
          WHEN NEW.raw_user_meta_data->>'user_type' = 'employer' THEN 'employer'
          ELSE 'user'
        END
      )
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user: skipped user_roles for % (%).', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMIT;
```

**Post-migration verification (read-only):**

```sql
SELECT role, count(*) FROM public.profiles GROUP BY role ORDER BY role;
-- Expect: employee=18, employer=1, super_admin=1 (or employee=17 if one user was reclassified manually)

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass AND contype = 'c';
```

---

## Signup trigger behavior summary

| Scenario | Trigger writes | Next step |
|----------|----------------|-----------|
| Normal signup | `profiles.role = NULL` | User lands on `/choose-role` |
| Chooses Employee | API writes `'employee'` | `/dashboard` |
| Chooses Employer | API writes `'employer'` | `/employer/onboarding/start` → `employer_accounts` |
| Founder email signup | `'super_admin'` | `/admin` (choose-role forbidden for founder) |

---

## Greenhouse employer onboarding — impact assessment

**Unaffected.**

Greenhouse Connect path:
1. Signup → `NULL` role → `/choose-role` → **Employer**
2. `POST /api/user/choose-role` → `profiles.role = 'employer'`
3. Employer onboarding → `employer_accounts` row
4. `requireEmployerIntegration()` → `hasRole("employer")` + account lookup

Converting legacy `user` → `employee`:
- Does not modify the 1 existing employer account.
- Does not grant integration access to employee accounts.
- Enables new employer signups (currently broken at Step 1 signup trigger + CHECK mismatch).

---

## 1. Every place that checks `profiles.role`

### Canonical normalization (preferred pattern)
- `lib/auth/resolveUserRole.ts` — single mapper
- `lib/auth/getRoleForRouteGuard.ts` — server guards
- `proxy.ts` — session refresh + redirects
- `lib/auth/getPostLoginRedirect.ts` — post-auth routing
- `lib/auth/roleRouting.ts` — zone blocking

### Exact string checks on `profiles.role` (no normalization)

| File | Check |
|------|-------|
| `lib/auth.ts` | `hasRole(role)` — **exact equality** |
| `lib/onboarding/needsVouchOnboarding.ts` | `role !== "employee"` |
| `lib/permissions/requireRole.ts` | Pushes raw `profile.role` into effective roles |
| `app/api/onboarding/complete/route.ts` | Writes `user` or `employer` from body |
| `app/api/resume/upload/route.ts` | Allows `user` or `employee` |
| `lib/actions/employer/getEmployerDashboardData.ts` | Allows `user` as employer-portal type label only |
| `app/employer/verified-workers/page.tsx` | Same legacy `UserRole` union |
| `lib/admin/requireSuperAdminApi.ts` | `super_admin` or `superadmin` |
| `lib/auth.ts` `isAdmin()` | `admin` or `superadmin` only (**not** `super_admin`) |
| `proxy.ts` simulation headers | `admin` or `superadmin` only |
| Multiple employer API routes | `hasRole("employer")` |

### RLS policies (migrations)
- `20250324000000`: `"Workers only"` → `role IN ('worker', 'user')`
- `20250394000000`: `"Employees read own profile"` → `role = 'employee'`
- Many admin policies: `role IN ('admin', 'superadmin')` — production uses `super_admin` on founder row; `isAdminRole()` handles both forms in app code, but **RLS may not grant admin reads for `super_admin`** (founder likely uses service role / admin client)

---

## 2–5. Role string usage summary

| Role | Meaning in codebase |
|------|---------------------|
| **`user`** | Legacy employee alias; admin-context “non-admin”; demo generators; onboarding/complete body |
| **`employee`** | Canonical worker role; choose-role output; vouch onboarding gate |
| **`employer`** | Canonical employer; integrations; exact match guards |
| **`super_admin`** | Canonical founder/platform admin on `profiles.role` |
| **`superadmin`** | Legacy variant (user_roles, RLS, some API routes) |
| **`admin`** | Legacy platform admin |
| **`worker`** | Legacy alias → employee in backfill migration |
| **`NULL`** | Pending choose-role |

---

## 6. `resolveUserRole` and auth/routing guards

```typescript
// lib/auth/resolveUserRole.ts
EMPLOYEE_ALIASES = ["user", "worker", "candidate", "member"]
ADMIN_ALIASES = ["super_admin", "superadmin"]
// NULL → pending; unknown strings → employee (fallback)
```

**Guard chain:** `proxy.ts` → `resolveUserRole` → `getRoleAccessRedirect` → `getRoleZoneRedirect`.

**Important split:**
- **Routing** uses normalized roles → `user` behaves as **employee**.
- **`hasRole()`** uses raw DB string → `hasRole("employee")` is **false** for `user`.

---

## 7. Choose-role and role-selection logic

- UI: `app/choose-role/ChooseRoleForm.tsx` — posts `employee` or `employer`.
- API: `app/api/user/choose-role/route.ts` — ALLOWED = `{employee, employer}`; blocks founder.
- **Production blocker today:** CHECK allows `user` but **not** `employee` → choose-role Employee path fails at DB update.

---

## 8. Signup trigger / `handle_new_user()` history

| Era | Default `profiles.role` |
|-----|-------------------------|
| Original schema / fix_signup_trigger_*.sql | `'user'` |
| `20260316120000_strict_roles_signup_and_backfill.sql` | `NULL` (founder → `super_admin`) + backfill |
| `20260820180000` (Sprint 12.4) | `NULL` (founder → `super_admin`), no enum |
| **Production (actual)** | Still on legacy `'user'` default + old trigger |

---

## 9–10. RLS and API authorization

- **Worker data access:** legacy policies keyed on `'user'` / `'worker'`.
- **Employer APIs:** `hasRole("employer")` + `employer_accounts`.
- **Super admin APIs:** `requireSuperAdminApi()` checks `super_admin` | `superadmin`.
- **Integrations:** `lib/employer/integrations/auth.ts` — employer only.

---

## 11. Dashboard routing by role

| Resolved role | Default home |
|---------------|--------------|
| pending | `/choose-role` |
| employee | `/dashboard` (or enterprise path if membership exists) |
| employer | `getEmployerHomePath()` or onboarding |
| admin | `/admin` |

---

## 12–15. Verification, trust, resume, coworker workflows

- **Verification / vouch APIs** (`/api/onboarding/vouch/*`): block only `employer`; **`user` allowed**.
- **Trust scoring:** user-id based, not role-string dependent.
- **Resume upload:** explicitly allows `user` and `employee`.
- **Coworker matching / invites:** not gated on literal role string; employer blocked from worker vouch loop only.
- **Employer verified-workers search** (`/api/employer/verified-workers`): OR filter includes `role.eq.user`.

---

## 16. Employer integrations / Greenhouse

- Requires **`profiles.role === 'employer'`** (exact) and **`employer_accounts`** row.
- **`user` and `employee` cannot access Connect APIs.**
- Sprint 12.5 reconciliation **enables** new employer signup; does not alter OAuth/Harvest code paths.

---

## 17. Admin / SuperAdmin access

- Founder production row: `super_admin` — matches `requireSuperAdminApi()` and `resolveUserRole` → admin.
- `lib/auth.ts` `isAdmin()` checks `admin` | `superadmin` but **not** `super_admin` — use `isAdminRole()` / `resolveUserRole` for guards (known legacy inconsistency; founder still works via `requireSuperAdminApi` and proxy admin zone).

---

## 18. Analytics, billing, permissions

- **Analytics capture:** stores `user_role` from profile read — normalized in reporting, not authorization.
- **Billing / paywall:** `userType === "employee" | "employer"` from resolved context.
- **Stripe checkout:** employee tier checks use resolved employer/employee paths.
- **`requireRole()` (enterprise RBAC):** includes raw `profile.role` in effective role list.

---

## 19. Migration history — origin of `user`

1. `supabase/add_role_column_to_profiles.sql` — adds `role TEXT DEFAULT 'user'`.
2. `supabase/schema.sql` — `user_role` enum includes `'user'`; trigger inserts `'user'`.
3. `20250395000000_profiles_role_constraint.sql` — CHECK includes `'user'` alongside `'employee'`.
4. `20260316120000` — **explicitly treats `'user'` as legacy employee** and backfills to `'employee'`.
5. Production never received `20260316120000` (still has 18× `user`).

**Intent:** `'user'` was always the pre-choose-role **worker default**, later renamed to `'employee'` in application vocabulary.

---

## 20. Generated Supabase types

- `types/database.ts`: `profiles.role: string | null` (no enum constraint in types).
- Legacy `UserRole` type: `'user' | 'employer' | 'admin' | 'superadmin'` — reflects old `user_roles` enum, **not** current canonical profiles contract.
- Tests (`tests/signup-role-schema.test.ts`) document canonical profile roles: `employee | employer | super_admin`.

---

## 18 existing production `profiles.role = 'user'` — inspection protocol

**This audit cannot query production.** Operator must run locally (results stay in Supabase — do not paste PII into tickets).

### Step 1 — Aggregate classification (no email exposed)

```sql
SELECT
  count(*) AS total_user_role,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.employer_accounts ea WHERE ea.user_id = p.id
  )) AS with_employer_account,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.jobs j WHERE j.user_id = p.id
  )) AS with_jobs,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.tenant_memberships tm WHERE tm.user_id = p.id
  )) AS with_tenant_membership,
  count(*) FILTER (WHERE p.worker_onboarding_loop_completed_at IS NOT NULL) AS vouch_loop_complete,
  count(*) FILTER (WHERE p.onboarding_completed IS TRUE) AS onboarding_flag_complete
FROM public.profiles p
WHERE p.role = 'user';
```

### Step 2 — Blockers (must be 0 before backfill)

```sql
SELECT p.id
FROM public.profiles p
WHERE p.role = 'user'
  AND EXISTS (SELECT 1 FROM public.employer_accounts ea WHERE ea.user_id = p.id);
```

### Step 3 — RLS policy inventory

```sql
SELECT polname, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass;
```

### Interpretation guidance

- **`with_employer_account > 0`:** Stop — manual review required; do not bulk convert.
- **Corporate/hotel email with no employer artifacts:** Safe to treat as **employee** (legacy default).
- **Accounts with jobs / vouch activity:** Strong confirmation they are **worker/employee** personas.

---

## Answers at a glance

| Question | Answer |
|----------|--------|
| **A. `user` ≡ `employee`?** | Yes for product behavior; minor exact-string edge cases |
| **B. Safe to convert?** | Yes, with pre-flight + RLS |
| **C. What is `user`?** | Legacy employee default, not a fourth role |
| **D. Keep `user` in CHECK?** | No (transitional at most) |
| **E. New signups NULL?** | Yes |
| **F. Trigger write?** | NULL (founder: `super_admin`) |
| **G. Break existing users?** | Low risk; vouch gate + RLS need attention |
| **H. Sprint 12.4 alone?** | **Will fail** on CHECK with 18 `user` rows |
| **I. Production migration?** | Combined backfill + constraint + trigger (§I) |

---

## Final recommendation label

# SAFE TO CONVERT `user` → `employee`

(with combined migration + pre-flight — **not** SAFE TO RUN Sprint 12.4 file in isolation)

---

*Audit complete. No repository code, migrations, or production data were modified during this sprint.*
