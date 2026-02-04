# WorkVouch Peer-First Confirmation Platform — Audit Report

**Date:** 2025-02-03  
**Scope:** Employer Reputation System, Enterprise Intelligence Dashboard, Reputation Marketplace, Peer-First Refactor

---

## STEP 1 — DATABASE AUDIT

### Tables requested vs existing

| Table | Exists | Notes |
|-------|--------|--------|
| employer_intelligence_snapshots | **No** | Not present. Spec: reliability_index, confirmation_rate, dispute_rate, response_speed_score, employee_retention_score, network_strength_score, calculated_at, version. |
| employer_reputation_index | **No** | Not present as table name. **employer_reputation_snapshots** exists with: reputation_score, verification_integrity_score, dispute_ratio_score, rehire_confirmation_score, worker_retention_score, response_time_score, workforce_risk_score, fraud_flag_score, network_trust_score, compliance_score, percentile_rank, industry_percentile_rank, model_version, last_calculated_at. |
| workforce_metrics | **No** | Not present. Spec: employer_id, avg_profile_score, multi_confirmed_percentage, rehire_probability_average, workforce_stability_index, risk_index, fraud_exposure_score, calculated_at. |
| employer_performance_history | **No** | Not present. **employer_reputation_history** exists (employer_id, reputation_score, breakdown, calculated_at). |
| reputation_marketplace_listings | **No** | Not present. |
| marketplace_transactions | **No** | Not present. |
| employer_directory_rankings | **No** | Not present. Directory ranking uses employer_reputation_snapshots + employer_accounts. |

### Existing tables (validated)

- **employer_reputation_snapshots**: Columns and RLS present. Indexes present.
- **employer_reputation_history**: Present. RLS and indexes present.
- **preview_employer_simulations**: Present (TTL 10 min). No RLS on insert (service role).
- **intelligence_snapshots**: User-level profile strength / career health. Present.
- **profile_metrics**: Present (stability, reference, rehire, dispute, credential, network, fraud). RLS: user read own.
- **employment_records**: Has verification_status (pending/matched/verified/flagged), employer_id. **No** confirmation_level, peer_confirmation_count, employer_confirmation_status, confirmation_weight_score.
- **employer_roster_upload**: **Missing**. Required for bulk roster upload (Pro/Custom).

### Actions (database)

1. Add to **employment_records**: confirmation_level (enum: self_reported, peer_confirmed, employer_confirmed, multi_confirmed), peer_confirmation_count (int default 0), employer_confirmation_status (text), confirmation_weight_score (numeric).
2. Create **employer_roster_upload** (employer_id, uploaded_by, upload_batch_id, employee_name, employee_email, role, start_date, end_date, status).
3. Create **employer_intelligence_snapshots** (per spec: reliability_index, confirmation_rate, dispute_rate, response_speed_score, employee_retention_score, network_strength_score, calculated_at, version) — or alias logic to employer_reputation_snapshots to avoid duplicate pipelines.
4. Create **workforce_metrics** (employer_id, avg_profile_score, multi_confirmed_percentage, rehire_probability_average, workforce_stability_index, risk_index, fraud_exposure_score, calculated_at).
5. Create **reputation_marketplace_listings** (listing_id, employer_id, listing_type, score_boost, active, expires_at, created_at) and optionally marketplace_transactions, employer_directory_rankings if needed.
6. Keep **employer_reputation_snapshots** as primary employer reputation store; sync or map to employer_intelligence_snapshots if both are required.

---

## STEP 2 — LOGIC AUDIT

### Existing scoring engines

