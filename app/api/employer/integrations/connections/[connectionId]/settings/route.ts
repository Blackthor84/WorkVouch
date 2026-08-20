import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { requireConnectionAccess, requireEmployerIntegration } from "@/lib/employer/integrations/auth";

type RouteParams = { params: Promise<{ connectionId: string }> };

/** GET /api/employer/integrations/connections/[connectionId]/settings */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const prefs = (access.connection.metadata?.sync_preferences ?? {}) as Record<string, unknown>;
  return NextResponse.json({ automation: prefs.automation ?? {}, connection: access.connection });
}

/** PATCH /api/employer/integrations/connections/[connectionId]/settings */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireEmployerIntegration();
  if ("error" in auth) return auth.error;

  const { connectionId } = await params;
  const access = await requireConnectionAccess(connectionId, auth.ctx.employerAccountId);
  if ("error" in access) return access.error;

  const body = (await request.json()) as { automation?: Record<string, unknown> };
  const existing = (access.connection.metadata ?? {}) as Record<string, unknown>;
  const syncPreferences = (existing.sync_preferences ?? {}) as Record<string, unknown>;

  const metadata = {
    ...existing,
    sync_preferences: {
      ...syncPreferences,
      automation: { ...(syncPreferences.automation as Record<string, unknown> | undefined), ...body.automation },
    },
  };

  const { error } = await admin
    .from("connect_connections")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("id", connectionId)
    .eq("employer_account_id", auth.ctx.employerAccountId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const updated = await access.runtime.connections.getConnection(connectionId);
  const automation = (updated?.metadata?.sync_preferences as Record<string, unknown> | undefined)?.automation;

  return NextResponse.json({ automation, connection: updated });
}
