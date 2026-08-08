import { NextResponse } from "next/server";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";
import { verifyPanelToken } from "@/lib/integrations/greenhouse/panel/panel-auth";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import {
  isConnectDemoAllowed,
  rateLimitIntegrationRoute,
  requireConnectEnabled,
} from "@/lib/integrations/connect/connect-route-guards";

type RouteParams = { params: Promise<{ externalCandidateId: string }> };

/** GET /api/integrations/v1/panel/greenhouse/[externalCandidateId] */
export async function GET(request: Request, { params }: RouteParams) {
  const disabled = requireConnectEnabled();
  if (disabled) return disabled;

  const limited = await rateLimitIntegrationRoute(request, "connect:panel:", 120);
  if (limited) return limited;

  const { externalCandidateId } = await params;
  const url = new URL(request.url);
  const demo = url.searchParams.get("demo") === "1" || url.searchParams.get("demo") === "true";

  if (demo) {
    if (!isConnectDemoAllowed()) {
      return NextResponse.json({ error: "Demo mode disabled in production" }, { status: 403 });
    }
    const { GreenhousePanelService } = await import("@/lib/integrations/greenhouse/panel/panel-service");
    const scenario = url.searchParams.get("scenario") ?? "high";
    const service = new GreenhousePanelService({ runtime: getConnectApiRuntime() });
    const payload = await service.buildPanel({
      externalCandidateId,
      connectionId: "demo",
      employerAccountId: "demo",
      demo: true,
      demoScenario: scenario,
    });
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60", "X-Connect-Demo": "1" },
    });
  }

  const panelToken = request.headers.get("X-Panel-Token") ?? "";
  let connectionId = url.searchParams.get("connectionId") ?? "";
  let employerAccountId = "";

  if (panelToken) {
    const auth = await verifyPanelToken(panelToken);
    if (!auth) {
      return NextResponse.json({ error: "Invalid or expired panel token" }, { status: 401 });
    }
    if (auth.externalCandidateId !== externalCandidateId) {
      return NextResponse.json({ error: "Token candidate mismatch" }, { status: 403 });
    }
    connectionId = auth.connectionId;
    employerAccountId = auth.employerAccountId;
  } else {
    const employerAuth = await requireEmployerIntegration();
    if ("error" in employerAuth) return employerAuth.error;

    employerAccountId = employerAuth.ctx.employerAccountId;
    if (!connectionId) {
      return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    }

    const access = await requireConnectionAccess(connectionId, employerAccountId);
    if ("error" in access) return access.error;
  }

  try {
    const { GreenhousePanelService } = await import("@/lib/integrations/greenhouse/panel/panel-service");
    const service = new GreenhousePanelService({ runtime: getConnectApiRuntime() });
    const payload = await service.buildPanel({
      externalCandidateId,
      connectionId,
      employerAccountId,
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=60",
        "X-Panel-Generated-At": payload.lastUpdated,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load panel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
