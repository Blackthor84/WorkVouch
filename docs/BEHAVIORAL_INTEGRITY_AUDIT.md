# WorkVouch Behavioral Integrity Audit

**Date:** 2025-02-05  
**Scope:** Functional correctness and system integrity (no UI/styling changes).  
**Objective:** Verify application behavior matches claims across Homepage, About, Career pages, Pricing, Admin/Sandbox, Employer dashboard, Employee profile.

---

## SECTION 1 — CORE SYSTEM CLAIMS

### 1.1 Peer review scoring

| Claim | Status | Evidence |
|-------|--------|----------|
| **Ratings saved correctly** | ✔ Fully functional | Production: `employment_references` POST inserts `rating`, `reliability_score = rating * 20`. Sandbox: `sandbox_peer_reviews` POST inserts `rating` (1–5 clamped). Both return error on insert failure (400/500). |
| **Sentiment analysis applied** | ✔ Production / ✔ Sandbox (different) | Production: `processReviewIntelligence` → `extractBehavioralSignals(comment)` (OpenAI); `review_intelligence` stores `sentiment_score`. Sandbox: `calculateSentimentFromText(review_text)` (word-bag: POSITIVE_WORDS/NEGATIVE_WORDS), stored in `sandbox_peer_reviews.sentiment_score`. |
| **Rating + sentiment affect profile strength** | ✔ Sandbox / ⚠ Production | Sandbox: `lib/sandbox/enterpriseEngine.ts` (and `recalculate.ts`) — `profile_strength` = f(average_rating, rehire_bonus, tenure_score, review_volume_score); `risk_index` includes `negative_sentiment_weight`; `hiring_confidence` = f(profile_strength, team_fit, risk_index). Production: `profile_strength` comes from `unified-intelligence` → engines (risk, network, team_fit, hiring_confidence); hiring_confidence uses team_fit, risk, density, fraud — not a single “profile strength” formula; sentiment flows via behavioral vector → risk/baseline. |
| **Recalculation trigger** | ✔ Production / ✔ Sandbox | Production: after reference submit → `recalculateTrustScore`, `processReviewIntelligence` (async); pipeline triggered by verification/reference/dispute. Sandbox: after peer review insert → `runSandboxIntelligence(sandbox_id)` then `calculateSandboxMetrics(sandbox_id)`; recalculate endpoint calls `runEnterpriseEngine` + metrics. |
| **Multiplier applied in sandbox** | ❌ Not implemented | UI has sentiment multiplier slider (0.5–2.0). Recalculate API does not accept or apply any multiplier; `lib/sandbox/recalculate.ts` and `lib/sandbox/enterpriseEngine.ts` have no multiplier parameter. Multiplier is UI-only. |

### 1.2 Coworker overlap matching

| Claim | Status | Evidence |
|-------|--------|----------|
| **Employment records compare employer_id?** | ⚠ Clarification | Coworker **matching** does not use `employer_id`. It uses `company_normalized` on `employment_records`. `match-employment` finds other records with same `company_normalized` and different `user_id`. `employer_id` on `employment_records` is for linking to employer accounts (verification/claim), not for overlap logic. |
| **Date overlap logic correct** | ✔ Fully functional | `app/api/match-employment/route.ts`: `overlapDays(start1, end1, start2, end2)`; overlap range = `[max(starts), min(ends)]`; returns 0 if overlapEnd ≤ overlapStart; else days. |
| **Overlap threshold enforced** | ✔ Fully functional | `minOverlapDays = 30`; only creates `employment_matches` when `days >= minOverlapDays`. |
| **Coworkers leave reviews only when overlap exists** | ✔ Fully functional | Production: reference requires `employment_match_id`; match exists only after company_normalized + overlap ≥ 30 days and (for “can leave review”) match must be `match_status === "confirmed"`. So reviews are gated by confirmed overlap. |
| **Duplicate review prevented** | ✔ Production / ⚠ Sandbox | Production: `employment-references` checks existing `employment_references` for same `employment_match_id` + `reviewer_id`; returns 409 if exists. Sandbox: no duplicate check — same reviewer can submit multiple reviews for same reviewed; UI does not prevent it (by design for demo). |

