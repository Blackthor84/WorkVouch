# Sandbox & Admin Conventions

## Playground architecture (do not regress)

- **Single entry:** All simulation UI lives under **Playground**. One nav link: **Playground** → `/admin/playground`.
- **No Sandbox destination:** Sandbox is an internal simulation context (simulation_id, mode, impersonation), not a navigation target. Do not add "Sandbox" or "Enter Sandbox" as top-level nav.
- **Activity Monitor:** Under Playground at `/admin/playground/monitor`. Legacy `/admin/sandbox/monitor` redirects there.
- **User-facing copy:** Use **"Simulation"** (not "Sandbox") in titles, labels, and empty states (e.g. "Simulation Activity Monitor", "Simulation ID").
- **Dual logging:** Every simulated mutation must log to **sandbox_events** (system audit) and, when user-facing, **activity_log** (timeline). Use `logSandboxMutation` in `lib/sandbox/dsl/dualLog.ts`.
- **Safety:** Safe mode prevents irreversible writes. Real mode or dangerous actions (e.g. Simulate Mass Abuse) require explicit admin confirmation. Impersonation is admin-only and auto-expires.

## Sandbox API guard

- **`sandboxAdminGuard()`** — `lib/server/sandboxGuard.ts`. Use at the start of every `/api/sandbox/*` route.
- **ADMIN is the gate.** Sandbox is a permissioned mode, not a deployment. No ENV check.
- Requires: admin or super_admin role (Supabase `getAdminSession()`).
- Client must send auth cookies: **`credentials: "include"`** on every sandbox fetch.
- Isolation is via data flags (`is_sandbox = true`), not environment.

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

- **`isSandboxEnv`** — `lib/sandbox/env.ts` — boolean constant (do not call); use everywhere for SANDBOX detection.
- **`adminSandboxFailSoft()`** — `lib/admin/failSoft.ts` — use at start of admin API handlers (or rely on middleware).
