# Enterprise Load Simulation

Controlled load simulation for WorkVouch. **Never run against production.** All simulation data is isolated and reversible.

## Prerequisites

- Set `ENTERPRISE_SIMULATION_MODE=true` in `.env.local` (never in production).
- Admin or superadmin session (NextAuth) to call the simulation APIs.
- Dev server running: `npm run dev`.

## Steps (API routes)

All routes live under `/api/admin/enterprise-load-simulation/` and require admin + `ENTERPRISE_SIMULATION_MODE=true`.

| Step | Route | Description |
|------|--------|-------------|
| 1–4 | `POST .../run` | Create simulation session, Casino org (is_simulation=true), 10 admins, 5 locations, 1 employer account, 1000 candidates in batches of 100, 2–4 matches + 1 review per match per candidate, run `calculateUserIntelligence` for each. Returns `session_id`, `org_id`, `employer_account_id`, `employer_user_id_for_unlock`, and performance metrics. |
| 5 | `POST .../unlock-spike` | Body: `{ orgId, employerAccountId, count?, concurrency? }`. Simulates unlock increments (1 min burst, 10 or 50 concurrent). Returns latency and final `organization_usage.unlock_count`. |
| 6 | `POST .../abuse` | Body: `{ orgId }`. Runs add_location and add_admin limit checks; expects 403 when over plan limit (enterprise org may allow). |
| 7 | `POST .../fraud` | Body: `{ sessionId, candidateId, employmentMatchId }`. Attempts self-review and duplicate review; expects DB/API to reject. |
| 8–9 | (inline in run / unlock-spike) | Performance and connection behavior are logged in run and unlock-spike responses. |
| 10 | `POST .../cleanup` | Body: `{ orgId }`. Calls `cleanup_enterprise_simulation(org_id)` and deletes auth users for session profiles. Safe only when `organizations.is_simulation = true`. |
| 11 | `POST .../report` | Body: partial report object. Merges into final report and returns `scaling_risk_level` and `recommended_improvements`. |

## Final report shape

```json
{
  "simulation_summary": {
    "candidates_created": 1000,
    "reviews_created": 3000,
    "unlocks_triggered": 1000
  },
  "performance_metrics": {
    "avg_score_time_ms": 120,
    "max_score_time_ms": 450,
    "avg_unlock_latency_ms": 25,
    "db_write_time_ms": 0,
    "dashboard_query_time_ms": 0
  },
  "integrity_results": {
    "race_conditions_detected": false,
    "duplicate_prevented": true,
    "self_review_blocked": true,
    "plan_enforcement_passed": true
  },
  "scaling_risk_level": "low",
  "recommended_improvements": []
}
```

## Cleanup

Always call `POST .../cleanup` with the simulation `org_id` when done. This:

- Deletes org-scoped data (organization_usage, enterprise_signals, organization_features, employer_users, locations, employer_accounts, organization).
- Deletes session-scoped data (employment_references, employment_matches, employment_records, intelligence_snapshots).
- Deletes auth users for profiles in that session.

No production orgs or users are modified.
