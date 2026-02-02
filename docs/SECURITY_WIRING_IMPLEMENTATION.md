# Security & Wiring Fixes — Implementation Summary

**Date:** 2025-01-29  
**Scope:** Critical security (email removal, subscription gating), tier standardization, match confirmation API, RLS and migration.

---

## Modified Files

| File | Change |
|------|--------|
| `app/api/employer/search-users/route.ts` | Removed email from SELECT and response; use `employer_candidate_view`; enforce `requireActiveSubscription`. |
| `app/api/employer/search-employees/route.ts` | Removed email from profiles SELECT and response; enforce `requireActiveSubscription`; canViewEmployees (Pro/Custom). |
| `app/api/employer/candidate-risk/route.ts` | Added `requireActiveSubscription` before returning candidate data. |
| `app/api/employer/view-job-history/route.ts` | Added `requireActiveSubscription`; tier message "Pro or Custom". |
| `app/api/employer/analytics/trust-scores/route.ts` | Added `requireActiveSubscription`. |
| `app/api/employer/analytics/rehire/route.ts` | Added `requireActiveSubscription`. |
| `app/api/employer/analytics/export/route.ts` | Added `requireActiveSubscription`. |
| `app/api/employer/request-verification/route.ts` | Tier check uses lite/free/basic for limit. |
| `app/api/employment-references/route.ts` | Added `logAudit` for reference creation after insert. |
| `app/api/stripe/webhook/route.ts` | `customer.subscription.deleted` sets `plan_tier` to `lite` (was starter). |
| `lib/employer-require-active-subscription.ts` | **New.** `requireActiveSubscription(userId)` — 403 "Active subscription required." if `subscription_status !== 'active'`. |
| `lib/stripe/config.ts` | `getPriceToTierMap`: starter → lite, team/growth → pro; `getTierFromSubscription` returns lite/pro; `getLookupQuotaForTier`: lite 5, pro/custom -1. |
| `lib/planLimits.ts` | Tiers: lite, pro, custom; `normalizeTier` maps starter/free/basic → lite, team/growth → pro. |
| `lib/middleware/plan-enforcement-supabase.ts` | `canViewEmployees` / `canFileDispute`: check `plan_tier === 'pro' || 'custom'`. |
| `lib/dispute-audit.ts` | Added `employment_match` to `AuditEntity`. |
| `app/api/employment/confirm-match/route.ts` | **New.** POST `{ matchId, status: "confirmed" \| "rejected" }`; user must be part of match; update match_status; if confirmed, recalc trust for both users; log to audit_logs. |
| `supabase/migrations/20250129000010_security_wiring.sql` | **New.** Unique `(employment_record_id, matched_user_id)`; drop user UPDATE on employment_matches; employment_references INSERT only when match confirmed. |

---

## Confirmation Checklist

- **No employer email exposure:** search-users and search-employees do not select or return `email`. search-users uses `employer_candidate_view` (no email). search-employees returns profiles without email.
- **Subscription gating enforced:** All employer-facing candidate data routes call `requireActiveSubscription(user.id)` and return 403 "Active subscription required." when `subscription_status !== 'active'`. Applied in: search-users, search-employees, candidate-risk, view-job-history, analytics/trust-scores, analytics/rehire, analytics/export.
- **Match confirmation API wired:** POST `/api/employment/confirm-match` with `{ matchId, status: "confirmed" \| "rejected" }`; validates user is record owner or matched_user; updates `employment_matches.match_status` via service role; on confirmed, calls `recalculateTrustScore` for both users and logs to `audit_logs`.
- **Trust recalculation triggered:** confirm-match calls `recalculateTrustScore(recordOwnerId)` and `recalculateTrustScore(matchedUserId)` when status is confirmed. employment-references already called `recalculateTrustScore(reviewedUserId)` after insert.
- **No direct client DB update bypass:** Migration drops RLS policy "Users can update own employment_matches". Only service role (API) can update `employment_matches`. Client cannot update match_status via Supabase client.

---

## RLS SQL (from migration)

- **employment_matches:** `DROP POLICY "Users can update own employment_matches"` — updates only via API (service role).
- **employment_references:** New INSERT policy "Users can insert employment_references as reviewer for confirmed match" — `WITH CHECK (auth.uid() = reviewer_id AND EXISTS (SELECT 1 FROM employment_matches m WHERE m.id = employment_match_id AND m.match_status = 'confirmed'))`.

---

## Migration SQL (summary)

- Add unique constraint `employment_matches_record_matched_user_unique` on `(employment_record_id, matched_user_id)` after de-duplicating.
- Drop policy "Users can update own employment_matches".
- Replace employment_references INSERT policy with confirmed-match-only policy.

---

## Tier Standardization

- **DB / webhook:** `plan_tier` stored as `lite`, `pro`, or `custom`. Stripe price IDs map: starter → lite, team/growth → pro. subscription.deleted sets lite.
- **Access:** `canViewEmployees` / `canFileDispute` require `pro` or `custom`. `normalizeTier` and `getPlanLimits` use lite/pro/custom; legacy starter/team/basic map to lite/pro.

---

## Audit Log Consistency

- **Match confirm/reject:** `logAudit({ entityType: "employment_match", entityId, changedBy, oldValue, newValue, changeReason })` in confirm-match route.
- **Reference creation:** `logAudit({ entityType: "reference", entityId, changedBy, newValue, changeReason })` in employment-references route after insert.
- **Trust score:** Recalculation is triggered from audited actions (confirm-match, reference submit); no separate audit row in recalculateTrustScore (audit_logs.changed_by requires profile id; system-triggered recalc has no user id).

---

## Production Hardening

- Employer candidate data routes require active subscription and do not return email.
- Match status changes only via API; RLS prevents client updates.
- References insert only when match is confirmed (API + RLS).
- Unique constraint prevents duplicate employment_matches.
- Tier naming consistent across webhook, plan limits, and access checks.