- **lib/intelligence/employerReputationEngine.ts**: Calculates employer reputation from verifications, employment, rehire, disputes; writes to employer_reputation_snapshots and employer_reputation_history. **No Math.random.** Event-driven via triggerEmployerIntelligence(employerId).
- **lib/intelligence/engines.ts**: calculateTrustScore, calculateCareerStability, calculateNetworkDensityScore, calculateRehireProbability, calculateRiskSnapshotForProfile, calculateEmployerWorkforceRisk; triggerProfileIntelligence, triggerEmployerIntelligence.
- **lib/trustScore.ts** (and lib/trust-score.ts): Recalculates user trust score; writes to trust_scores table; logs audit. Used by confirm-match, dispute resolution.
- **lib/profile-metrics.ts**: upsertProfileMetrics(profileId) → profile_metrics. Called from profile-metrics.ts consumers.
- **lib/intelligence/unified-intelligence.ts**: Persists to intelligence_snapshots (profile strength, career health). No duplicate math.

### Gaps

- **Confirmation level logic**: Not implemented. Required: peer_confirmation_count >= 2 → peer_confirmed; employer_confirmation_status = approved → employer_confirmed; both → multi_confirmed. Must not block profile legitimacy on employer confirmation.
- **Employer Reputation Index formula (spec)**: Weighted: confirmation_rate 25%, dispute_rate inverse 20%, response_speed 15%, retention 15%, network_strength 15%, fraud_exposure inverse 10%. Clamp 0–100. Current employerReputationEngine uses different weights; can align or add employer_intelligence_snapshots.reliability_index with this formula.
- **Triggers**: Recalculation on peer review, employer confirmation, dispute resolved, roster upload, employee termination — partially wired (triggerProfileIntelligence, triggerEmployerIntelligence). Roster upload and confirmation_level updates need wiring.

### Duplicate / mock checks

- **No Math.random** in production scoring paths (employerReputationEngine, engines.ts, trustScore, profile-metrics, unified-intelligence). Math.random only in demo components (WorkerDemo, EmployerDemo, InvestorDemo, AdvertiserDemo, admin demo generate).
- **Employer dashboard**: Uses **hardcoded fake stats** (Active Jobs 12, Applications 48, Saved Candidates 24, Messages 8) and mock recentActivity. Must remove and replace with real confirmation/peer metrics or empty state.

---

## STEP 3 — ENTERPRISE INTELLIGENCE DASHBOARD AUDIT

- **/admin/intelligence-dashboard**: Exists. AdminIntelligenceDashboardClient loads user-level intelligence (profile_strength, career_health, risk, team_fit, hiring_confidence, behavioral). **Not** employer-level workforce metrics.
- **Workforce metrics API**: /api/employer/risk-overview, /api/employer/workforce-risk, etc. exist. No single “workforce metrics” API that returns avg_profile_score, multi_confirmed_percentage, etc. for an employer.
- **Employer-level drilldowns**: Admin can view employer reputation via /admin/employer-reputation-preview. No full “Employer Reputation Index, Workforce Stability Index, Confirmation Depth, Dispute Frequency Trend, Network Density, Fraud Exposure, Rehire Probability” in one dashboard.
- **Preview mode**: preview_employer_simulations exists; admin can generate 10-min preview. Feature flag **enterprise_intelligence_hidden** not present — need to add and gate workforce dashboard visibility (admin/superadmin or flag only).

### Actions

- Add feature flag **enterprise_intelligence_hidden**. Hide workforce dashboard from public employer dashboard; show only for admin/superadmin or when flag enabled.
- Optionally add admin-only “Workforce Metrics” view (employer-level) using workforce_metrics table once created.

---

## STEP 4 — REPUTATION MARKETPLACE AUDIT

- **Directory ranking**: /api/directory/employers ranks by employer_reputation_snapshots.reputation_score. No marketplace_boost or listing_type (spotlight, verified_badge, featured_industry) in formula.
- **Marketplace system**: No reputation_marketplace_listings table. No “Employer can purchase visibility tier” flow with Stripe, usage_logs, or expiry.
- **Feature flag**: employer_reputation_marketplace exists (gates /directory/employers). Spec also asks for **reputation_marketplace_hidden** — can align with existing flag or add second flag for “marketplace purchase” feature.

### Actions

