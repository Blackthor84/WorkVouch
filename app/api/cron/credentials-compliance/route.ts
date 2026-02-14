import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { updateAllCredentialStatuses } from "@/lib/credentials/statusUpdater";
import { generateComplianceAlerts } from "@/lib/compliance/generateAlerts";

/**
 * POST /api/cron/credentials-compliance
 * Nightly job: update all professional_credentials statuses and generate compliance alerts.
 * Secure with CRON_SECRET: Authorization: Bearer <CRON_SECRET> or x-cron-secret header.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const headerSecret = req.headers.get("x-cron-secret");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : headerSecret ?? "";
  if (secret && token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const statusResult = await updateAllCredentialStatuses();
    const alertResult = await generateComplianceAlerts();
    return NextResponse.json({
      ok: true,
      statusUpdated: statusResult.updated,
      statusErrors: statusResult.errors,
      alertsCreated: alertResult.created,
      alertErrors: alertResult.errors,
    });
  } catch (e) {
    console.error("Credentials compliance cron error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
