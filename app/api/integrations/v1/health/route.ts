/**
 * GET /api/integrations/v1/health?connectionId=...
 * Internal monitoring (cron) or authenticated employer access.
 */
import { NextResponse } from "next/server";
import {
  requireConnectEnabled,
  rateLimitIntegrationRoute,
} from "@/lib/integrations/connect/connect-route-guards";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";

export async function GET(request: Request) {
  const disabled = requireConnectEnabled();
  if (disabled) return disabled;

  const limited = await rateLimitIntegrationRoute(request, "connect:health:", 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId");
  if (!connectionId) {
    return NextResponse.json({ error: "connectionId required" }, { status: 400 });
  }

  const cronHeader = request.headers.get("authorization") ?? "";
  const cronOk =
    Boolean(process.env.CRON_SECRET) && cronHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!cronOk) {
    const employerAuth = await requireEmployerIntegration();
    if ("error" in employerAuth) return employerAuth.error;

    const access = await requireConnectionAccess(connectionId, employerAuth.ctx.employerAccountId);
    if ("error" in access) return access.error;
  }

  try {
    const runtime = getConnectApiRuntime();
    const report = await runtime.health.evaluate(connectionId);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: 500 }
    );
  }
}