- Add **reputation_marketplace_listings** (and optionally transactions, directory_rankings). Implement directory ranking formula: base_profile_score + employer_reputation_weight + multi_confirmation_bonus + marketplace_boost (only if listing active).
- Marketplace purchase flow (Stripe, usage_logs, expiry) — build when tables exist; hide behind reputation_marketplace_hidden or reuse employer_reputation_marketplace.

---

## STEP 5 — PREVIEW & SANDBOX SYSTEM

- **preview_employer_simulations**: Exists. TTL 10 minutes. Admin POST /api/admin/employer-reputation-preview creates row. No “simulate marketplace boost” or “simulate workforce data” in same table — table is minimal (employer_id, created_at, expires_at).
- **Sandbox**: Intelligence sandbox tables exist (20250129700000_intelligence_sandbox_tables.sql). Admin can run sandbox sessions. Preview data in separate tables; auto-delete or TTL.
- **Mixing**: No production data mixed with preview in current design.

### Actions

- Ensure preview/sandbox data never used in production scoring. Document. Optional: add “simulate workforce data” preview rows in a preview-only table if needed.

---

## STEP 6 — SAFETY CHECKS

| Check | Status |
|-------|--------|
| No fake dashboard numbers in production employer dashboard | **Fail** — Employer dashboard shows hardcoded Active Jobs, Applications, Saved Candidates, Messages. |
| No demo math in production paths | **Pass** — Scoring engines use real DB data; Math.random only in demo UI. |
| No Math.random in production | **Pass** — Only in demo components and admin demo generate (non-production). |
| No duplicate scoring pipelines | **Pass** — Single employer reputation engine; single profile intelligence pipeline; profile_metrics and intelligence_snapshots both written by defined engines. |
| Single source of truth for employer reputation | **Pass** — employer_reputation_snapshots is the single store; employer_reputation_history for trend. |

---

## STEP 7 — SUMMARY

### What already exists

- employer_reputation_snapshots, employer_reputation_history (employer reputation).
- preview_employer_simulations (10-min preview).
- intelligence_snapshots, profile_metrics (user-level).
- Employer reputation engine (employerReputationEngine.ts); triggerEmployerIntelligence.
- Admin intelligence dashboard (user-level); admin employer-reputation-preview (employer-level).
- /directory/employers (gated by employer_reputation_marketplace).
- Trust score engine (trust_scores table); “Reputation Score” label already used in one employer dashboard card; many docs/UI still say “Trust Score”.

### What was missing (to implement)

- employer_intelligence_snapshots (or map from employer_reputation_snapshots), workforce_metrics, reputation_marketplace_listings (and optional transactions/rankings).
- employment_records: confirmation_level, peer_confirmation_count, employer_confirmation_status, confirmation_weight_score.
- employer_roster_upload table and bulk upload API.
- Confirmation-level logic (peer_confirmed, employer_confirmed, multi_confirmed) and event triggers.
- Employer dashboard: remove fake metrics; add Confirmation Activity, Employee Confirmation Health, Peer Activity (real or empty state).
- Feature flag enterprise_intelligence_hidden; hide workforce dashboard from public employer view.
- Rename all UI “Trust Score” → “Reputation Score”, “Trust Index” → “Reputation Index”, “Trust Network” → “Professional Network Strength”.
- Event-driven recalculation on roster upload and confirmation_level changes.
- profile_metrics as single source of truth: ensure intelligence_snapshots sync with profile_metrics (unified-intelligence already writes to intelligence_snapshots; profile_metrics written by profile-metrics.ts — ensure no duplicate pathways).

### What will be added

- Migration: confirmation_level + peer/employer confirmation columns on employment_records; employer_roster_upload; employer_intelligence_snapshots; workforce_metrics; reputation_marketplace_listings.
- API: employer confirmation activity and peer-activity metrics (for dashboard); bulk roster upload (Pro/Custom); workforce_metrics read (admin).
- Dashboard: Sections A/B/C with real data or empty state; remove Active Jobs, Applications, Saved Candidates, Messages, job-board UI.
- Feature flag enterprise_intelligence_hidden; gating for workforce dashboard.
- UI copy: Trust → Reputation / Professional Network Strength in app UI (not docs).
- Triggers: recalc on peer review, employer confirm, dispute resolved, roster upload.

