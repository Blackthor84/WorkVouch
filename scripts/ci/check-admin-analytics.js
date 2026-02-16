/**
 * CI: Enforce single admin analytics route with audit, role check, rate limit.
 * Fails if:
 *   - app/api/admin/analytics/route.ts lacks logAudit, canAccessView, or withRateLimit
 *   - Per-role analytics routes exist (e.g. admin/analytics/sales/route.ts) that bypass the single route
 *
 * Run: node scripts/ci/check-admin-analytics.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const ANALYTICS_ROUTE = path.join(ROOT, "app", "api", "admin", "analytics", "route.ts");
const FORBIDDEN_ROLE_ROUTES = ["sales", "marketing", "ops", "support", "finance"];

function fail(msg) {
  console.error("[CI] check-admin-analytics:", msg);
  process.exit(1);
}

function pass(msg) {
  console.log("[CI] check-admin-analytics:", msg);
}

// 1) Canonical route must exist
if (!fs.existsSync(ANALYTICS_ROUTE)) {
  fail("app/api/admin/analytics/route.ts is missing. All role-based analytics must use this single route.");
}

const content = fs.readFileSync(ANALYTICS_ROUTE, "utf8");

// 2) Must contain audit logging
if (!content.includes("logAudit") || !content.includes("VIEW_ADMIN_ANALYTICS")) {
  fail("Admin analytics route must call logAudit with action VIEW_ADMIN_ANALYTICS.");
}

// 3) Must enforce role → view
if (!content.includes("canAccessView")) {
  fail("Admin analytics route must validate view access with canAccessView.");
}

// 4) Must apply rate limiting
if (!content.includes("withRateLimit")) {
  fail("Admin analytics route must use withRateLimit (e.g. 60/min/user).");
}

// 5) No per-role endpoints that bypass the single route
const analyticsDir = path.join(ROOT, "app", "api", "admin", "analytics");
if (fs.existsSync(analyticsDir)) {
  const entries = fs.readdirSync(analyticsDir, { withFileTypes: true });
  for (const role of FORBIDDEN_ROLE_ROUTES) {
    const roleRoute = path.join(analyticsDir, role, "route.ts");
    if (fs.existsSync(roleRoute)) {
      fail(
        `Per-role analytics route not allowed: app/api/admin/analytics/${role}/route.ts. Use GET /api/admin/analytics?view=${role} instead.`
      );
    }
  }
}

pass("OK: single admin analytics route has audit, role check, rate limit; no bypass routes.");
process.exit(0);
