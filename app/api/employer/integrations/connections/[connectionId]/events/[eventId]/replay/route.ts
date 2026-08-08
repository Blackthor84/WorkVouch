import { NextResponse } from "next/server";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string; eventId: string }> };

/** POST /api/employer/integrations/connections/[connectionId]/events/[eventId]/replay */
export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId, eventId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => ({}))) as { mode?: "simulation" | "dry_run" | "live" };
  const mode = body.mode ?? "simulation";

  const stored = await access.runtime.eventStore.loadEvent(eventId);
  if (!stored || stored.connectionId !== connectionId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let result;
  if (mode === "simulation") {
    const connectRecord = access.runtime.connect.listEvents({ correlationId: stored.correlationId })[0];
    if (connectRecord) {
      result = access.runtime.connect.simulateReplay(connectRecord.id);
    } else {
      result = await access.runtime.eventStore.replayStream(stored.aggregateType, stored.aggregateId, { dryRun: true });
    }
  } else {
    result = await access.runtime.eventStore.replayStream(stored.aggregateType, stored.aggregateId, {
      dryRun: mode !== "live",
    });
  }

  return NextResponse.json({ eventId, mode, result });
}
