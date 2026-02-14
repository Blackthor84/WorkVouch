# Sandbox–Production Parity Contract

## Invariant

**If it works in sandbox, it will work in production. If it fails in production, sandbox tells you why.**

Sandbox is a 1:1 mirror of production logic. Sandbox may differ **only** in:

- **Seeded data** (demo orgs, demo users, synthetic resumes — all flagged `is_demo` / `demo` / `mode = 'sandbox'`)
- **Rate limits** (e.g. relaxed in sandbox for testing)
- **Debug visibility** (admin panels, score breakdowns, raw SQL)
- **Admin power** (seed, reset, rewind trust score, force re-parse)

Sandbox must **never** succeed when production would fail.

---

## Single Execution Path

- **One set of API routes** — no sandbox-only endpoints that change success/failure.
- **One set of business logic** — all in `/lib/core/`: resume, employment, coworker-matching, reviews, trust-score.
- **One set of DB writes** — same schema, same RLS, same constraints.
- **No sandbox-only logic branches** — no fake responses, mock success, demo-only APIs, or conditional bypasses.

**Environment decides data, not behavior.** `APP_MODE` (`NEXT_PUBLIC_APP_MODE === "sandbox"` → `"sandbox"`, else `"production"`) may **only** affect:

- Which **data** is visible (e.g. filter out demo orgs in production).
- **Limits** (rate limits, plan limits).
- **Logging** (verbose in sandbox).
- **Admin visibility** (sandbox tools, debug panels).

It must **not** change whether an operation succeeds or fails.

---

## Core Modules (`/lib/core/`)

| Module | Responsibility |
|--------|----------------|
| `resume` | `processResumeUpload`: store raw → parse → normalize → insert employment → trigger matching. Same in sandbox and prod. |
| `employment` | `insertEmploymentFromResume`: insert jobs into `employment_records`, then run coworker matching. |
| `coworker-matching` | Overlap rules, `MIN_OVERLAP_DAYS`, `confidenceFromOverlapDays`. No fake coworkers outside seed data. |
| `reviews` | `submitReview`: insert reference, recalc trust score. Deterministic. |
| `trust-score` | Re-exports `calculateCoreTrustScore`, `recalculateTrustScore`. Single formula; never differs by environment. |
| `onboarding` | Shared onboarding step logic (minimal). |

Every API route **must** call these functions. No inline business logic in routes.

---

## Resume Pipeline (Mandatory)

On resume upload:

1. Store raw resume (storage + `resumes` row).
2. Parse → structured data.
3. Normalize employer, role, dates.
4. Insert into `employment_records` (source: `resume`).
5. Trigger coworker matching (same employer, overlapping dates, min overlap).
6. User is **prompted** for reviews (request / leave) — no auto-send, no auto-create.

Runs **identically** in sandbox and production. If parsing fails, both fail the same way.

---

## Coworker Matching

- Same employer (`company_normalized`).
- Overlapping date ranges.
- Minimum overlap (e.g. 30 days).
- Confidence score from overlap length.
- Stored in `employment_matches` (with `employment_record_id`, `matched_user_id`, `overlap_start`, `overlap_end`, `match_status`).
- **No fake coworkers** outside sandbox seed data.

---

## Reviews & Trust Score

- Reviews stored raw in `employment_references`.
- Trust score calculation lives in `/lib/core/trust-score.ts` (re-export from `lib/trustScore` + core intelligence).
- **Deterministic and reproducible** — same inputs → same score. Never differs by environment.
- Sandbox may **display** the math (debug); production may not.

---

## Sandbox Data Strategy

- **Same schema, same RLS, same triggers** as production.
- **Differences:** seed demo orgs, demo users, demo resumes.
- All seed data must be **clearly flagged** (`is_demo`, `demo`, `mode = 'sandbox'`) and **never** mixed into production queries (use `isSandboxRequest()` / filter by environment where applicable).

---

## Admin & Navbar

- Admin detection is **server-side** only (DB roles: `admin_users`).
- Navbar admin link is **server-rendered**, role-verified; works identically in sandbox and prod.
- Sandbox admin gets all production admin capabilities **plus**: debug panels, raw SQL visibility, match explanations, scoring breakdowns, forced failures for testing.

---

## Failure Contract

- If production would error → sandbox errors the same way.
- Sandbox may **only add** diagnostics (error IDs, debug context, admin-visible traces), not success.

---

## Parity Tests

- Test suite runs the **same action** in sandbox and prod mode (e.g. resume upload, submit review).
- Asserts **identical DB mutations** (same tables, same shapes).
- Asserts **identical failures** (same status code and error shape when a step fails).
