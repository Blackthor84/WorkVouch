import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";
import { loadFailedWebhooks } from "@/lib/employer/integrations/service";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/replay — list failures */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const failed = await loadFailedWebhooks(connectionId);
  return NextResponse.json({ failedCount: failed.length, failures: failed });
}

/** POST /api/employer/integrations/connections/[connectionId]/replay — replay failed webhook */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const body = (await request.json()) as { webhookLogId?: string; eventId?: string; mode?: "simulation" | "live" };

  if (body.webhookLogId && body.mode === "live") {
    const result = await access.runtime.webhooks.replayDeadLetter(body.webhookLogId);
    return NextResponse.json({ replayed: 1, results: [result] });
  }

  if (body.eventId) {
    const stored = await access.runtime.eventStore.loadEvent(body.eventId);
    if (!stored || stored.connectionId !== connectionId) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const result = await access.runtime.eventStore.replayStream(stored.aggregateType, stored.aggregateId, {
      dryRun: body.mode !== "live",
    });
    return NextResponse.json({ eventId: body.eventId, mode: body.mode ?? "simulation", result });
  }

  return NextResponse.json({ error: "webhookLogId or eventId required" }, { status: 400 });
}
