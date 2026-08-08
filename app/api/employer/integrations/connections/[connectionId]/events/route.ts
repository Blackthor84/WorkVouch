import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { loadEventHistory } from "@/lib/employer/integrations/service";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/events */
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const correlationId = searchParams.get("correlationId") ?? undefined;

  let history = await loadEventHistory(connectionId, auth.ctx.employerAccountId, limit);

  if (correlationId) {
    history = {
      ...history,
      events: history.events.filter((e) => e.correlation_id === correlationId),
      webhooks: history.webhooks.filter((w) => w.correlation_id === correlationId),
    };
  }

  return NextResponse.json(history);
}
