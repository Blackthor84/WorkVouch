# Scoring & Compliance Implementation Summary

## What Already Existed

- **Trust score:** `lib/trustScore.ts` and `trust_scores` table — 0–100 score from core intelligence (tenure, reviews, sentiment, rating, fraud penalty, rehire). Persisted via `calculateCoreTrustScore`. **Unchanged;** employee audit score is additive.
- **Org health (pressure):** `lib/enterprise/orgHealthScore.ts` — 0–100 pressure score from usage %, limit blocks (30d), abuse signals, location vs plan. Returned `status`, `score`, `summary`, `recommended_plan`. **Extended** with health score and new signals.
- **Search:** `app/api/employer/search-users/route.ts` used `employer_candidate_view` and returned `trust_score`; no ordering by audit band or verification recency. **Enhanced** with audit-based ranking and employer-facing audit label/explanation.
- **403 responses:** `lib/enterprise/checkOrgLimits.ts` had `planLimit403Response()` with "🚨 Upgrade Required", `recommended_plan`, `health_status`. **Extended** with `cta_text`, `cta_url`, and Enterprise Recommended in `detail` when health is at_risk/misaligned.
- **Navbar/Footer:** Blue background with `text-white` / `text-blue-100` for links; Login/Sign Up were contrast buttons (gray/white bg, blue text). **Updated** so emails, buttons, and links on blue are pure white; buttons use white border + white text.

---

## What Was Added

### Part 1 — Employee Audit Scoring

- **Migration:** `supabase/migrations/20250227000000_employee_audit_scores.sql`  
  - Table `employee_audit_scores` (user_id PK, score, band, breakdown JSONB, calculated_at). RLS for service_role only.
- **Calculator:** `lib/scoring/employeeAuditScore.ts`  
  - 100-point explainable model:
    - **A) Identity & Profile (10):** verified email, name on file, no fraud/conflicting signals.
    - **B) Work History (20):** no gaps > 6 months, job/ref alignment, chronological consistency.
    - **C) Reference Strength (30):** up to 3 refs, supervisor/cross-company weighting.
    - **D) Skill Credibility (20):** safety/compliance in feedback, skills aligned, count.
    - **E) Risk (−20→0):** reference reuse penalty.
  - Bands: 85–100 Highly Verified, 70–84 Verified, 55–69 Partially Verified, &lt;55 Unverified.
  - `calculateEmployeeAuditScore()`, `persistEmployeeAuditScore()`, `calculateAndPersistEmployeeAuditScore()`, `getEmployeeAuditScore()`, `getEmployeeAuditScoresBatch()`, `compareAuditForRank()`.
  - Employer-facing: `getAuditLabel()`, `getAuditExplanation()` (no numeric breakdown).
- **Admin API:** `app/api/admin/users/[id]/audit-score/route.ts` — GET returns full breakdown (recalculates if missing).
- **Types:** `types/database.ts` — `employee_audit_scores` table types.

### Part 2 — Org Health Score (Company Level)

- **Extended** `lib/enterprise/orgHealthScore.ts`:
  - New signals: **verified employee %**, **reference completion %**, **admin-to-employee ratio**, **location vs plan %** (existing usage/abuse/location retained).
  - **healthScore** 0–100 (higher = healthier): average of abuse headroom, usage headroom, verified %, ref completion %, admin ratio %, location %.
  - **suggestions[]** for org admin improvement.
  - **Enterprise Recommended** when `healthScore < 50` or existing abuse threshold.
  - **persistOrgHealthScore(organizationId)** — writes org_health_score, org_health_verified_pct, org_health_reference_pct, org_health_abuse_penalty, org_health_usage_headroom, org_health_admin_ratio_pct, org_health_location_pct to `organization_metrics`.
- **Re-export:** `lib/scoring/orgHealthScore.ts` — re-exports from enterprise for requested path.
- **Nightly persist:** `app/api/system/nightly-recalc/route.ts` — after profile recalc, calls `persistOrgHealthScore()` for up to 200 orgs.

### Part 3 — Score-Based Search Ranking

- **search-users:**  
  - Fetches `employee_audit_scores` in batch for candidate user_ids.  
  - Sorts results by audit band (highly_verified → verified → partially_verified → unverified), then by score desc, then by `calculated_at` desc.  
  - Response adds per user: `auditScore`, `auditBand`, `auditLabel`, `auditExplanation`.  
  - Low-score results are not hidden; they appear lower.  
  - Server-side only.

