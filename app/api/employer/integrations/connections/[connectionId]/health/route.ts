import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/health */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const report = await access.runtime.health.evaluate(connectionId);
  const webhookMetrics = access.runtime.webhookMetrics.getSnapshot();
  const lifecycle = access.runtime.lifecycleObservability.getSnapshot();

  return NextResponse.json({ report, webhookMetrics, lifecycle });
}
