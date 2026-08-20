import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { buildProviderCards, listEmployerConnections } from "@/lib/employer/integrations/service";
import { CONNECT_PLATFORM_VERSION } from "@/lib/integrations/connect/version";

/** GET /api/employer/integrations — integration dashboard summary */
export async function GET() {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  try {
    const runtime = getConnectApiRuntime();
    const providers = await buildProviderCards(runtime, auth.ctx.employerAccountId);
    const connections = await listEmployerConnections(runtime, auth.ctx.employerAccountId);
    const lifecycle = runtime.lifecycleObservability.getSnapshot();
    const webhooks = runtime.webhookMetrics.getSnapshot();

    return NextResponse.json({
      employerAccountId: auth.ctx.employerAccountId,
      companyName: auth.ctx.companyName,
      connectVersion: CONNECT_PLATFORM_VERSION,
      providers,
      connections,
      observability: { lifecycle, webhooks },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load integrations" },
      { status: 500 }
    );
  }
}
