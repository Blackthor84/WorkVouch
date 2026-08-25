/**
 * POST /api/integrations/v1/import
 * Internal/cron-only Harvest import trigger.
 * Employers should use POST /api/employer/integrations/connections/[connectionId]/import
 */
import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import {
  requireConnectEnabled,
  requireCronSecret,
  rateLimitIntegrationRoute,
} from "@/lib/integrations/connect/connect-route-guards";
import { getConnectApiRuntime } from "@/lib/integrations/connect/connect-api-runtime";

export async function POST(request: Request) {
  const disabled = requireConnectEnabled();
  if (disabled) return disabled;

  const cronAuth = requireCronSecret(request);
  if (cronAuth) return cronAuth;

  const limited = await rateLimitIntegrationRoute(request, "connect:import:", 10);
  if (limited) return limited;

  try {
    const body = (await request.json()) as {
      connectionId?: string;
      employerAccountId?: string;
      maxPages?: number;
    };
    if (!body.connectionId || !body.employerAccountId) {
      return NextResponse.json({ error: "connectionId and employerAccountId required" }, { status: 400 });
    }

    const runtime = getConnectApiRuntime();
    const connection = await runtime.connections.getConnection(body.connectionId);
    if (!connection || connection.employerAccountId !== body.employerAccountId) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    await runtime.recovery.ensureValidToken(body.connectionId).catch(() => null);

    const result = await runtime.harvestImport.importAll({
      connectionId: body.connectionId,
      employerAccountId: body.employerAccountId,
      maxPages: body.maxPages ?? 5,
    });

    const syncSucceeded = result.status !== "failed" && result.syncLogWritten;
    if (syncSucceeded) {
      await admin
        .from("connect_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", body.connectionId);
    }

    return NextResponse.json(result, { status: result.status === "failed" ? 422 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