### 1.3 Trust / Intelligence / Confidence score

| Topic | Status | Evidence |
|-------|--------|----------|
| **Exact formula (trust)** | ✔ Documented | `lib/trustScore.ts`: normalized components — employment (min(verified_employments*10, 40)), tenure (min(total_verified_years*3, 30)), rating (avg_rating*20), distribution (min(unique_employers_with_refs*10, 30)), referenceVolume (min(reference_count*5, 30)); fraud_penalty = fraud_flags*25; final = clamp(weighted_sum - fraud_penalty, 0, 100). Weights from `trustScoreWeights` (core or industry). |
| **Weighting: tenure, review count, sentiment, rehire** | ✔ Trust / ⚠ Others | Trust: tenure and reference count (and rating, distribution) in formula; rehire not in trust score. Sandbox: tenure, review count, sentiment, rehire all in profile_strength / risk_index / team_fit / hiring_confidence. Production hiring_confidence: team_fit 0.30, risk 0.25, density 0.20, fraud 0.10, baseline 0.15 — no explicit “sentiment” or “rehire” in that composite. Rehire flows into risk snapshot in production. |
| **Negative reviews decrease score** | ✔ | Trust: low `averageReferenceRating` lowers rating component; fraud flags increase penalty. Sandbox: `negative_sentiment_weight = (1 - avg_sentiment) * 15` increases risk_index, which lowers hiring_confidence. Production: negative sentiment in behavioral signals affects risk/baseline alignment. |
| **Scores capped** | ✔ | Trust: `Math.max(0, Math.min(100, ...))`. Sandbox: `clamp0_100`. Production hiring_confidence: `clamp` 0–100. |
| **Sandbox same formula as production** | ❌ No | Sandbox uses its own formulas in `lib/sandbox/enterpriseEngine.ts` and `lib/sandbox/recalculate.ts` (profile_strength, career_health, risk_index, team_fit, hiring_confidence from sandbox tables). Production uses `lib/hiring-confidence.ts`, `lib/trustScore.ts`, `lib/intelligence/unified-intelligence.ts`, `runIntelligencePipeline` (risk_model, network_density, team_fit, hiring_confidence from production tables). Different code paths and inputs → drift possible. |

### 1.4 Rehire eligibility logic

| Claim | Status | Evidence |
|-------|--------|----------|
| **Influences scoring** | ✔ Sandbox / ✔ Production (risk) | Sandbox: `rehire_bonus` in profile_strength and team_fit. Production: `lib/risk-model.ts` loads `rehire_registry`; `rehireFlag` in risk snapshot input; influences risk model. |
| **Influences employer view** | ✔ | Rehire data used in employer-facing risk/workforce and rehire APIs; employer analytics/rehire route gated by subscription. |
| **Persisted** | ✔ | Production: `rehire_registry`; employment_records (no direct rehire_eligible on production employment_records in schema — rehire from registry). Sandbox: `sandbox_employment_records.rehire_eligible` persisted. |

### 1.5 Subscription gating

| Claim | Status | Evidence |
|-------|--------|----------|
| **Plan tier restricts data visibility** | ✔ | `requireActiveSubscription(userId)` checks `employer_accounts.subscription_status === "active"`; used in candidate-risk, analytics/export, search-users, analytics/trust-scores, analytics/rehire, view-job-history, search-employees. `canViewEmployees` (plan-enforcement-supabase) checks plan_tier pro/custom for view employees and disputes. |
| **Employer sees only what plan allows** | ✔ | Server-side checks on employer routes; 403 when subscription not active or plan insufficient. |
| **Sandbox simulates this** | ⚠ Partial | Sandbox has feature overrides and plan_tier on sandbox_employers; dashboard can show metrics by plan. No single “subscription_status” check in sandbox API — sandbox is admin-only, not employer-facing gating. |

