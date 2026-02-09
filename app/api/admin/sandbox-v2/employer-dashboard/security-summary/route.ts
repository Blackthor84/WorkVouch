/**
 * GET /api/admin/sandbox-v2/employer-dashboard/security-summary
 * Sandbox equivalent of GET /api/employer/security-summary.
 * Same response shape; no production tables. Returns zeros.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2Admin } from "@/lib/sandbox/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSandboxV2Admin();
    req.nextUrl.searchParams.get("sandboxId");
    return NextResponse.json({
      expiringLicensesCount: 0,
      highRiskEmployeesCount: 0,
      pendingVerificationsCount: 0,
      internalNotesCount: 0,
      totalActiveLicenses: 0,
      expiredLicensesCount: 0,
      suspendedLicensesCount: 0,
      expiredAlertsCount: 0,
      warning30DayCount: 0,
      topCredentialScores: [],
      reportsUsed: 0,
      reportsLimit: 80,
    });
  } catch (e) {
    console.error("[sandbox employer-dashboard security-summary]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
