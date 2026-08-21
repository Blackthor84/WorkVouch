# Employer Test Account Audit — Greenhouse Sandbox OAuth

**Operation Greenhouse — Sprint 12.2**  
**Date:** 2026-08-20  
**Purpose:** Identify the smallest safe path to a dedicated production employer account for the first real Greenhouse sandbox OAuth test.

---

## Executive summary

WorkVouch already supports **self-serve employer registration** through the production UI. No code changes are required.

A valid test employer must:

1. Sign up as a **new user** (not SuperAdmin).
2. Choose **`employer`** at `/choose-role`.
3. Complete **`/employer/onboarding/start`** (creates `employer_accounts` + org stack).

**SuperAdmin cannot be used** — integrations require `profiles.role === 'employer'` exactly, and admin accounts are routed to `/admin`.

---

## 1. How employer accounts are normally created

### Canonical production path (recommended)

| Step | Route / API | What happens |
|------|-------------|--------------|
| 1 | `/signup` | Supabase auth user created; `profiles` row with `role = NULL` (pending) |
| 2 | Email verification | Supabase auth (if enabled in project settings) |
| 3 | `/choose-role` → **Employer** | `POST /api/user/choose-role` → `profiles.role = 'employer'`, `plan = 'free'` |
| 4 | `/employer/onboarding/start` | Multi-step wizard collects org name, industry, size, admin email |
| 5 | Submit wizard | `POST /api/employer/onboarding/create` creates full employer stack |
| 6 | Redirect | `/employer/dashboard?welcome=1` |

**Key implementation files:**

- Signup UI: `app/(public)/signup/SignupClient.tsx` (always sets metadata `role: "employee"` at signup — role is **not** employer until choose-role)
- Role selection: `app/choose-role/ChooseRoleForm.tsx`, `app/api/user/choose-role/route.ts`
- Onboarding UI: `app/employer/onboarding/EmployerOnboardingClient.tsx`
- Onboarding API: `app/api/employer/onboarding/create/route.ts`
- Post-login routing: `lib/auth/getPostLoginRedirect.ts`, `lib/auth/employerRouting.ts`

### What onboarding create inserts

`POST /api/employer/onboarding/create` (in order, with rollback on failure):

| Table | Key fields | Purpose |
|-------|------------|---------|
| `organizations` | `name`, `slug`, `billing_tier`, `plan_type`, `mode: "production"` | Enterprise org shell |
| `tenant_memberships` | `user_id`, `organization_id`, `role: "enterprise_owner"` | Org ownership |
| `profiles` | `role: "employer"`, `plan: "free"` | Platform role |
| `employer_accounts` | `user_id`, `company_name`, `industry_type`, `plan_tier: "free"` | **`employerAccountId`** source |
| `employer_users` | `organization_id`, `profile_id`, `role: "org_admin"` | Enterprise RBAC (best-effort) |

**Note:** Onboarding does not set `employer_accounts.organization_id`. Connect only needs `employer_accounts.id` — this gap does not block Greenhouse OAuth.

---

## 2. How a user becomes an employer

| Concept | Storage | Value for test account |
|---------|---------|------------------------|
| Platform role | `profiles.role` | Must be exactly **`employer`** |
| Resolved role | `resolveUserRole()` in `lib/auth/resolveUserRole.ts` | `super_admin` → **`admin`**, not employer |
| Role guard (UI) | `hasRole("employer")` in `lib/auth.ts` | Exact string match on `profiles.role` |
| Role guard (API) | `requireEmployerIntegration()` in `lib/employer/integrations/auth.ts` | 403 if not employer; 404 if no `employer_accounts` row |

**Forbidden for test account:**

- `profiles.role = 'super_admin'` or `'admin'` — cannot access employer integrations UI or API
- Founder email — blocked from `/api/user/choose-role` (403)

---

## 3. How `employerAccountId` / company ownership is established

```typescript
// lib/employer/integrations/auth.ts
admin.from("employer_accounts")
  .select("id, company_name")
  .eq("user_id", user.id)
  .single()
// → ctx.employerAccountId = employerAccount.id
```

- **One `employer_accounts` row per user** (`user_id` UNIQUE)
- Used as `employer_account_id` on `connect_connections`, OAuth state, imports, events
- Company display name: `employer_accounts.company_name` (set from onboarding org name)

Ownership model:

| Layer | Table | Role / link |
|-------|-------|-------------|
| Platform | `profiles` | `role = employer` |
| Employer identity | `employer_accounts` | `user_id → profiles.id` |
| Org | `organizations` + `tenant_memberships` | `enterprise_owner` |

