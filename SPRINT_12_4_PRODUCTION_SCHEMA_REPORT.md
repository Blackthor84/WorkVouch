# Sprint 12.4 — Production Signup Schema Reconciliation Report

**Operation Greenhouse — Sprint 12.4**  
**Date:** 2026-08-20

---

## Verdict

| Item | Result |
|------|--------|
| Actual role schema identified | ✅ `profiles.role` TEXT + CHECK (no `user_role` enum in migrations) |
| Sprint 12.3 migration failure explained | ✅ Referenced non-existent `public.user_role` enum |
| Corrected migration prepared | ✅ `20260820180000_fix_production_signup_handle_new_user.sql` (rewritten) |
| SignupClient metadata fix | ✅ Correct — keep `role` omitted |
| Production signup verified live | ⏳ Pending — run corrected SQL in Supabase |
| Ready for Greenhouse employer test | ⏳ After migration + signup + onboarding |

---

## 1. Actual production role schema (from migration history + code)

### Canonical role store: `public.profiles.role`

| Property | Value |
|----------|-------|
| Column type | **TEXT** (not enum) |
| First added | `20250376000000_identity_role_system.sql`, `20250602000000_employer_mode_profiles.sql` |
| CHECK constraint | `20260316120000_strict_roles_signup_and_backfill.sql` |
| Allowed values | `NULL`, `'employee'`, `'employer'`, `'super_admin'` |
| Default at signup | **NULL** (pending `/choose-role`) after fix |

### `public.user_role` enum

| Finding | Detail |
|---------|--------|
| Defined in | `supabase/schema.sql` only (reference/bootstrap) |
| Created in migrations | **Never** — zero `CREATE TYPE user_role` in `supabase/migrations/` |
| Production status | **Does not exist** (error `42704` on `ALTER TYPE public.user_role`) |

### `public.user_roles` table

| Finding | Detail |
|---------|--------|
| Created in migrations | **Never** (`CREATE TABLE user_roles` not in migrations) |
| Referenced by | Legacy RLS policies (admin checks) |
| App signup dependency | **None** — `lib/actions/create-profile.ts`: *"no user_roles write"* |
| Generated TypeScript types | **Not present** in `types/database.ts` |

### Application role resolution (TypeScript)

| Layer | Source | Values |
|-------|--------|--------|
| Routing | `lib/auth/resolveUserRole.ts` | `pending`, `employee`, `employer`, `admin` |
| DB storage | `profiles.role` TEXT | `NULL`, `employee`, `employer`, `super_admin` |
| SuperAdmin | `profiles.role = 'super_admin'` | Resolved to `admin` in app |
| Integrations | `hasRole("employer")` | Exact match on `profiles.role === 'employer'` |
| Choose role API | `POST /api/user/choose-role` | Writes `employee` or `employer` to `profiles` |

---

## 2. Root cause of signup failure

```
SignupClient.auth.signUp()
  → Supabase Auth INSERT auth.users
  → TRIGGER on_auth_user_created
  → handle_new_user()
  → ERROR (transaction rolled back)
  → UI: "Database error saving new user"
```

### Why the trigger fails (production)

Production trigger is a **legacy `handle_new_user`** (manual SQL or pre-12.4 function) that:

1. Reads signup metadata `role: "employee"` (before SignupClient fix), **or**
2. Inserts `profiles.role = 'user'` (legacy default), **or**
3. Runs `20260316120000` function body that does `'employer'::user_role` / `'user'::user_role` — **enum type missing**

Any of these cause PostgreSQL to raise inside the trigger → Supabase Auth surfaces generic DB error.

### Exact invalid values (most likely)

| Failure | Invalid operation |
|---------|-------------------|
| **A (most likely pre-fix client)** | `'employee'::user_role` — enum value does not exist |
| **B** | `profiles.role = 'user'` — violates CHECK (`employee\|employer\|super_admin\|NULL`) |
| **C (if 20260316120000 applied)** | Any `::user_role` cast — type `public.user_role` does not exist |

**Not RLS** — trigger uses `SECURITY DEFINER`.  
**Not Supabase Auth config** — failure is post-insert trigger.

---

## 3. Why Sprint 12.3 migration failed

File: `20260820180000_fix_production_signup_handle_new_user.sql` (original)

First statement:
```sql
ALTER TYPE public.user_role ADD VALUE 'superadmin';
```

**Error:** `42704: type "public.user_role" does not exist`

Sprint 12.3 incorrectly assumed `schema.sql` enum was applied to production. Migration history proves it was **never** migrated.

---