### 1.6 Stripe validation

| Claim | Status | Evidence |
|-------|--------|----------|
| **Subscription status verified server-side** | ✔ | `requireActiveSubscription` reads `employer_accounts.subscription_status` (must be "active"). Separate path: `checkSubscription.ts` uses `profiles.stripe_customer_id` + `subscriptions` table (Stripe-backed) for user tier (free/pro/elite). Employer routes use `requireActiveSubscription` (employer_accounts). |
| **Employer can bypass plan checks** | ❌ No | Critical employer data routes call `requireActiveSubscription` or `canViewEmployees`; 403 returned when not allowed. |

---

## SECTION 2 — SANDBOX INTEGRITY

| Question | Answer |
|----------|--------|
| **Are sandbox tables fully isolated from production?** | ✔ Yes. Sandbox uses `sandbox_sessions`, `sandbox_employees`, `sandbox_employers`, `sandbox_peer_reviews`, `sandbox_employment_records`, `sandbox_intelligence_outputs`, `sandbox_metrics`, etc. Production uses `employment_records`, `employment_references`, `employment_matches`, `trust_scores`, `risk_model_outputs`, `network_density_index`, `hiring_confidence_scores`, etc. No shared tables for core scoring. |
| **Are sandbox recalculations using shared intelligence logic?** | ❌ No. Sandbox uses `lib/sandbox/enterpriseEngine.ts` and `lib/sandbox/recalculate.ts` (duplicate logic). Production uses `lib/intelligence/runIntelligencePipeline.ts`, `lib/hiring-confidence.ts`, `lib/risk-model.ts`, `lib/network-density.ts`, `lib/team-fit-engine.ts`, `lib/trustScore.ts`, etc. |
| **If production logic changes, will sandbox reflect it?** | ❌ No. Sandbox has its own formulas; changes to production engines do not affect sandbox unless sandbox code is updated separately. |
| **Is sandbox recalculation calling the same calculation engine?** | ❌ No. Recalculate route calls `runEnterpriseEngine(sandbox_id)` from `lib/sandbox/enterpriseEngine.ts`, not production engines. |
| **Is peer review multiplier applied only in sandbox?** | N/A. Multiplier is not applied anywhere (UI only). |
| **Can sandbox drift from production logic?** | ✔ Yes. Already different formulas and inputs; no shared core. |

**Recommended structural improvement (no UI refactor):**

- Move all scoring logic into shared modules under e.g. `lib/core/intelligence` (or `lib/intelligence` with clear “core” formulas).
- Production and sandbox should:
  - Import the same functions for profile_strength, risk_index, hiring_confidence, etc.
  - Pass in data adapters (production: employment_records, employment_references, etc.; sandbox: sandbox_* tables) so formulas are identical.
- Remove duplicated logic from `lib/sandbox/enterpriseEngine.ts` and `lib/sandbox/recalculate.ts`; have them call shared scoring with sandbox data.
- Add optional multiplier parameter only in sandbox path (e.g. sentiment multiplier applied in shared formula when `sandboxId` present).

---

## SECTION 3 — DATA FLOW VERIFICATION

### 3.1 Add employee

| Step | Status | Notes |
|------|--------|-------|
| DB insert | ✔ | Sandbox: POST `sandbox_employees`; Production: N/A (users sign up; employment added via match-employment). |
| Intelligence recalculation | ✔ Sandbox | Sandbox: `employees` route after insert runs `linkEmployeeToRandomEmployer`, `generatePeerReviews`, `runSandboxIntelligenceRecalculation`, `calculateSandboxMetrics`. |
| Dashboard refresh | ✔ | Client `refreshSandbox(sandboxId)` after create. |
| UI update | ✔ | State from `dashboardData`/employees list. |

### 3.2 Add peer review

