# Sprint 12.4 — Final Production SQL Safety Report

**File inspected:** `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql`  
**Inspection date:** 2026-08-20  
**Production schema confirmed by operator:**
- `public.profiles.role` → **TEXT**
- `public.user_role` enum → **does not exist** (0 rows)

**No file modifications were made during this inspection.**

---

## Final verdict

# SAFE TO RUN

Against the confirmed live production schema (`profiles.role` TEXT, no `user_role` enum), this migration is compatible and contains no destructive data operations. Run the optional pre-flight query in §Pre-flight (recommended) before executing — if legacy `profiles.role` values exist outside the allowed set, statement 2 (`ADD CONSTRAINT`) will fail safely without deleting or updating existing rows.

---

## 1. Zero references to `user_role` enum (executable SQL)

| Pattern | Found in executable SQL? | Location |
|---------|--------------------------|----------|
| `public.user_role` | **No** | Comments only (lines 3, 10, 98) |
| `user_role` (enum) | **No** | Comments only; substring appears inside comment word `user_roles` |
| `ALTER TYPE` | **No** | — |
| `::user_role` | **No** | — |
| `CAST(... AS user_role)` | **No** | — |

**Note:** The migration references the **table** `public.user_roles` (lines 69–80), which is a separate object from the non-existent **`user_role` enum**. Inserts use plain TEXT literals (`'user'`, `'employer'`, `'superadmin'`) with no enum cast.

---

## 2. Compatibility with `profiles.role = TEXT`

| Element | TEXT-compatible? |
|---------|------------------|
| `v_profile_role text` variable | ✅ |
| INSERT `role` column values `NULL`, `'super_admin'` | ✅ TEXT literals |
| CHECK constraint on TEXT column | ✅ |
| `ALTER COLUMN role DROP DEFAULT` | ✅ valid on TEXT |
| No enum casts on `profiles.role` | ✅ |

The migration assumes and uses **TEXT semantics only** for `profiles.role`.

---

## 3. Intended role values

### On `profiles.role` (canonical)

| Value | When set |
|-------|----------|
| `NULL` | New signup (non-founder) — pending Choose Role |
| `super_admin` | New signup where email = `founder@tryworkvouch.com` |
| `employee` | **Not set by this migration** — set later by `/api/user/choose-role` |
| `employer` | **Not set by this migration** — set later by `/api/user/choose-role` |

CHECK constraint (lines 15–19) enforces exactly:

```sql
role IS NULL OR role IN ('employee', 'employer', 'super_admin')
```

### On legacy `user_roles` (optional, best-effort)

If table exists: `'user'`, `'employer'`, or `'superadmin'` as TEXT — **not** written to `profiles.role`.

---

## 4. What the migration does NOT do

| Prohibited action | Present? |
|-------------------|----------|
| DELETE users | ❌ No |
| UPDATE existing profiles | ❌ No |
| ALTER employer_accounts | ❌ No |
| Trust / Verification / Billing / Greenhouse Connect | ❌ No |
| DROP TABLE | ❌ No |
| DROP COLUMN | ❌ No |
| RLS policy changes | ❌ No |
| Change existing role values | ❌ No |

**Caveat (non-destructive validation):** `ADD CONSTRAINT profiles_role_check` validates **all existing rows**. If any row has a role outside `NULL | employee | employer | super_admin`, that statement **fails** (migration stops; no row updates). This is a safety gate, not a data mutation.

---

## 5. `handle_new_user()` and trigger inspection

### Function behavior (lines 28–89)

1. Declares `v_profile_role text` — TEXT, not enum.
2. Sets `v_profile_role`:
   - `'super_admin'` if email matches `founder@tryworkvouch.com`
   - `NULL` otherwise
3. **Ignores** auth metadata `role` (e.g. former `"employee"`) — fixes signup root cause.
4. INSERT into `profiles` with `role = v_profile_role` (NULL for normal signups).
5. ON CONFLICT: preserves existing `profiles.role` via `coalesce(profiles.role, excluded.role)`.
6. Optional `user_roles` insert:
   - Only if table exists
   - Wrapped in `EXCEPTION WHEN OTHERS` — **never aborts signup**
7. `SECURITY DEFINER` + `search_path = public` — standard trigger pattern.

### Trigger (lines 91–95)

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

- Replaces trigger on **future** `auth.users` inserts only.
- Does not retroactively process existing users.

