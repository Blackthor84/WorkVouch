import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { loadSyncHistory } from "@/lib/employer/integrations/service";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/sync-history */
export async function GET(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const cursor = await access.runtime.connections.getCursor(connectionId);
  const history = await loadSyncHistory(connectionId, limit);

  return NextResponse.json({ cursor, ...history });
}