| Step | Status | Notes |
|------|--------|-------|
| Save review | ✔ | Sandbox: insert `sandbox_peer_reviews` (rating, sentiment_score, review_text). Production: insert `employment_references` (rating, comment) gated by employment_match_id. |
| Update sentiment | ✔ | Sandbox: sentiment computed at insert; stored. Production: `processReviewIntelligence` extracts signals, writes `review_intelligence`. |
| Update profile strength / employer analytics / metrics | ✔ Sandbox / ✔ Production | Sandbox: `runSandboxIntelligence` + `calculateSandboxMetrics` after insert. Production: `recalculateTrustScore` + `processReviewIntelligence` (async) → behavioral vector + baseline. |
| Prevent self-review | ✔ Production / ⚠ Sandbox | Production: `reviewedUserId === reviewerId` → 400. Sandbox: API does not check; UI excludes self from “Reviewed” dropdown. Direct API call with reviewer_id === reviewed_id would be accepted. |
| Prevent duplicate review | ✔ Production / ❌ Sandbox | Production: 409 if same employment_match_id + reviewer_id. Sandbox: no duplicate check. |

### 3.3 Add employment record

| Step | Status | Notes |
|------|--------|-------|
| Validate employer exists | ⚠ Sandbox only | Sandbox employment-records: no server-side check that employer_id exists in sandbox_employers; insert may fail on FK or succeed if no FK. Production match-employment: creates record; employer link via autoMatchEmployer (employer_accounts by company name). |
| Validate employee exists | ⚠ Sandbox only | Sandbox: no check that employee_id exists in sandbox_employees; relies on FK or client. Production: user_id is session user. |
| Validate overlap logic | ✔ Production | Overlap used when creating employment_matches (match-employment), not when inserting employment record. Sandbox: no overlap between sandbox_employment_records (different model). |
| Update coworker matching | ✔ Production | match-employment after insert finds others by company_normalized + overlap ≥ 30 days; creates employment_matches. Sandbox: no employment_matches. |

---

## SECTION 4 — FAILURE MODES

| Category | Finding |
|----------|---------|
| **Silent failures** | `processReviewIntelligence` is fire-and-forget (`.catch(() => {})`); failures only log in development. Recalculate/trust score errors may be logged but not returned to client in some paths. |
| **200 on failed DB insert** | Not observed. Sandbox peer-reviews, employment-records, employees return 400 on insert error. Production employment-references returns 500 on insert error. |
| **Null data breaking calculations** | Sandbox: `reviewsByReviewed.get(empId) ?? []` and similar; averages use length checks. Production: engines use safe defaults (e.g. NEUTRAL_SCORE 50) when data missing. risk-model loads rehire/refs; missing data yields null snapshot and graceful handling. |
| **Unguarded assumptions** | Sandbox recalculate assumes `sandbox_peer_reviews` has `reviewer_id`, `reviewed_id`; optional columns (e.g. reliability_score) read with fallback. Employment_references assumes `employment_match_id` exists and match is confirmed. |
| **Race conditions in recalculation** | Multiple rapid peer reviews could trigger concurrent `runSandboxIntelligence`; last write wins for sandbox_intelligence_outputs. Production: multiple reference submits trigger concurrent recalculateTrustScore and processReviewIntelligence; no locking. |
| **UI showing stale state** | Client refreshes after actions (e.g. refreshSandbox); if refresh fails or is slow, UI can show stale counts until next successful load. |

---

## SECTION 5 — MATCH CLAIMS VS REALITY

| Claim | Verdict | Notes |
|-------|---------|-------|
| Match coworkers by overlap | ✔ Fully functional | Matching uses company_normalized + date overlap ≥ 30 days; employment_matches created; references require confirmed match. |
| Prevent fraudulent reviews | ✔ Fully functional | Reviews only via confirmed employment_match (overlap). Duplicate (same match + reviewer) prevented. Self-reference prevented. Rate limit on reference submission. |
| Score based on verified tenure | ✔ Fully functional | Trust score uses verified employments and total verified years. Sandbox uses tenure_months from sandbox_employment_records. Production risk/tenure from employment_records. |
| Increase confidence via volume | ✔ Fully functional | Trust: reference_volume component. Sandbox: review_volume_score in profile_strength. Production: network density and reference count in pipelines. |
| Reflect sentiment in score | ✔ Fully functional | Sandbox: sentiment in risk_index and thus hiring_confidence. Production: sentiment in behavioral signals and risk/baseline. |