There is **no `companies` table** — company name lives on `employer_accounts.company_name`.

---

## 4. Database records required for a functional employer account

### Minimum for Greenhouse OAuth **start** (API)

| Record | Required |
|--------|----------|
| `auth.users` | Yes |
| `profiles` with `role = 'employer'` | Yes |
| `employer_accounts` with `user_id = profiles.id` | Yes |

### Minimum for full employer portal routing

| Record | Required |
|--------|----------|
| Above | Yes |
| `organizations` | Yes (created by onboarding) |
| `tenant_memberships` (`enterprise_owner`) | Yes (created by onboarding) |

Without org + membership, `getEmployerHomePath()` keeps redirecting to `/employer/onboarding/start` even if role is set.

### Not required for Connect / Greenhouse OAuth

| Record | Notes |
|--------|-------|
| `employer_legal_acceptance` | Required for candidate **search**, not integrations |
| `connect_connections` | Created **after** OAuth completes |
| Stripe subscription | Not required for connect wizard |

---

## 5. Does Sign Up support employer registration?

**Yes, indirectly.**

- `/signup` creates a pending user (`role = NULL`).
- User must complete `/choose-role` → **Employer**.
- User must complete `/employer/onboarding/start`.

Signup does **not** skip choose-role or onboarding. The `company` field on signup is metadata only and does not create `employer_accounts`.

---

## 6. Existing admin / company creation workflows

| Workflow | Suitable for production test? | Notes |
|----------|-------------------------------|-------|
| **`POST /api/employer/onboarding/create`** (via UI) | **Yes — use this** | Full stack |
| `POST /api/user/choose-role` alone | **No** | Role only; integrations API returns 404 |
| `POST /api/admin/users/role` | **No** | Role only |
| `ASSIGN_EMPLOYER_ROLE.sql` / `FIX_MY_EMPLOYER_ROLE.sql` | **No** | Role only; misleading for Connect |
| `POST /api/admin/demo/generate` | **No** | Sandbox + superadmin; partial stack |
| `/signup/employer` (sandbox lab) | **No** | Writes to `sandbox_employers`; requires sandbox session |
| `POST /api/employers/request-access` | **No** | Marketing lead only |

**No admin API creates the full production employer stack in one call.**

---

## 7. Role and metadata for a Greenhouse test employer

| Field | Recommended value |
|-------|-------------------|
| Email | Dedicated address you control (e.g. `greenhouse-test@yourdomain.com`) — **not** SuperAdmin email |
| `profiles.role` | `employer` |
| `profiles.plan` | `free` (set by choose-role / onboarding) |
| `employer_accounts.company_name` | e.g. `WorkVouch Greenhouse Sandbox Test` |
| `employer_accounts.industry_type` | Any valid onboarding industry (e.g. `corporate`) |
| `employer_accounts.plan_tier` | `free` |
| SuperAdmin / admin | **Must not** be assigned |

---

## 8. Existing test / demo accounts to reuse

| Asset | Reusable for production OAuth? |
|-------|----------------------------------|
| Sandbox employer signup | No — separate data model |
| Admin demo account generator | No — sandbox context, incomplete stack |
| Seed demo orgs | No — orgs without user/employer_accounts |
| In-repo hardcoded test employer | **None found** |

**Conclusion:** Create a **new dedicated production employer** via the UI. Do not reuse SuperAdmin.

---

## Why SuperAdmin fails for `/employer/integrations/connect`

1. `resolveUserRole({ role: 'super_admin' })` → **`admin`**
2. `getPostLoginRedirect` → `/admin`
3. `app/employer/integrations/layout.tsx` requires `hasRole("employer")` → **false** for admin → redirect `/dashboard`
4. `requireEmployerIntegration()` → **403 Forbidden** on OAuth API
5. `/api/user/choose-role` returns **403** for founder / super_admin accounts

This is **correct behavior** — do not weaken it.

---

## Integration access guards (reference)

### UI — `/employer/integrations/*`

| Layer | Check |
|-------|-------|
| `proxy.ts` | Session required for `/employer/**` |
| `lib/auth/roleRouting.ts` | Employees blocked from `/employer/*`; admins not blocked at proxy for `/employer` paths |
| `app/employer/integrations/layout.tsx` | Login + **`profiles.role === 'employer'`** |

### API — Greenhouse OAuth start

