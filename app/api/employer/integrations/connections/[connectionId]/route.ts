import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { getConnectionStats } from "@/lib/employer/integrations/service";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId] */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const cursor = await access.runtime.connections.getCursor(connectionId);
  const stats = await getConnectionStats(access.runtime, access.connection);

  return NextResponse.json({
    connection: access.connection,
    cursor,
    stats,
  });
}

/** DELETE /api/employer/integrations/connections/[connectionId] — disconnect */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const summary = await access.runtime.connections.disconnect(connectionId);
  return NextResponse.json({ connection: summary, disconnected: true });
}