---

## SECTION 6 — FINAL OUTPUT

### Functional integrity score: **72%**

- **Strengths:** Coworker overlap and duplicate/self-review prevention (production), trust score formula, subscription gating, Stripe/server-side checks, data flows for add employee/review/employment largely correct.
- **Deductions:** Sandbox and production use different scoring logic (drift risk); sentiment multiplier not applied in sandbox; sandbox self-review and duplicate review not enforced server-side; some silent failures and race possibilities.

### List of gaps

1. **Sandbox vs production scoring:** Different formulas and code paths; sandbox does not use production intelligence engines.
2. **Sentiment multiplier:** UI-only in sandbox; recalculate API does not accept or apply it.
3. **Sandbox peer review API:** No server-side check for reviewer_id !== reviewed_id; no duplicate (reviewer, reviewed) check.
4. **Sandbox employment-records:** No server-side validation that employee_id/employer_id exist in sandbox before insert.
5. **processReviewIntelligence:** Failures are swallowed (no user-facing or retry path).
6. **Subscription source of truth:** Two paths — employer_accounts.subscription_status vs subscriptions (Stripe); ensure webhook/sync keeps employer_accounts in sync with Stripe.

### Risk areas

- **Drift:** Sandbox demos may not reflect production behavior.
- **Silent failures:** Review intelligence and some recalc paths can fail without surfacing to user.
- **Concurrent recalculation:** No locking; last write wins for scores.
- **Sandbox API misuse:** Self-review or duplicate reviews possible if API called directly.

### Recommended structural improvements

1. **Unify scoring:** Move core formulas to shared `lib/core/intelligence` (or equivalent); production and sandbox call same functions with table-specific data adapters.
2. **Sandbox API hardening:** Add reviewer_id !== reviewed_id and optional duplicate (reviewer, reviewed) check in sandbox peer-reviews route; validate employee_id/employer_id in sandbox employment-records.
3. **Multiplier:** If product requires sentiment multiplier in sandbox, add parameter to recalculate/runEnterpriseEngine and apply in shared formula only for sandbox.
4. **Observability:** Log and optionally surface processReviewIntelligence and recalc failures; consider idempotency or queue for recalculation under load.
5. **Subscription sync:** Document and verify how employer_accounts.subscription_status is set from Stripe (webhook or job) so gating is reliable.

### Sandbox and production unified?

**No.** Sandbox uses its own tables and its own scoring implementation. Production uses different tables and different engines. Unification requires the shared-core refactor above.

### Suggested architecture if not unified

- **Shared core:** `lib/core/intelligence` (or under existing `lib/intelligence`) with pure functions: e.g. `computeProfileStrength(inputs)`, `computeRiskIndex(inputs)`, `computeHiringConfidence(inputs)`. Inputs are plain objects (counts, averages, flags).
- **Adapters:** Production: load from employment_records, employment_references, employment_matches, etc.; build input objects; call core; persist to risk_model_outputs, network_density_index, hiring_confidence_scores, etc. Sandbox: load from sandbox_* tables; build same shape inputs; call same core; persist to sandbox_intelligence_outputs. Optional sandbox-only multiplier applied to sentiment component in adapter or core when flag set.
- **Remove:** Duplicate formulas from `lib/sandbox/enterpriseEngine.ts` and `lib/sandbox/recalculate.ts`; replace with adapter + shared core.

---

*End of behavioral integrity audit. No UI or styling changes recommended; focus is behavioral correctness and system integrity.*
