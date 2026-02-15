# Sandbox & Admin Conventions

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
