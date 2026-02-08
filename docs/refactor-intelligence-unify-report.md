# WorkVouch Intelligence Unify — Refactor Report

**Date:** 2025-02-05  
**Scope:** Unify intelligence logic, enforce fraud rules, harden recalculation, stop silent failures, add concurrency and logging.

---

## Files created

| Path | Purpose |
|-----|---------|
| `lib/core/intelligence/types.ts` | Canonical `ProfileInput` for v1 engine |
| `lib/core/intelligence/v1.ts` | Pure v1 scoring (TS, RVS, SS, RS, RM, clamp 0–100) |
| `lib/core/intelligence/engine.ts` | Single entry: `calculateProfileStrength(version, input)` |
| `lib/core/intelligence/logging.ts` | Structured logs: `INTEL_START`, `INTEL_SUCCESS`, `INTEL_FAIL`, `FRAUD_BLOCK` |
| `lib/core/intelligence/adapters/production.ts` | `buildProductionProfileInput(userId)` from production DB |
| `lib/core/intelligence/index.ts` | Re-exports engine, adapter, logging |
| `docs/refactor-intelligence-unify-report.md` | This report |

---

## Files modified

| Path | Changes |
|-----|---------|
| `lib/trustScore.ts` | Removed duplicate math (`normalizeScores`, `computeWeightedTrustScore`, `computeTrustScore`). Uses `buildProductionProfileInput` + `calculateProfileStrength("v1", input)` from `@/lib/core/intelligence`. Concurrency: re-fetch version, update only if match, retry once; on conflict throw. Structured logging (INTEL_START/SUCCESS/FAIL). |
| `lib/sandbox/buildProfileInput.ts` | Import `ProfileInput` from `@/lib/core/intelligence`. Comment updated to reference core. |
| `lib/sandbox/recalculate.ts` | Import from `@/lib/core/intelligence`. Optional `sentimentMultiplier` (0.5–2.0): applied **sandbox-only** as `score = clamp(score * multiplier, 0, 100)` after v1. Structured logging. No silent returns; all failures return `{ ok: false, error }`. |
| `lib/sandbox/enterpriseEngine.ts` | Import from `@/lib/core/intelligence`. INTEL_START/SUCCESS/FAIL logging. All failures return `{ ok: false, error }`. |
| `app/api/admin/sandbox-v2/peer-reviews/route.ts` | Fraud rules: block self-review (400 + FRAUD_BLOCK); block duplicate per (sandbox_id, reviewer_id, reviewed_id) (409 + FRAUD_BLOCK); validate reviewer/reviewed in `sandbox_employees` with same sandbox_id; validate overlap ≥ 30 days at same employer (sandbox_employment_records tenure_months ≥ 1); validate sandbox_id for all entities. |
| `app/api/admin/sandbox-v2/recalculate/route.ts` | Uses `runSandboxIntelligenceRecalculation(sandboxId, { sentimentMultiplier })`. Accepts optional `sentimentMultiplier` in body. Returns 500 on recalc failure. |
| `app/admin/sandbox-v2/SandboxV2Client.tsx` | Recalculate request body includes `sentimentMultiplier` (sandbox-only). |
| `lib/intelligence/processReviewIntelligence.ts` | Returns `Promise<{ ok: boolean; error?: string }>`. Structured INTEL_START/SUCCESS/FAIL logging. No swallowed errors; all failure paths return `{ ok: false, error }`. |
| `app/api/employment-references/route.ts` | Awaits `processReviewIntelligence(ref?.id)`. On `!ok` returns **500** with message "Reference saved but intelligence processing failed" and warning "Score update may be delayed; retry later." |
| `app/api/admin/sandbox-v2/generate-employee/route.ts` | Removed all inline scoring math. Creates employee + employment record, then calls `runSandboxIntelligenceRecalculation(sandboxId)`; fetches `sandbox_intelligence_outputs` for new employee and returns in response. Returns 500 if recalc fails. |
| `tests/intelligence.test.ts` | Imports `calculateV1` and `ProfileInput` from `@/lib/core/intelligence`. |
| `lib/sandbox/buildProfileInput.ts` | Doc comment: reference `lib/core/intelligence`. |

---

## Duplicate scoring removed

- **lib/trustScore.ts:** Removed `normalizeScores`, `computeWeightedTrustScore`, `computeTrustScore`. Scoring is only via `calculateProfileStrength("v1", input)` with `buildProductionProfileInput(userId)`.
- **lib/intelligence/scoring/:** Entire folder removed. All scoring lives in `lib/core/intelligence` (types, v1, engine, production adapter).
- **app/api/admin/sandbox-v2/generate-employee/route.ts:** Removed inline `profile_strength`, `career_health`, `risk_index`, etc. Now uses `runSandboxIntelligenceRecalculation` (canonical v1 + optional sandbox multiplier).