## 4. Corrected migration

**File:** `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql` (rewritten for Sprint 12.4)

### What it does

1. Idempotent `profiles_role_check` for TEXT roles (`NULL`, `employee`, `employer`, `super_admin`)
2. Drops `profiles.role` default (no auto `employee`/`user` at signup)
3. Replaces `handle_new_user()`:
   - Inserts `profiles` with `role = NULL` (or `super_admin` for `founder@tryworkvouch.com`)
   - **No `user_role` enum references**
   - Best-effort legacy `user_roles` insert wrapped in exception (never blocks signup)
4. Recreates `on_auth_user_created` trigger on `auth.users`

### What it does NOT do

- Create `user_role` enum
- Modify existing users or employer accounts
- Touch Trust, Verification, Billing, Greenhouse Connect
- Change SuperAdmin behavior (`super_admin` preserved for founder)

---

## 5. Code changes

| File | Change | Keep? |
|------|--------|-------|
| `app/(public)/signup/SignupClient.tsx` | Removed `role: "employee"` from auth metadata | ✅ **Yes — correct** |
| `supabase/migrations/20260820180000_...sql` | Rewritten (no enum) | ✅ Required |
| `tests/signup-role-schema.test.ts` | **Added** — documents role contract | ✅ |

No other metadata required by trigger. Optional: `full_name`, `username`, `coworker_invite_token`.

---

## 6. Tests

```
npm test
Test Files  38 passed (38)
Tests       349 passed | 1 skipped (350)
```

New: `tests/signup-role-schema.test.ts` (9 tests) — signup pending role, choose-role values, SuperAdmin mapping, employer gate.

Existing: `tests/auth-routing.test.ts` — routing integration.

---

## 7. Build result

```
npm run build
PASS
```

---

## 8. Exact SQL to run in Supabase (production)

**Run the complete file** (copy entire contents):

```
supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql
```

### Optional pre-flight verification (read-only)

Run these **before** the migration to confirm schema (safe SELECTs only):

```sql
-- A) profiles.role is TEXT
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role';

-- B) user_role enum absent (expect 0 rows)
SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typname = 'user_role';

-- C) Current trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- D) Current CHECK constraint
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_role_check';
```

Expected:
- A → `text`, default NULL or `'employee'` (migration drops default)
- B → **no rows**
- C → `on_auth_user_created`
- D → CHECK includes `employee`, `employer`, `super_admin`, or NULL

---

## 9. Is the migration safe for production?

| Criterion | Safe? |
|-----------|-------|
| Existing users | ✅ No UPDATE/DELETE on profiles |
| Existing employer accounts | ✅ Untouched |
| SuperAdmin founder | ✅ `founder@tryworkvouch.com` → `super_admin` preserved |
| Idempotent constraint | ✅ DROP IF EXISTS + re-add |
| Destructive DDL | ✅ None |
| Enum invention | ✅ None |
| Auth trigger | ✅ Replace function + recreate trigger only |

**Safe to run** on production Supabase SQL editor.

---

## 10. Next steps — Greenhouse employer test account

After migration + Vercel deploy (SignupClient fix):

1. **Incognito** → `https://tryworkvouch.com/signup`
2. Register dedicated email (not SuperAdmin)
3. Expect `/choose-role` or `/check-email` (not DB error)
4. Choose **Employer** → complete `/employer/onboarding/start`
5. Verify in Supabase:
   ```sql
   SELECT p.email, p.role, ea.id AS employer_account_id
   FROM profiles p
   LEFT JOIN employer_accounts ea ON ea.user_id = p.id
   WHERE p.email = 'your-test-email@example.com';
   ```
   Expected: `role = employer`, non-null `employer_account_id`
6. Open `/employer/integrations/connect` → Greenhouse visible
7. Proceed to Sprint 12.1 OAuth initiation (do not complete consent until ready)

---

## Summary table

| Question | Answer |
|----------|--------|
| Enum for profile roles? | **No** — TEXT + CHECK |
| Enum type name? | N/A — `user_role` enum **not in production** |
| Separate user_roles table? | Maybe (legacy) — **not required for signup** |
| Allowed profile roles | `NULL`, `employee`, `employer`, `super_admin` |
| Employer integrations require | `profiles.role = 'employer'` + `employer_accounts` row |
| SuperAdmin requires | `profiles.role = 'super_admin'` |
| Remove signup metadata role? | **Yes — keep removed** |

---

*Sprint 12.4 — schema reconciliation complete. Do not run Sprint 12.3 enum SQL; use rewritten migration file only.*
