import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { requireEmployerIntegration, requireConnectionAccess } from "@/lib/employer/integrations/auth";

/** GET /api/employer/integrations/intelligence — hiring business metrics */
export async function GET(request: Request) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const connectionId = searchParams.get("connectionId") ?? undefined;
  const period = (searchParams.get("period") ?? "30d") as import("@/lib/integrations/connect/intelligence/types").MetricsPeriod;
  const compare = searchParams.get("compare") === "true";

  try {
    const runtime = getConnectApiRuntime();

    if (connectionId) {
      const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
      if ("error" in access) return access.error;
    }

    const metrics = await runtime.hiringMetrics.computeMetrics({
      employerAccountId: auth.ctx.employerAccountId,
      connectionId,
      period,
    });

    const trends = compare
      ? await runtime.hiringMetrics.compareTrends(auth.ctx.employerAccountId, period, connectionId)
      : null;

    const snapshots = await runtime.hiringMetrics.listSnapshots({
      employerAccountId: auth.ctx.employerAccountId,
      connectionId,
      period,
      limit: 10,
    });

    return NextResponse.json({
      employerAccountId: auth.ctx.employerAccountId,
      connectionId,
      period,
      metrics,
      trends,
      snapshots,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to compute hiring metrics" },
      { status: 500 }
    );
  }
}

/** POST /api/employer/integrations/intelligence — capture metrics snapshot */
export async function POST(request: Request) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    connectionId?: string;
    period?: import("@/lib/integrations/connect/intelligence/types").MetricsPeriod;
  };

  const runtime = getConnectApiRuntime();
  const period = body.period ?? "30d";

  const snapshot = await runtime.hiringMetrics.captureSnapshot({
    employerAccountId: auth.ctx.employerAccountId,
    connectionId: body.connectionId,
    period,
  });

  return NextResponse.json({ snapshot });
}