### Part 4 — Compliance Export

- **Endpoint:** `GET /api/admin/compliance/export?format=csv|pdf&organizationId=...`
  - **Access:** Admin only. Super admin: may pass any `organizationId` or one org. Org admin: must pass their org (validated via `tenant_memberships`).
  - **Plan:** Enterprise only; Starter/Growth receive 403 with upgrade CTA via `planLimit403Response`.
  - **Content:** Employee audit summary (name, email, profile_id, audit score/band, references count), org health snapshot (health score, status, verified %, reference completion %), timestamp, disclaimer.
  - **Formats:** CSV (attachment), PDF (HTML printable report, Content-Disposition .pdf).
  - **Audit:** Every export logged with `auditLog({ action: "compliance_export", ... })` (added to `AuditAction` in `lib/auditLogger.ts`).

### Part 5 — UI & Copy

- **403:** `planLimit403Response()` now includes `cta_text: "Upgrade to Enterprise"`, `cta_url: "/pricing"`, and when health is at_risk/misaligned appends " Enterprise Recommended for your usage." to `detail`.
- **search-users:** Org limit 403 now uses `planLimit403Response` with `getOrgHealthScore()` for health_status/recommended_plan.
- **Navbar:** Login/Sign Up buttons changed from `bg-gray-100 text-blue-700` / `bg-white text-blue-700` to `text-white border border-white/80 hover:bg-white/20` on blue.
- **Footer:** All links, emails, and body text on blue set to `text-white` (was `text-blue-100`); copyright line to `text-white`.

### Part 6 — Safety

- No existing plan enforcement or abuse logic removed or weakened.
- Admin vs employer visibility: full audit breakdown only in admin audit-score API; employer sees label + short explanation in search and (when implemented in UI) on candidate views.
- Abuse signals and limits still drive `checkOrgLimits` and `planLimit403Response`; org health extends signals and persistence only.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20250227000000_employee_audit_scores.sql` | New table + RLS |
| `types/database.ts` | `employee_audit_scores` table type |
| `lib/scoring/employeeAuditScore.ts` | New calculator + persist + batch + rank helpers |
| `lib/enterprise/orgHealthScore.ts` | healthScore, new signals, suggestions, persist, Enterprise Recommended by health |
| `lib/scoring/orgHealthScore.ts` | New re-export |
| `app/api/system/nightly-recalc/route.ts` | Persist org health for orgs |
| `app/api/employer/search-users/route.ts` | Audit batch, sort by audit, label/explanation, org 403 → planLimit403Response |
| `app/api/admin/users/[id]/audit-score/route.ts` | New admin breakdown endpoint |
| `app/api/admin/compliance/export/route.ts` | New compliance export (CSV/PDF, audit log) |
| `lib/enterprise/checkOrgLimits.ts` | planLimit403Response: cta_text, cta_url, detail + Enterprise Recommended |
| `lib/auditLogger.ts` | AuditAction + `compliance_export` |
| `components/navbar.tsx` | Login/Sign Up → white text + border on blue |
| `components/Footer.tsx` | Links, emails, body → text-white |

---

## TODOs / Schema Notes

1. **Employee audit score backfill:** Scores are computed on demand (admin audit-score GET, or when used in search). To backfill all users, run `calculateAndPersistEmployeeAuditScore(userId)` for each profile (e.g. from a cron or script). No schema change required.
2. **Starter/Growth filter by band:** Spec said "Enterprise plans may filter by score bands." Search currently returns all results ranked by audit; no query param for band filter was added. Add optional `auditBand` (or `minBand`) to search-users and filter candidate list before/after fetch if desired.
3. **skills table:** `employeeAuditScore.ts` uses `from("skills")`; if the table is missing in your schema, the catch returns empty skills (no crash). Confirm `skills` exists or add migration.
4. **profiles.email_verified:** Used in audit identity; migration `20250214000000_profiles_email_verified_employer_contact.sql` adds it. If types don’t include it, the code uses optional chaining.

---

## Verification

- `npx tsc --noEmit` passes.
- Plan enforcement: `checkOrgLimits` and abuse thresholds unchanged; 403 responses standardized with CTA.
- Admin-only: audit breakdown only at `GET /api/admin/users/[id]/audit-score`; compliance export requires admin and (for org admin) membership.
- Exports logged with `compliance_export` in `system_audit_logs`.
