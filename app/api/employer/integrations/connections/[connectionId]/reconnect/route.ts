import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { ConnectTokenStoreAdapter } from "@/lib/integrations/connect/auth/connect-token-store-adapter";
import { createGreenhouseProvider } from "@/lib/integrations/providers/greenhouse/provider";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** POST /api/employer/integrations/connections/[connectionId]/reconnect */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const origin = new URL(request.url).origin;
  const callbackUrl = `${origin}/api/integrations/v1/connect/greenhouse/callback`;

  const runtime = getConnectApiRuntime();
  const tokenStore = new ConnectTokenStoreAdapter(runtime.connections);
  const provider = createGreenhouseProvider({
    tokenStore,
    stateStore: runtime.oauthStateAdapter,
    connectionManager: runtime.connections,
    harvestImport: runtime.harvestImport,
  });

  const result = await provider.connect({
    employerAccountId: auth.ctx.employerAccountId,
    connectionId,
    redirectUri: callbackUrl,
  });

  return NextResponse.json({
    connectionId: result.connectionId,
    authorizationUrl: result.authorizationUrl,
    status: result.status,
  });
}
