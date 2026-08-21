# Production Employer Signup Audit — Sprint 12.3

**Operation Greenhouse — Sprint 12.3**  
**Date:** 2026-08-20  
**Symptom:** `https://tryworkvouch.com/signup` → **"Database error saving new user"** at Step 1 (before role selection)

---

## Executive summary

Production signup fails during **Supabase Auth user creation** because the **`handle_new_user` database trigger** (runs after `auth.users` INSERT) throws an error. The UI message is generic; the failure is **not** in Next.js API routes or employer onboarding.

**Root cause (code analysis):** Legacy `handle_new_user` implementations read `raw_user_meta_data.role = "employee"` from signup metadata and attempt **`'employee'::user_role`**, but the `user_role` enum only allows `user | employer | admin | superadmin`. Alternatively, triggers that write `profiles.role = 'user'` violate `profiles_role_check` (`employee | employer | super_admin | NULL`).

**Remediation:**
1. Apply migration `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql` on production Supabase.
2. Deploy app change removing `role` from signup metadata (`SignupClient.tsx`).

---

## Signup transaction map

| Step | Component | What runs |
|------|-----------|-----------|
| 1 | UI | `app/(public)/signup/SignupClient.tsx` |
| 2 | Client auth | `supabaseBrowser.auth.signUp()` → Supabase Auth REST API |
| 3 | Supabase Auth | INSERT into `auth.users` |
| 4 | DB trigger | `on_auth_user_created` → `public.handle_new_user()` |
| 5 | Trigger writes | `public.profiles`, `public.user_roles` |
| 6 | Post-signup (if session) | `GET /api/auth/post-login-redirect` → `/choose-role` |

**Not involved at signup:** employer onboarding, `employer_accounts`, `organizations`, Greenhouse OAuth, Next.js `/api/auth/signup` (returns 501 — unused).

---

## Frontend signup route

| Item | Value |
|------|-------|
| Page | `app/(public)/signup/page.tsx` |
| Client | `app/(public)/signup/SignupClient.tsx` |
| Auth call | Direct Supabase browser client (`lib/supabase/browser.ts`) |
| Legacy API | `app/api/auth/signup/route.ts` — **not used** |

### Metadata sent at signup (before fix)

```typescript
data: {
  full_name: ...,
  role: "employee",  // ← PROBLEM: legacy triggers cast to user_role enum
  username: ...,
}
```

### Metadata after fix

```typescript
data: {
  full_name: ...,
  // role omitted — profiles.role stays NULL until /choose-role
  username: ...,
}
```

---

## Database objects involved at signup

| Object | Operation |
|--------|-----------|
| `auth.users` | INSERT (Supabase Auth) |
| `public.profiles` | INSERT via trigger |
| `public.user_roles` | INSERT via trigger |

**Not written at signup:** `employer_accounts`, `organizations`, `tenant_memberships` (created later at `/api/employer/onboarding/create`).

---

## Trigger function history

| Migration / file | Behavior |
|------------------|----------|
| `supabase/schema.sql` | Profile + `user_roles` with `'user'` enum |
| `supabase/fix_signup_trigger_SIMPLE.sql` | Reads metadata `role` → `'employee'` → **`'employee'::user_role` FAILS** |
| `20260316120000_strict_roles_signup_and_backfill.sql` | Sets `profiles.role = NULL`; fixes intent but **does not recreate trigger** and `user_roles` COALESCE may still type-mismatch |
| **`20260820180000_fix_production_signup_handle_new_user.sql`** | **Canonical fix** — NULL profile role, valid enum for `user_roles`, recreates trigger |

---

## RLS involvement

| Table | RLS | Trigger impact |
|-------|-----|----------------|
| `profiles` | Enabled | `handle_new_user` uses `SECURITY DEFINER` — bypasses RLS |
| `user_roles` | Enabled | Same — bypasses RLS |

**Conclusion:** Failure is **not RLS blocking** the trigger; it is **constraint / enum violation inside the trigger**.

---

## profiles.role constraint (production expected)

From `20260316120000_strict_roles_signup_and_backfill.sql`:

```sql
CHECK (role IS NULL OR role IN ('employee', 'employer', 'super_admin'))
```

Legacy trigger value `'user'` → **CHECK violation**.  
Metadata `'employee'` → valid for `profiles` but invalid for `user_role` enum.

---

## user_role enum (production expected)

```sql
'user' | 'employer' | 'admin' | 'superadmin'
```

Metadata / profile value `'employee'` → **invalid enum cast**.

---

## Failure phase classification

| Phase | Fails? | Evidence |
|-------|--------|----------|
| A. Supabase Auth `auth.users` INSERT | **Yes** (rolled back) | Generic Supabase message = trigger failure |
| B. Profile creation in trigger | **Likely** | Constraint or insert error |
| C. `user_roles` insert in trigger | **Likely** | `'employee'::user_role` invalid |
| D. Organization creation | No | Runs at onboarding, not signup |
| E. Employer account creation | No | Runs at onboarding, not signup |

---

## Environment checks

| Check | Result |
|-------|--------|
| Production Supabase URL | `https://ypztnnruoagrpkeztuyn.supabase.co` (via `/api/env-check`) |
| Greenhouse callback | ✅ Working (separate issue) |
| `maintenance_mode.block_signups` | Stored in `system_settings` — **not enforced** on client signup path |
| Missing `NEXT_PUBLIC_SUPABASE_*` | Would fail differently (client error, not DB error) |

---

## Required migration

**Apply on production Supabase SQL editor or migration pipeline:**

```
supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql
```

This migration:
1. Ensures `superadmin` exists on `user_role` enum
2. Replaces `handle_new_user()` with NULL pending role for non-founder
3. Maps `user_roles` to valid enum values only
4. Recreates `on_auth_user_created` trigger on `auth.users`

**Also verify applied (if not already):** `20260316120000_strict_roles_signup_and_backfill.sql`

---

## Application code change

| File | Change |
|------|--------|
| `app/(public)/signup/SignupClient.tsx` | Remove `role: "employee"` from signup metadata |

Deploy to Vercel after migration is applied.

---

## Post-fix validation checklist

1. Apply migration on production Supabase
2. Deploy app with SignupClient fix
3. Incognito → `https://tryworkvouch.com/signup`
4. Register dedicated test email
5. Confirm redirect to `/choose-role` or `/check-email`
6. Choose **Employer** → complete onboarding
7. Verify Supabase rows: `profiles.role = employer`, `employer_accounts` exists
8. Open `/employer/integrations/connect` — Greenhouse visible
9. Do **not** complete OAuth yet

---

## Security notes

- No RLS bypass added
- No admin backdoor
- No credential exposure
- Trigger remains `SECURITY DEFINER` with `search_path = public` (existing pattern, hardened)

---

## Related files

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql` | Fix migration |
| `supabase/migrations/20260316120000_strict_roles_signup_and_backfill.sql` | Role constraint + prior trigger |
| `supabase/DIAGNOSE_SIGNUP_ERROR.sql` | Manual diagnostics |
| `docs/audits/employer-test-account.md` | Employer test account steps (Sprint 12.2) |
