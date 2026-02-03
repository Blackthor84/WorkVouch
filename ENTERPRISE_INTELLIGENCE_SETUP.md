# Enterprise Team Fit Intelligence — Setup

## Overview

Silent enterprise intelligence layer: team fit, risk modeling, network density, and hiring confidence. All calculations are server-side; data is stored in dedicated tables and **not** exposed in public API or candidate responses. UI is gated by feature flags and role.

## Database (Supabase)

Run migration:

- `supabase/migrations/20250129200000_enterprise_intelligence_tables.sql`

Creates:

- **team_fit_scores** — candidate vs employer alignment (candidate_id, employer_id, alignment_score, breakdown, model_version, created_at, updated_at)
- **risk_model_outputs** — risk model results (candidate_id, employer_id nullable, overall_score, breakdown, model_version, created_at, updated_at)
- **network_density_index** — density and fraud confidence per candidate (candidate_id, density_score, fraud_confidence, breakdown, model_version, created_at, updated_at)
- **hiring_confidence_scores** — composite hiring confidence (candidate_id, employer_id, composite_score, breakdown, model_version, created_at, updated_at)
- Feature flags: **enterprise_team_fit**, **enterprise_intelligence_preview** (inserted if table has `key` column)

RLS is enabled on all four tables; access is via service role only (no policies = deny anon/auth).

## Lib Engines (server-side only)

| File | Purpose |
|------|--------|
| `lib/industry-normalization.ts` | Industry baselines, `normalizeToIndustry`, `resolveIndustryKey` |
| `lib/risk-model.ts` | `computeAndPersistRiskModel(candidateId, employerId?)` → risk_model_outputs |
| `lib/network-density.ts` | `computeAndPersistNetworkDensity(candidateId)` → network_density_index |
| `lib/team-fit-engine.ts` | `computeAndPersistTeamFit(candidateId, employerId)` → team_fit_scores (team baseline from verified employees) |
| `lib/hiring-confidence.ts` | `computeAndPersistHiringConfidence(candidateId, employerId)` → hiring_confidence_scores |
| `lib/intelligence/runIntelligencePipeline.ts` | `runCandidateIntelligence(candidateId)`, `runEmployerCandidateIntelligence(candidateId, employerId)`, `runIntelligencePipeline(candidateId, employerId?)` |

All engines: fail gracefully, neutral score when insufficient data, never throw to caller. Logging is server-side only.

## Trigger points

- **triggerProfileIntelligence(profileId)** (in `lib/intelligence/engines.ts`) now also calls **runCandidateIntelligence(profileId)**. So any existing callers (verification completion, reference submission, dispute resolution, employment record update, etc.) automatically run the new candidate-level pipeline (risk_model_outputs, network_density_index).
- For **team_fit_scores** and **hiring_confidence_scores**, call **runEmployerCandidateIntelligence(candidateId, employerId)** when an employer views a candidate or when verification completes in employer context (e.g. from employer request-verification or candidate view API).

## Feature flags

- **enterprise_team_fit** — Employer UI: Team Fit Intelligence. Visible to enterprise tier, admins, superadmins, and preview mode (via assignments). Required tier: `emp_enterprise`.
- **enterprise_intelligence_preview** — Admin-only intelligence preview (no tier; use assignments for admin/superadmin).

## UI

- **components/employer/EnterpriseTeamFit.tsx** — Employer-only, gated by **enterprise_team_fit**. Sections: Executive Summary, Alignment Breakdown, Environment Compatibility, Risk Delta, Network Integrity, Hiring Confidence. Use with `candidateId` and optional `employerId`; fetches from `/api/employer/team-fit`.
- **components/employee/ProfileAlignmentInsights.tsx** — Employee-facing, positive framing only. No risk/delta/comparative data. Props: `verifiedCount`, `totalYears`, `referenceCount`, `avgRating`.
- **app/admin/intelligence-preview/page.tsx** — Admin-only (layout restricts to admin/superadmin). Sections: Team Fit Summary, Risk Modeling Breakdown, Network Density Overview, Fraud Probability Indicator, Hiring Confidence Composite. Uses **GET /api/admin/intelligence-preview?candidateId=**.

## API routes

- **GET /api/admin/intelligence-preview?candidateId=** — Admin or superadmin only. Returns team fit, risk, network, fraud indicator, hiring confidence for that candidate.
- **GET /api/employer/team-fit?candidateId=&employerId=** — Authenticated employer; **enterprise_team_fit** must be enabled. Returns same shape for employer context.

## Safety

- No intelligence data in public API routes or candidate search responses.
- No exposure to employees (no risk/fraud wording in ProfileAlignmentInsights).
- No team comparison or intelligence in employee accounts.
- All calculations run server-side; neutral scores on failure; no block of verification or page render.

## Optional: run pipeline on demand

From server code (e.g. after verification or employer view):

```ts
import { runIntelligencePipeline } from "@/lib/intelligence/runIntelligencePipeline";

await runIntelligencePipeline(candidateId, employerId ?? undefined);
```

This runs candidate-level engines and, when `employerId` is provided, employer-candidate engines (team fit, hiring confidence).
