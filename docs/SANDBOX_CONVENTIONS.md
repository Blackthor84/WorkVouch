# Sandbox & Admin Conventions

## ENV requirement (deploy)

Set in Vercel → Environment Variables:

- **`ENV=SANDBOX`**

Enable for: Preview, Development. Redeploy after setting. Without this, all `/api/sandbox/*` routes return 403.

## Sandbox API guard

- **`sandboxAdminGuard()`** — `lib/server/sandboxGuard.ts`. Use at the start of every `/api/sandbox/*` route.
- Requires: `ENV === "SANDBOX"` and admin role (Supabase `getAdminSession()`).
- Client must send auth cookies: **`credentials: "include"`** on every sandbox fetch.

## PART 8 — Type safety

- **Never use `null`** in sandbox or admin code for optional values.
- Use **`string | undefined`** (or omit the key). Prefer optional chaining:
  - `sandboxId = sessions?.[0]?.id;`
- Avoid `?? null`; use `?? undefined` or omit.

## PART 9 — Sandbox data isolation

- **Every sandbox write** → `is_sandbox = true`.
- **Every production query** → `is_sandbox = false` (or omit when not sandbox).
- No cross-environment joins. No shared IDs.
- Enforce in services, not UI.

## PART 10 — Global fail-soft

- Any **non-critical fetch** in admin or sandbox must be wrapped:
  - `try { ... } catch { return null; }`
- Admin + Sandbox must **never block navigation**.

## Helper

- **`isSandboxEnv()`** — `lib/sandbox/env.ts` — use everywhere for SANDBOX detection.
- **`adminSandboxFailSoft()`** — `lib/admin/failSoft.ts` — use at start of admin API handlers (or rely on middleware).
