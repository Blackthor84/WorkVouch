import { NextResponse } from "next/server";
import type { SyncImportMode } from "@/lib/integrations/connect/sync/types";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

type ImportRequestBody = {
  maxPages?: number;
  mode?: SyncImportMode;
  forceFull?: boolean;
};

function resolveImportMode(body: ImportRequestBody): SyncImportMode | undefined {
  if (body.forceFull === true || body.mode === "full") {
    return "full";
  }
  return body.mode;
}

/** POST /api/employer/integrations/connections/[connectionId]/import */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => ({}))) as ImportRequestBody;

  try {
    await access.runtime.recovery.ensureValidToken(connectionId);
  } catch (error) {
    return NextResponse.json(
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Token validation failed",
        errors: [error instanceof Error ? error.message : "Token validation failed"],
      },
      { status: 401 }
    );
  }

  const result = await access.runtime.harvestImport.importAll({
    connectionId,
    employerAccountId: auth.ctx.employerAccountId,
    maxPages: body.maxPages ?? 5,
    mode: resolveImportMode(body),
  });

  const syncSucceeded = result.status !== "failed" && result.syncLogWritten;
  if (syncSucceeded) {
    await access.runtime.connections.updateLastSync(connectionId);
  }

  const responseBody = {
    ...result,
    error: result.status === "failed" ? result.errors[0] ?? "Import failed" : undefined,
  };

  return NextResponse.json(responseBody, {
    status: result.status === "failed" ? 422 : 200,
  });
}
