# Resume Intelligence QA Report — Sprint 11.1 + 11.2

**Last updated:** 2026-08-13  
**Sprint 11.2:** QA findings remediation

---

## Final verdict: **GO WITH CONDITIONS**

All automated validation and code-level remediation is complete. **Manual real-resume QA remains the only blocking condition** for unconditional production sign-off.

---

## Sprint 11.2 — Remediation summary

| Finding | Severity | Status | Resolution |
|---------|----------|--------|------------|
| **F-06** Build failure | High | **Fixed** | Lazy Supabase admin singleton |
| **F-04** Verified → pending downgrade | Medium | **Fixed** | Server + UI protection |
| **F-03** Profile silent overwrite | Medium | **Fixed** | Conflict UI + field choices |
| **F-01** TXT MIME mismatch | Medium | **Fixed** | Migration `20260813220000` |
| **F-08** Real-world parser QA | High | **Open** | Manual QA required |

---

## F-06 — Production build (RESOLVED)

### Root cause

**Both A and B applied:**

- **A:** Production/CI must provide `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` at **runtime** when API routes execute.
- **B:** `lib/supabase-admin.ts` and `lib/supabaseAdmin.ts` called `createClient()` at **module import time**. Next.js build loads route modules during page-data collection, triggering client creation before env was available locally.

### Fix

- `lib/supabase-admin.ts`: lazy singleton via `getAdminClient()` + Proxy export
- `lib/supabaseAdmin.ts`: re-exports lazy `admin` (removed duplicate eager client)

### Required environment variables (runtime)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |

### Why safe

- No credentials hardcoded
- Same service-role client, deferred until first DB access
- Throws clear error at runtime if env missing (fail-closed)

### Build result (post-fix)

```
npm run build → SUCCESS (174 static pages, all API routes compiled)
```

---

## F-04 — Verified employment protection (RESOLVED)

### Before

"Update existing" could set `verification_status = pending` on verified records.

### After

- `resolveEmploymentConfirmAction()` blocks update on verified records
- Confirm route uses `.neq("verification_status", "verified")` on updates
- UI hides "Update existing" when duplicate is verified
- Response includes `verified_protected_count`

### Regression tests

- `verified employment protection (F-04)` in `tests/resume-intelligence.test.ts`

---

## F-03 — Profile protection (RESOLVED)

### Before

City/state/location overwritten when profile opt-in checked; only name was protected.

### After

- `resolveProfileUpdates()` applies fields only when:
  - Existing value is empty → fill from resume, OR
  - User explicitly chooses `use_resume` or `manual`
- Default on conflict: `keep_existing`
- Parse returns `existing_profile` for review UI
- Import UI shows conflict banner with Keep / Use resume / Edit manually

### Regression tests

- `profile protection (F-03)` — 5 tests

---

## F-01 — TXT MIME (RESOLVED)

### Fix

Migration `supabase/migrations/20260813220000_resumes_bucket_txt_mime.sql` adds `text/plain` to bucket allowlist.

### Verification

- Application layer: `validateResumeFile()` accepts `.txt`
- Storage layer: migration updates `allowed_mime_types`

---

## Automated validation

| Metric | Sprint 11.1 | Sprint 11.2 |
|--------|-------------|-------------|
| Tests | 326/326 | **338/338** |
| Build | FAIL | **PASS** |
| Resume tests | 15 | **27** |

---

## Manual real-resume QA

**Status: NOT EXECUTED**

Real resumes were not tested in this engineering session. Use `docs/resume-intelligence/manual-qa.md`.

| Resume | Status |
|--------|--------|
| A — Simple chronological PDF | Pending |
| B — Two-column PDF/DOCX | Pending |
| C — Multiple employers | Pending |
| D — Current employment | Pending |
| E — Complex/messy | Pending |

**Do not claim parser quality is production-validated until this checklist is completed on staging.**

---

## Final verdict questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Production-ready? | **Conditionally** — pending manual resume QA |
| 2 | Upload secure? | **Yes** |
| 3 | Profile protected? | **Yes** (post 11.2) |
| 4 | Employment normalization correct? | **Yes** |
| 5 | Verification boundary intact? | **Yes** |
| 6 | Deletion safe? | **Yes** |
| 7 | Cross-user access? | **No** |
| 8 | Resume contents in logs? | **No** |
| 9 | Build passes? | **Yes** |
| 10 | All tests passing? | **Yes — 338/338** |

---

## Remaining condition for unconditional GO

1. Complete manual QA checklist (`docs/resume-intelligence/manual-qa.md`) with 3–5 real resumes on staging

---

## Sign-off

| Sprint | Verdict |
|--------|---------|
| 11.1 | GO WITH CONDITIONS |
| 11.2 | **GO WITH CONDITIONS** (manual resume QA only) |
