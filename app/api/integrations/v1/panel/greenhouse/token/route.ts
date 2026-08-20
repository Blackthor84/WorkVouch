import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { signPanelToken, PANEL_TOKEN_TTL_SECONDS } from "@/lib/integrations/greenhouse/panel/panel-auth";

/** POST /api/integrations/v1/panel/greenhouse/token */
export async function POST(request: Request) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => ({}))) as {
    connectionId?: string;
    externalCandidateId?: string;
  };

  if (!body.connectionId || !body.externalCandidateId) {
    return NextResponse.json(
      { error: "connectionId and externalCandidateId required" },
      { status: 400 }
    );
  }

  const access = await requireConnectionAccess(body.connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const token = await signPanelToken({
    connectionId: body.connectionId,
    employerAccountId: auth.ctx.employerAccountId,
    externalCandidateId: body.externalCandidateId,
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const panelUrl = `${baseUrl}/integrations/greenhouse/panel?candidateId=${encodeURIComponent(body.externalCandidateId)}&connectionId=${encodeURIComponent(body.connectionId)}`;

  return NextResponse.json({
    token,
    expiresInSeconds: PANEL_TOKEN_TTL_SECONDS,
    panelUrl,
    tokenDelivery: "Pass token via X-Panel-Token header when loading the panel iframe",
  });
}