### External dependency (pre-existing, not introduced here)

Industry mapping uses `::industry_type` casts (lines 49–54). Production must already have `industry_type` enum if industry metadata is sent at signup. Absence of industry metadata yields `NULL` — signup still succeeds.

---

## 6. New signup without role at `auth.users` insertion

**Confirmed.**

For a non-founder signup after this migration:

| Step | `profiles.role` |
|------|-----------------|
| `auth.users` INSERT | (no profile yet) |
| Trigger runs | INSERT profile with `role = NULL` |
| Auth completes | User exists with pending role |

No role is required or written (except NULL) during auth insertion. This matches Choose Role design.

---

## 7. Choose Role → `employer` afterward

**Confirmed (application flow, unchanged by migration).**

After signup with `profiles.role = NULL`:

1. `resolveUserRole` → `pending` → redirect `/choose-role`
2. User selects Employer → `POST /api/user/choose-role` with `{ role: "employer" }`
3. API writes `profiles.role = 'employer'` (TEXT) — allowed by CHECK
4. Employer onboarding creates `employer_accounts`, etc.

Migration does not block or alter this path.

---

## 8. Safety against confirmed production schema

| Confirmed fact | Migration alignment |
|----------------|---------------------|
| `profiles.role` is TEXT | ✅ Uses TEXT literals and TEXT variable |
| `user_role` enum absent | ✅ No enum references in executable SQL |
| Signup failing on trigger | ✅ New trigger sets NULL; ignores bad metadata |
| SuperAdmin founder | ✅ Only `founder@tryworkvouch.com` gets `super_admin` |

---

## 9. Exact SQL statements that modify production schema/objects

| # | Statement | Modifies | Existing data? |
|---|-----------|----------|----------------|
| 1 | `ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check` | Constraint definition | No |
| 2 | `ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (...)` | Constraint definition | Validates existing rows; does not UPDATE |
| 3 | `COMMENT ON COLUMN public.profiles.role IS ...` | Metadata only | No |
| 4 | `ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT` | Column default only | No existing row values changed |
| 5 | `CREATE OR REPLACE FUNCTION public.handle_new_user()` | Function definition | No |
| 6 | `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users` | Trigger definition | No |
| 7 | `CREATE TRIGGER on_auth_user_created ...` | Trigger definition | No |
| 8 | `COMMENT ON FUNCTION public.handle_new_user() IS ...` | Metadata only | No |

**Runtime data writes (only on future signups via trigger):**

| Operation | When |
|-----------|------|
| INSERT into `profiles` | Each new `auth.users` row |
| INSERT into `user_roles` (optional) | Each new signup, if table exists; failures logged only |

No `UPDATE`, `DELETE`, or `TRUNCATE` on existing production data in this migration file.

---

## Pre-flight (recommended, read-only)

Run before the migration in Supabase SQL Editor:

```sql
-- Must return 0 rows; otherwise ADD CONSTRAINT (statement 2) will fail
SELECT DISTINCT role
FROM public.profiles
WHERE role IS NOT NULL
  AND role NOT IN ('employee', 'employer', 'super_admin');
```

If rows appear (e.g. legacy `'admin'`, `'user'`, `'superadmin'`), normalize those rows in a **separate, reviewed migration** before applying this file — or expect statement 2 to abort.

---

## Summary checklist

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Zero enum `user_role` references in executable SQL | ✅ Pass |
| 2 | Works with TEXT `profiles.role` | ✅ Pass |
| 3 | Role values NULL / employee / employer / super_admin only on profiles | ✅ Pass |
| 4 | No prohibited side effects | ✅ Pass |
| 5 | Trigger/function reviewed | ✅ Pass |
| 6 | Signup without role at auth insert | ✅ Pass |
| 7 | Choose Role can assign employer | ✅ Pass |
| 8 | Safe for confirmed production schema | ✅ Pass |
| 9 | Modifying statements enumerated | ✅ Pass |
| 10 | No file changes during inspection | ✅ Pass |

---

## Operator instruction

1. Run pre-flight `SELECT DISTINCT role` (optional but recommended).
2. Copy and execute **the entire file**:
   `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql`
3. Deploy app with SignupClient metadata fix (no `role` in signup metadata).
4. Test new signup → Choose Role → Employer → onboarding.

---

*Inspection complete. Migration file unchanged.*
