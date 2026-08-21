# Employer Test Account Report — Sprint 12.2

**Operation Greenhouse — Sprint 12.2**  
**Date:** 2026-08-20  
**Branch:** `main` (post-merge `feature/greenhouse-platform`)

---

## Mission

Determine the smallest safe path to a **dedicated production employer account** that can initiate (but not necessarily complete) the first real Greenhouse sandbox OAuth test.

---

## Verdict

| Question | Answer |
|----------|--------|
| **Code changed?** | **No** — existing UI flow is sufficient |
| **Recommended method** | **Manual production signup → choose employer → complete onboarding** |
| **Dedicated test account exists today?** | **No** — must be created by operator |
| **SuperAdmin usable?** | **No** — by design |
| **Production callback working?** | **Yes** — `400 {"error":"code and state are required"}` |
| **Can OAuth be initiated after account creation?** | **Yes** (expected) — pending account creation + Vercel Greenhouse env vars |

---

## How employer accounts are created

### Supported production path

```
/signup
  → auth.users + profiles (role = NULL)
/choose-role (Employer)
  → POST /api/user/choose-role → profiles.role = 'employer'
/employer/onboarding/start
  → POST /api/employer/onboarding/create
  → organizations + tenant_memberships + employer_accounts + employer_users
/employer/dashboard
```

**Implementation:** `app/api/employer/onboarding/create/route.ts`

### Unsupported shortcuts (do not use for Greenhouse test)

- SQL role scripts (`ASSIGN_EMPLOYER_ROLE.sql`) — role only, no `employer_accounts`
- Admin role API — role only
- Sandbox signup (`/signup/employer`) — not production data model
- Admin demo generator — sandbox, incomplete stack

---

## Required role

| Field | Required value |
|-------|----------------|
| `profiles.role` | **`employer`** (exact string) |
| SuperAdmin / admin | **Must not** be used |

`hasRole("employer")` and `requireEmployerIntegration()` use **exact equality** — `super_admin` does not qualify.

---

## Required employer / company records

| Table | Purpose | Created by |
|-------|---------|------------|
| `profiles` | `role = employer` | choose-role + onboarding |
| `employer_accounts` | **`employerAccountId`**, company name | onboarding create |
| `organizations` | Org shell | onboarding create |
| `tenant_memberships` | `enterprise_owner` link | onboarding create |
| `employer_users` | `org_admin` (optional) | onboarding create (best-effort) |

**Minimum for OAuth start API:** `profiles.role = employer` + one `employer_accounts` row.

**Minimum for portal routing:** full onboarding stack (org + membership + employer_accounts).

---

## Why SuperAdmin cannot test Connect

| Check | SuperAdmin result |
|-------|-------------------|
| `/employer/integrations/connect` UI layout | Redirect to `/dashboard` (`hasRole("employer")` fails) |
| `POST /api/employer/integrations/connect/greenhouse` | **403 Forbidden** |
| `/api/user/choose-role` → employer | **403 Forbidden** (founder/admin blocked) |
| Post-login default | `/admin` |

**Action:** Create a separate non-admin user. Do not modify SuperAdmin permissions.

---

## Exact manual steps (production)

1. **Incognito / fresh profile** — avoid SuperAdmin session.
2. **Sign up:** `https://tryworkvouch.com/signup` with dedicated email (e.g. `greenhouse-sandbox-test@yourdomain.com`).
3. **Verify email** if prompted.
4. **Choose role:** `https://tryworkvouch.com/choose-role` → **Employer**.
5. **Onboard:** `https://tryworkvouch.com/employer/onboarding/start`
   - Org name: `WorkVouch Greenhouse Sandbox Test` (or similar)
   - Industry + size: any valid values
   - Primary admin email: **must match signup email**
6. **Confirm dashboard:** `/employer/dashboard?welcome=1`
7. **Open integrations:** `/employer/integrations`
8. **Open connect wizard:** `/employer/integrations/connect`
9. **OAuth start test:** Click **Continue to Greenhouse →**
   - **Expected:** redirect to `https://auth.greenhouse.io/authorize?...`
   - **Do not** approve consent in this sprint task

---

## Post-creation verification checklist

| # | Test | Expected | Sprint 12.2 status |
|---|------|----------|-------------------|
| 1 | Sign in as test employer | Session active | ⏳ Pending manual account |
| 2 | Reach `/employer/integrations/` | Connect dashboard loads | ⏳ Pending manual account |
| 3 | Reach `/employer/integrations/connect` | Wizard loads | ⏳ Pending manual account |
| 4 | See Greenhouse option | Provider card visible | ⏳ Pending manual account |
| 5 | Pass ownership checks | No 403/404 from `/api/employer/integrations` | ⏳ Pending manual account |
| 6 | Initiate OAuth start route | Redirect to `auth.greenhouse.io/authorize` | ⏳ Pending manual account + env vars |
| 7 | Complete OAuth consent | Token exchange + connection row | **Out of scope** (Sprint 12.1) |

---

## Infrastructure preconditions (already verified / required)

| Item | Status |
|------|--------|
| Callback route deployed | ✅ `400` on missing `code`/`state` |
| Registered redirect URI host | ✅ `tryworkvouch.com` matches OAuth start `${origin}/callback` |
| `GREENHOUSE_CLIENT_ID` / `SECRET` on Vercel | Assumed configured (not verified in this audit) |
| `ATS_ENCRYPTION_KEY` on Vercel | Required for token persistence after OAuth completes |
| Greenhouse OAuth code modified | ✅ Not modified (per sprint constraint) |

---

## Existing accounts reviewed

| Account type | Reusable? |
|--------------|-----------|
| SuperAdmin | ❌ No |
| Sandbox lab employers | ❌ No (separate model) |
| Admin demo generate | ❌ No |
| Dedicated production test employer | ❌ **Does not exist yet** |

---

## Remaining blockers before first **full** sandbox OAuth test

1. **Create dedicated employer account** (manual steps above) — **operator action**
2. **Confirm Vercel production secrets** — `GREENHOUSE_CLIENT_ID`, `GREENHOUSE_CLIENT_SECRET`, `ATS_ENCRYPTION_KEY`
3. **Greenhouse sandbox Site Admin** — authorizing user must have permissions for Harvest list endpoints after connect
4. **Sprint 12.1 live validation** — Harvest reads, pagination, sync, health (after OAuth completes)

---

## Classification summary

| Area | Classification |
|------|----------------|
| Employer creation flow audit | ✅ VERIFIED (code review) |
| Production callback route | ✅ VERIFIED IN REAL SANDBOX |
| Dedicated test employer account | ⏳ NOT TESTABLE YET (not created) |
| Integrations UI access (employer) | ⏳ NOT TESTABLE YET (pending account) |
| Greenhouse OAuth initiation | ⏳ NOT TESTABLE YET (pending account) |
| Code changes required | ✅ None |

---

## Final recommendation

**Stop after audit — no code changes.**

Create one dedicated production employer through the existing signup flow, then run the OAuth **start** smoke test (redirect to Greenhouse authorize URL only). Proceed to Sprint 12.1 live OAuth completion once the account exists and Vercel Greenhouse credentials are confirmed.

Full audit detail: `docs/audits/employer-test-account.md`
