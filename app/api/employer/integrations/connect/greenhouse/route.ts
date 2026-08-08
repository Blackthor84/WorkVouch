import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { ConnectTokenStoreAdapter } from "@/lib/integrations/connect/auth/connect-token-store-adapter";
import { createGreenhouseProvider } from "@/lib/integrations/providers/greenhouse/provider";
import { requireEmployerIntegration } from "@/lib/employer/integrations/auth";

/** POST /api/employer/integrations/connect/greenhouse — start OAuth flow */
export async function POST(request: Request) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  try {
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
      redirectUri: callbackUrl,
    });

    if (!result.authorizationUrl) {
      return NextResponse.json({ error: "Failed to generate authorization URL" }, { status: 500 });
    }

    return NextResponse.json({
      connectionId: result.connectionId,
      authorizationUrl: result.authorizationUrl,
      status: result.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start OAuth" },
      { status: 500 }
    );
  }
}
