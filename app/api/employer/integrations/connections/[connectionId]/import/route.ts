import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** POST /api/employer/integrations/connections/[connectionId]/import */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => ({}))) as { maxPages?: number };
  await access.runtime.recovery.ensureValidToken(connectionId).catch(() => null);

  const result = await access.runtime.harvestImport.importAll({
    connectionId,
    employerAccountId: auth.ctx.employerAccountId,
    maxPages: body.maxPages ?? 5,
  });

  await access.runtime.connections.updateLastSync(connectionId).catch(() => null);

  return NextResponse.json(result);
}
