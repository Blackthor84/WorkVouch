# Server-side impersonation — query changes

## Overview

- **effectiveUserId** = `impersonated_user_id ?? auth.uid()` (from HTTP-only cookie when SANDBOX_IMPERSONATION_ENABLED=true and user is admin/superadmin).
- **Workers only**: Impersonate route rejects targets with role admin/superadmin.
- **Production kill switch**: Set `SANDBOX_IMPERSONATION_ENABLED=true` to enable; otherwise impersonation is ignored.
- **Exit**: `POST /api/sandbox/impersonate/exit`. Cookie cleared on logout (client calls exit before signOut).
- **RLS**: All queries use `effectiveUserId` in WHERE clauses; RLS remains enabled.

## Routes updated to use `getEffectiveUserId()`

| Route | Change |
|-------|--------|
| `app/api/activity/log/route.ts` | `userId` → `effectiveUserId` in `insertActivityLog` |
| `app/api/activity/route.ts` | `user.id` → `effectiveUserId` in `.eq("user_id", …)` |
| `app/api/user/me/route.ts` | Load profile by `effectiveUserId` |
| `app/api/resume/upload/route.ts` | Profile check, path, update, activity log use `effectiveUserId` |
| `app/api/account/update-profile/route.ts` | `getSupabaseSession()` → `getEffectiveUserId()`; update by `userId` |
| `app/api/user/profile/route.ts` | `getCurrentUser()` → `getEffectiveUserId()`; `getProfile(effectiveUserId)` |
| `app/api/user/disputes/route.ts` | `getCurrentUser()` → `getEffectiveUserId()`; all `.eq("user_id", …)` and insert |
| `app/api/user/dispute-status/route.ts` | `getCurrentUser()` → `getEffectiveUserId()`; profile, disputes, trust_scores |
| `app/api/resumes/route.ts` | `supabase.auth.getUser()` → `getEffectiveUserId()`; `.eq("user_id", …)` |
| `app/api/onboarding/status/route.ts` | `getCurrentUser()` → `getEffectiveUserId()`; profile, employer_accounts, jobs; role from profileRow |

## Pattern for remaining routes

Replace:

```ts
const { data: { user } } = await supabase.auth.getUser();
// or
const user = await getCurrentUser();
if (!user?.id) return 401;
// ... .eq("user_id", user.id) or .eq("id", user.id)
```

With:

```ts
const effectiveUserId = await getEffectiveUserId();
if (!effectiveUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// ... .eq("user_id", effectiveUserId) or .eq("id", effectiveUserId)
```

Admin routes that act on a **target** user by ID (e.g. `GET /api/admin/users/[id]/activity`) should keep using that ID for the query and use `getAuthedUser()` only for auth.
