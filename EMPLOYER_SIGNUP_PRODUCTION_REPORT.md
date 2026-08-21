# Employer Signup Production Report — Sprint 12.3

**Operation Greenhouse — Sprint 12.3**  
**Date:** 2026-08-20

---

## Verdict

| Item | Status |
|------|--------|
| **Root cause identified** | ✅ Yes — `handle_new_user` trigger / enum mismatch |
| **Code fix prepared** | ✅ Yes |
| **Migration required** | ✅ Yes — must be applied on production Supabase |
| **Production signup verified** | ⏳ Pending migration + deploy |
| **Ready for Greenhouse OAuth test** | ⏳ Blocked until signup + employer onboarding succeed |

---

## Exact root cause

**Database trigger failure during Supabase Auth signup** (`auth.users` AFTER INSERT trigger `on_auth_user_created` → `public.handle_new_user()`).

The signup UI calls `supabase.auth.signUp()` directly. Supabase Auth inserts into `auth.users`, then the trigger creates `profiles` and `user_roles`. When the trigger raises an exception, Supabase Auth rolls back the user insert and returns the generic message:

> **Database error saving new user**

### Underlying error (inferred from code — not RLS)

1. **SignupClient** previously sent auth metadata `role: "employee"`.
2. Production likely runs a **legacy `handle_new_user`** (from manual SQL or pre-strict-role trigger) that does:
   ```sql
   v_role := NEW.raw_user_meta_data->>'role';  -- 'employee'
   INSERT INTO user_roles (user_id, role) VALUES (NEW.id, v_role::user_role);
   ```
3. **`user_role` enum** does not include `'employee'` → PostgreSQL error:
   `invalid input value for enum user_role: "employee"`

**Alternate failure mode:** trigger sets `profiles.role = 'user'`, but `profiles_role_check` (after strict-roles migration) only allows `employee | employer | super_admin | NULL` → CHECK constraint violation.

**Classification:** Database trigger + schema mismatch (not application API, not Supabase Auth config, not Greenhouse).

---

## Files changed

| File | Change |
|------|--------|
| `supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql` | **Added** — replaces `handle_new_user`, recreates trigger |
| `app/(public)/signup/SignupClient.tsx` | **Modified** — removed `role: "employee"` from signup metadata |

**Not changed:** Greenhouse OAuth, Harvest V3, callback, Trust, Verification, Billing, RLS policies, admin permissions.

---

## Migration required

Apply on **production Supabase** (project `ypztnnruoagrpkeztuyn`):

```
supabase/migrations/20260820180000_fix_production_signup_handle_new_user.sql
```

**Steps:**
1. Supabase Dashboard → SQL Editor
2. Paste and run the migration file
3. Confirm: `SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';`
4. Deploy Vercel app (SignupClient metadata fix)
5. Retry signup with dedicated test email

---

## RLS involved?

**No** — trigger uses `SECURITY DEFINER` and bypasses RLS for profile/user_roles inserts. Failure is constraint/enum violation inside the trigger, not policy denial.

---

## Supabase Auth involved?

**Yes** — failure surfaces through `auth.signUp()`, but the bug is in the **post-insert database trigger**, not Auth configuration.

---

## Existing users affected?

**No** — fix only affects new signups. No existing users modified or deleted.

---

## Test account creation result

| Test | Result |
|------|--------|
| Reproduce failure on production (pre-fix) | ✅ Confirmed by operator report |
| Automated signup test (local) | ⏳ N/A — requires production Supabase + migration |
| New employer account created (post-fix) | ⏳ **Pending** migration apply + manual signup |

**Recommended test email:** dedicated address e.g. `greenhouse-sandbox-test@yourdomain.com` (do not reuse SuperAdmin email).

---

## Employer onboarding result

⏳ **Not testable** until signup succeeds.

Expected path after fix:
`/signup` → `/choose-role` (Employer) → `/employer/onboarding/start` → `/employer/dashboard`

---

## Integration routes result

| Route | Post-fix expected |
|-------|-----------------|
| `/employer/integrations` | ⏳ Pending test account |
| `/employer/integrations/connect` | ⏳ Pending test account |
| Greenhouse button visible | ⏳ Pending test account |
| OAuth initiation | ⏳ Out of scope (Sprint 12.1) |

---

## Automated test results

```
npm test
Test Files  37 passed (37)
Tests       342 passed | 1 skipped (343)
```

---

## Build result

```
npm run build
PASS (verified after SignupClient change)
```

---

## Ready for first real Greenhouse sandbox OAuth?

### **NOT YET**

| Blocker | Action |
|---------|--------|
| Production signup broken | Apply migration `20260820180000_fix_production_signup_handle_new_user.sql` |
| App metadata fix not deployed | Deploy `SignupClient.tsx` change to Vercel |
| No dedicated employer test account | Create via fixed signup flow (Sprint 12.2 steps) |
| Live OAuth not executed | Sprint 12.1 after account exists |

### After migration + deploy + employer onboarding:

Expected status → **READY to initiate OAuth** (redirect to `auth.greenhouse.io/authorize`, do not complete consent until Sprint 12.1).

---

## Operator next steps (in order)

1. **Run migration** on production Supabase SQL editor
2. **Deploy** latest `main` to Vercel
3. **Sign up** new employer test account (incognito, not SuperAdmin)
4. **Complete onboarding** per `docs/audits/employer-test-account.md`
5. **Verify** `/employer/integrations/connect` loads Greenhouse wizard
6. **Proceed** to Sprint 12.1 live OAuth (OAuth start only, then full sandbox validation)

---

*No passwords, service-role keys, or Greenhouse secrets included in this report.*
