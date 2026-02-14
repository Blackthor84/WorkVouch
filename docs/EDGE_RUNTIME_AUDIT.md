# Edge Runtime Audit – Node.js for Auth/DB Routes

**Date:** 2025  
**Goal:** Prevent production 500s caused by API routes or server layouts running in the Edge runtime when they use auth, cookies, Supabase, or other Node-only features.

---

## Summary

- **All `app/api/**/route.ts` handlers** now set `export const runtime = "nodejs"` (250 routes).
- **Admin layout** (`app/admin/layout.tsx`) and **auth callback** (`app/auth/callback/route.ts`) set `runtime = "nodejs"`.
- **Shared server client** (`lib/supabase/server.ts`) validates `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before creating the client and uses safe `getUser()` result access in `getSupabaseSession()`.
- **Auth callback** checks env and uses try/catch; returns redirects with query params instead of throwing.

---

## Root Cause of Production 500s

Routes that use any of the following were at risk when running in the **Edge** runtime on Vercel:

- `cookies()` from `next/headers` (different behavior in Edge)
- Supabase `createServerClient` / `supabase.auth.getUser()` (SSR client can assume Node)
- `jose` (used in `getSupabaseSession` for impersonation)
- Stripe, SendGrid, or other Node-only SDKs

Forcing **Node** for these routes avoids Edge-only crashes and keeps behavior consistent.

---

## Files Updated

### 1. API routes (237 files)

`export const runtime = "nodejs"` was added to every `app/api/**/route.ts` that did not already have it.  
**Total API routes with Node runtime:** 250 (all under `app/api/`).

### 2. Admin and auth

| File | Change |
|------|--------|
| `app/admin/layout.tsx` | Added `export const runtime = "nodejs"` |
| `app/auth/callback/route.ts` | Added `export const runtime = "nodejs"`, env check, try/catch, safe redirects on error |

### 3. Shared server client

| File | Change |
|------|--------|
| `lib/supabase/server.ts` | Validate `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before `createServerClient`; use safe `authResult?.data?.user` in `getSupabaseSession()` instead of destructuring `data.user` |

---

## What Was Not Changed

- **Static or client-only pages** – No `runtime` added where there is no server auth/DB/cookies.
- **Server actions** (`lib/actions/*`) – No route file; they run in the runtime of the invoking page/route. No change.
- **Middleware** (`middleware.ts`) – Left as-is; often kept on Edge for performance. If it starts using Supabase auth or Node-only code, consider moving that logic into API routes or server components with Node runtime.
- **Pages that already had `runtime = "nodejs"`** – e.g. onboarding, employer dashboard, upgrade – left unchanged.

---

## Standard Conventions (Going Forward)

1. **New API routes** that use auth, cookies, Supabase, Stripe, or other Node-only code should include:
   ```ts
   export const runtime = "nodejs";
   ```
2. **Env** – Validate required env vars before creating Supabase/Stripe/etc. clients; return 503 (or a safe redirect) instead of throwing.
3. **Auth** – Use `supabase.auth.getUser()` only; avoid `getSession()` in server code.
4. **Errors** – Wrap handler logic in try/catch; log server-side; return JSON (or redirect) with a generic message; do not expose stack traces.
5. **Safe access** – Prefer `authResult?.data?.user` over destructuring `const { data: { user } } = await supabase.auth.getUser()` to avoid throws when `data` is undefined.

---

## Script Used

`scripts/add-runtime-nodejs.js` was used to add `export const runtime = "nodejs"` to all API route files that did not already declare it. You can re-run it after adding new API routes if they are under `app/api/` and use the same import pattern.

---

## Final Checklist

- [x] No auth/DB/cookies route defaults to Edge (all relevant routes set `runtime = "nodejs"`).
- [x] API routes that use Supabase get a client only after env is validated in `supabaseServer()`.
- [x] Missing Supabase env yields a clear throw from `supabaseServer()`; routes should catch and return 503 or equivalent.
- [x] `getSupabaseSession()` uses safe `getUser()` result access.
- [x] Auth callback and admin layout run in Node and handle errors without uncaught throws.
