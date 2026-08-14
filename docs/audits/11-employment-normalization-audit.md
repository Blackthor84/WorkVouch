# 11 — Employment Normalization Audit

**Date:** 2026-08-13

---

## Canonical Employment Model

**Table:** `employment_records`  
**Migration:** `supabase/migrations/20250129000001_employment_and_matching.sql`

| Column | Purpose |
|--------|---------|
| `company_name`, `company_normalized` | Employer identity |
| `job_title` | Role |
| `start_date`, `end_date`, `is_current` | Tenure |
| `verification_status` | `pending`, `matched`, `verified`, `flagged` |
| `source` | `'resume'` \| `'manual'` (added later) |

---

## Resume → Employment Records Path

| Path | Target | Normalized? |
|------|--------|-------------|
| `POST /api/resume/confirm` | `employment_records` | ✅ Same schema |
| `lib/employment/insertFromResume.ts` | `employment_records` + `source: "resume"` | ✅ (unused route) |
| Enterprise `workforce_resumes.parsed_json` | Separate table | ❌ **Not normalized** to `employment_records` |

---

## Compatibility with Downstream Systems

| System | Uses `employment_records`? | Resume-derived compatible? |
|--------|---------------------------|---------------------------|
| Verification | ✅ | ✅ After user confirms import |
| References | ✅ | ✅ Same user_id linkage |
| Trust Engine | ✅ (`verification_status = verified` only) | ✅ After verification |
| Employer profiles | ✅ | ✅ Via verified records |
| Candidate profiles | ✅ | ✅ |
| Greenhouse Connect | Indirect — email link to WorkVouch profile | ✅ Verified data in panel |

---

## Second Employment System Risk

| System | Risk |
|--------|------|
| Legacy `jobs` table | **MEDIUM** — some metrics still query `jobs`; resume import writes to `employment_records` |
| `workforce_resumes.parsed_json` | **MEDIUM** — parallel unstructured store for enterprise |
| Greenhouse `connect_candidate_map` | **LOW** — ATS-sourced, separate from resume |

**Verdict:** Consumer resume path **does feed the canonical model** after confirm. Enterprise path **does not** normalize into `employment_records` today.

---

## Normalization Gaps

1. `company_normalized` — AI provides on consumer parse; not always validated against employer registry
2. Date formats — parsed as strings; DB constraints enforce valid dates
3. Overlapping jobs — no dedup on confirm (user could import duplicates)
4. `source: "resume"` not set on `/api/resume/confirm` (only on `insertFromResume`)

---

## Can Resume-Derived Employment Feed Verification and Trust?

**YES — architecturally**, via existing path:

```
Resume parse → user confirm → employment_records (pending)
  → verification request → verified
  → trust score + Greenhouse panel
```

**Blockers:** User must complete confirm flow; verification is manual/employer-driven; no auto-bridge from enterprise `workforce_resumes`.

---

## Recommendation (Product/Engineering — Future)

1. Unify enterprise parse output into same confirm → `employment_records` flow
2. Set `source: "resume"` consistently on confirm route
3. Deprecate or migrate legacy `jobs` table references
4. Do not create a third employment schema for resume data