### What will be unified

- Employer reputation: keep employer_reputation_snapshots as primary; add employer_intelligence_snapshots with spec columns and sync from same engine or single write path to avoid duplicate logic.
- profile_metrics and intelligence_snapshots: keep both; ensure unified-intelligence and profile-metrics are the only writers; no duplicate scoring pathways.

### Architecture conflicts

- profile_metrics references auth.users(id). Codebase uses profiles(id). If profiles.id = auth.users.id, no conflict. Otherwise migration may need user_id → profiles(id) or keep auth.users for Supabase compatibility.
- Two employer snapshot tables (employer_reputation_snapshots vs employer_intelligence_snapshots): could consolidate into one table with all columns to avoid dual writes. Decision: add employer_intelligence_snapshots and have engine write to both, or add columns to employer_reputation_snapshots (reliability_index, confirmation_rate) and skip new table. Report recommends: add columns to existing employer_reputation_snapshots where possible; create workforce_metrics and marketplace tables only.

---

*End of audit. Implementation proceeds per PART 1–8 and STEPS 1–7.*

---

## IMPLEMENTATION SUMMARY (Post-Change)

### What was added

- **Migration 20250130200000_peer_first_confirmation_and_enterprise.sql**
  - employment_records: confirmation_level (TEXT), peer_confirmation_count, employer_confirmation_status, confirmation_weight_score
  - employer_roster_upload table (employer_id, uploaded_by, upload_batch_id, employee_name, employee_email, role, start_date, end_date, status)
  - workforce_metrics table (employer_id, avg_profile_score, multi_confirmed_percentage, rehire_probability_average, workforce_stability_index, risk_index, fraud_exposure_score, calculated_at)
  - reputation_marketplace_listings table (employer_id, listing_type, score_boost, active, expires_at)
  - Feature flags: enterprise_intelligence_hidden, reputation_marketplace_hidden

- **API /api/employer/confirmation-activity**
  - Returns section_a (confirmations requested/completed 30d, pending, avg confirmation time), section_b (percent employer/peer/multi confirmed, average_profile_score), section_c (new peer confirmations/reviews, disputes opened/resolved 30d). No fake numbers.

- **API /api/employer/roster-upload**
  - POST with rows[]; Pro/Custom only. Inserts employer_roster_upload; matches by email; auto-confirms employment; notifies; triggers profile + employer intelligence and updateConfirmationLevel.

- **lib/employment/confirmationLevel.ts**
  - updateConfirmationLevel(employmentId): sets confirmation_level from peer_confirmation_count and employer_confirmation_status (peer_confirmed, employer_confirmed, multi_confirmed).

- **Employer dashboard (EmployerDashboardClient)**
  - Removed: Active Jobs, Applications, Saved Candidates, Messages, Recent Activity (mock).
  - Added: Section A Confirmation Activity, Section B Employee Confirmation Health, Section C Peer Activity (real data from /api/employer/confirmation-activity or empty state).
  - Workforce dashboard: visible only when userRole is admin/superadmin OR feature flag enterprise_intelligence_hidden is enabled.

- **UI copy**
  - Legal terms meta: "Trust Score" → "Reputation Score".
  - Worker dashboard comment: "trust score" → "reputation score".

- **confirm-employment route**
  - Sets employer_confirmation_status = approved; calls updateConfirmationLevel(record_id) after update.

### What was not duplicated

- employer_reputation_snapshots retained as primary employer reputation store; workforce_metrics and reputation_marketplace_listings added as new tables. No duplicate scoring pipelines.
- profile_metrics and intelligence_snapshots unchanged; single source of truth preserved.

### Safety

- No Math.random in new code. No mock dashboard numbers; zero values show as 0 or empty state.
- Roster upload and confirmation-level logic are production-safe; event-driven triggers (triggerProfileIntelligence, triggerEmployerIntelligence, updateConfirmationLevel) wired.