**Note:** `lib/intelligence/calculateUserIntelligence.ts` and `lib/intelligence/unified-intelligence.ts` still contain their own snapshot/career-health formulas for **intelligence_snapshots** and **unified_intelligence_scores**. They were not in scope for this refactor (canonical **trust_scores** and **sandbox_intelligence_outputs** only). Unifying those to v1 can be a follow-up.

---

## Fraud rules unified (sandbox)

- **Self-review:** Blocked; 400 + `FRAUD_BLOCK` log.
- **Duplicate review:** One review per (sandbox_id, reviewer_id, reviewed_id); 409 + `FRAUD_BLOCK` log.
- **Employee exists:** Reviewer and reviewed must exist in `sandbox_employees` with same `sandbox_id`.
- **Overlap ≥ 30 days:** At least one employer where both have `sandbox_employment_records` with `tenure_months >= 1`.
- **sandbox_id consistency:** All entities (employees, employers, employment records) validated for same `sandbox_id`.

---

## Multiplier status

- **Sentiment multiplier** remains in UI (SandboxV2Client, 0.5–2.0).
- Applied **only in sandbox** inside `runSandboxIntelligenceRecalculation`:  
  `if (isSandbox && multiplier !== 1) { profile_strength = clamp(profile_strength * multiplier, 0, 100); }`
- Recalculate API accepts optional `sentimentMultiplier` in body and passes it to `runSandboxIntelligenceRecalculation`.
- Production scoring is unchanged; no multiplier.

---

## Silent failure fixes

- **processReviewIntelligence:** Returns `{ ok, error }`; all failure paths log `INTEL_FAIL` and return `ok: false`. No swallowed errors.
- **employment-references:** Awaits processReviewIntelligence; on `!ok` returns **500** with error and warning (reference is still saved).
- **Sandbox recalc (recalculate.ts, enterpriseEngine.ts):** Every failure returns `{ ok: false, error }` and logs `INTEL_FAIL`; no silent returns.
- **Recalculate route:** Returns 500 when `runSandboxIntelligenceRecalculation` returns `!ok`.
- **generate-employee route:** Returns 500 when recalc returns `!ok`.
- **trustScore:** On write failure logs `INTEL_FAIL` and throws; no silent swallow.

**Retry flag in DB:** Not added (no `review_intelligence.needs_retry` or equivalent in current schema). Callers return non-200 and surface warning; a future migration can add a retry flag if needed.

---

## Concurrency safeguards

- **trust_scores:** Before write, current row is fetched for `version`. If row exists, update uses `eq("user_id", userId).eq("version", currentVersion)`. If update affects 0 rows (version changed), re-fetch version and retry **once** with new version. If still no write, throw (no last-write-wins overwrite).
- **sandbox_intelligence_outputs:** Upsert by (sandbox_id, employee_id); no version column. Concurrency left as upsert semantics for this refactor.

---

## Structured logging

- **Tags:** `INTEL_START`, `INTEL_SUCCESS`, `INTEL_FAIL`, `FRAUD_BLOCK` (see `lib/core/intelligence/logging.ts`).
- **Used in:**  
  - `lib/trustScore.ts` (recalc start/success/fail)  
  - `lib/sandbox/recalculate.ts` (sandbox recalc)  
  - `lib/sandbox/enterpriseEngine.ts` (sandbox enterprise)  
  - `lib/intelligence/processReviewIntelligence.ts` (review intelligence)  
  - `app/api/admin/sandbox-v2/peer-reviews/route.ts` (FRAUD_BLOCK for self-review, duplicate, no overlap)

---

## Test results

- **tests/intelligence.test.ts** imports from `@/lib/core/intelligence`.
- Run: `npm install` then `npm run test`.  
  (If vitest is missing, run `npm install` first.)

---

## Summary

- **One scoring engine:** `lib/core/intelligence` — types, v1, engine, production adapter; production and sandbox use `calculateProfileStrength("v1", input)`.
- **Duplicate scoring removed** from trustScore and sandbox generate-employee; old `lib/intelligence/scoring` removed.
- **Fraud rules** enforced in sandbox peer-review API (self-review, duplicate, employee/employer/overlap/sandbox_id).
- **Multiplier** is sandbox-only, applied in recalc; production unchanged.
- **No silent failures:** processReviewIntelligence and recalc paths return results and/or non-200; structured logging on failure.
- **Concurrency:** trust_scores use version check and single retry; no last-write-wins on conflict.
- **Logging:** INTEL_* and FRAUD_BLOCK used consistently across trust score, sandbox recalc, and peer-review API.