| Route | Guard |
|-------|-------|
| `POST /api/employer/integrations/connect/greenhouse` | `requireEmployerIntegration()` |
| `GET /api/employer/integrations` | Same |

OAuth callback (no employer session required at callback time):

| Route | Behavior |
|-------|----------|
| `GET /api/integrations/v1/connect/greenhouse/callback` | Validates `code` + `state` from `connect_oauth_state`; exchanges token; redirects to connect wizard |

**Production callback verified (2026-08-20):**

```
GET https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback
→ 400 {"error":"code and state are required"}
```

---

## Manual creation steps (production UI)

Use a **fresh browser profile** or incognito window so you are not logged in as SuperAdmin.

### Step 1 — Sign up

1. Open `https://tryworkvouch.com/signup`
2. Register with a **dedicated test email** and strong password
3. Verify email if Supabase requires it

### Step 2 — Choose employer role

1. After login you should land on `/choose-role` (pending role)
2. Click **Employer**
3. Confirm redirect to `/employer/onboarding/start`

### Step 3 — Complete onboarding

1. **Organization name:** e.g. `WorkVouch Greenhouse Sandbox Test`
2. **Industry:** any (e.g. Corporate)
3. **Organization size:** e.g. Just me
4. **Primary admin email:** must **exactly match** the account you signed up with
5. Complete remaining wizard steps (defaults OK)
6. Submit → expect redirect to `/employer/dashboard?welcome=1`

### Step 4 — Verify employer portal access

1. Open `https://tryworkvouch.com/employer/integrations`
2. Confirm WorkVouch Connect dashboard loads (no redirect to login/admin)
3. Open `https://tryworkvouch.com/employer/integrations/connect`
4. Confirm **Greenhouse** appears as provider

### Step 5 — Verify OAuth **start** only (do not complete consent yet)

1. On connect wizard, proceed to **Authorize with Greenhouse**
2. Click **Continue to Greenhouse →**
3. **Expected:** browser redirects to `https://auth.greenhouse.io/authorize?...`
4. **Stop before** approving Greenhouse consent (Sprint 12.2 scope)

If step 5 fails:

| Error | Likely cause |
|-------|--------------|
| Redirect to `/login` | Session lost; sign in again |
| Redirect to `/dashboard` or `/admin` | Wrong role (SuperAdmin) or not employer |
| Redirect to `/employer/onboarding/start` | Onboarding incomplete |
| `Employer account not found` (404) | Missing `employer_accounts` row |
| `Forbidden` (403) | `profiles.role` is not `employer` |
| `Greenhouse configuration missing` (500) | Vercel env vars not set |
| `Failed to generate authorization URL` (500) | Check server logs / env |

---

## Optional: confirm records in Supabase

After onboarding (read-only check in Supabase dashboard):

```sql
-- Replace with test user email
SELECT p.id, p.email, p.role, ea.id AS employer_account_id, ea.company_name
FROM profiles p
LEFT JOIN employer_accounts ea ON ea.user_id = p.id
WHERE p.email = 'your-test-email@example.com';
```

Expected: `role = employer`, non-null `employer_account_id`.

---

## Code changes

**None required.** Existing signup → choose-role → employer onboarding flow creates all records needed for Greenhouse OAuth initiation.

---

## Remaining blockers before first full sandbox OAuth (Sprint 12.1 continuation)

| Blocker | Owner |
|---------|-------|
| Dedicated employer test account created | Manual (steps above) |
| Vercel production env: `GREENHOUSE_CLIENT_ID`, `GREENHOUSE_CLIENT_SECRET`, `ATS_ENCRYPTION_KEY` | Ops |
| Greenhouse testing client redirect URI matches `https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback` | Greenhouse partner config |
| Greenhouse authorizing user is **Site Admin** (for list endpoints after connect) | Greenhouse sandbox |
| Live Harvest validation, incremental sync, webhooks | Sprint 12.1 follow-up after OAuth |

---

## Related files

| Area | Path |
|------|------|
| Integration auth | `lib/employer/integrations/auth.ts` |
| OAuth start | `app/api/employer/integrations/connect/greenhouse/route.ts` |
| OAuth callback | `app/api/integrations/v1/connect/greenhouse/callback/route.ts` |
| Connect wizard UI | `components/integrations/ConnectionWizardClient.tsx` |
| Integrations layout | `app/employer/integrations/layout.tsx` |
| Redirect URI audit | `docs/audits/greenhouse-redirect-uri-audit.md` |
| Sandbox validation report | `SPRINT_12_1_SANDBOX_REPORT.md` |
