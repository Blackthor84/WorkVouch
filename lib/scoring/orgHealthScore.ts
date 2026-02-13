/**
 * Org health score — re-export from enterprise module.
 * Company-level 0–100 health (higher = healthier).
 * Persist to organization_metrics via persistOrgHealthScore (cron or on major events).
 */

export {
  getOrgHealthScore,
  persistOrgHealthScore,
  updateOrgHealth,
  computeOrgHealthScore,
  getOrgHealthFromTable,
  type OrgHealthScoreResult,
  type OrgHealthStatus,
  type OrgHealthBand,
  type ComputeOrgHealthResult,
} from "@/lib/enterprise/orgHealthScore";
