# Production hardening checklist

After the hardening pass, confirm:

- [ ] **No silent catch blocks** — All `.catch()` log with `[SYSTEM_FAIL]` or handle and rethrow.
- [ ] **No unprotected admin routes** — Every `/api/admin/*` uses `requireAdmin()` or `requireSuperAdmin()` server-side.
- [ ] **No 200 on failed DB writes** — Routes return 4xx/5xx when insert/update fails and do not return success.
- [ ] **No manifest 401** — `/manifest.json`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, `/images/*`, `/icons/*`, `/_next/*` are excluded from auth in proxy and return 200.
- [ ] **No duplicate JSX attributes** — No `variant="x" variant="y"` or repeated props.
- [ ] **No profile/email drift** — Email changes only via two-step flow or superadmin force-email-change; auth and profiles kept in sync.
- [ ] **No direct service role exposure to client** — `SUPABASE_SERVICE_ROLE_KEY` used only in server-side API routes and lib.
- [ ] **No unhandled Promise rejections** — Async paths use try/catch or .catch with logging.
- [ ] **Intelligence score always 0–100** — v1 formula clamps to [0, 100]; no raw score returned to UI without clamp.
- [ ] **Fraud attempts logged** — fraud_signals and [FRAUD_BLOCK] / anomaly alerts used; email change and suspicious activity logged.
- [ ] **Audit trail complete** — Sensitive actions (admin edit, role change, email change, profile delete, dispute resolve, employment confirm, intel recalc, stripe plan change) call `auditLog()` and/or `admin_audit_logs` / `system_audit_logs`.
- [ ] **Soft delete respected** — Users with `deleted_at` set cannot log in; admin sees deleted status; CRON purges after 30 days.
- [ ] **Rate limiting** — Sensitive routes (employment-references, admin, auth, employer) use `withRateLimit`; 429 and [RATE_LIMIT_BLOCK] on exceed.
- [ ] **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS (production), CSP (allow Supabase/Stripe) applied in proxy.
- [ ] **CRON protected** — `/api/system/nightly-recalc` requires `SYSTEM_CRON_SECRET` (Bearer or query param).

## Log tags (observability)

- `[INTEL_START]` / `[INTEL_SUCCESS]` / `[INTEL_FAIL]`
- `[AUTH_UPDATE]`
- `[ADMIN_ACTION]`
- `[SECURITY]`
- `[RATE_LIMIT_BLOCK]`
- `[FRAUD_BLOCK]`
- `[CRON_RUN]`
