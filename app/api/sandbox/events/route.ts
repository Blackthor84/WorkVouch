import { NextRequest, NextResponse } from "next/server";
import { sandboxAdminGuard } from "@/lib/server/sandboxGuard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Default response. Never null. */
const EMPTY_EVENTS: {
  id: string;
  type: string;
  message: string;
  actor?: string;
  metadata?: object;
  safe_mode?: boolean;
  created_at: string;
  entity_type?: string | null;
  sandbox_id?: string | null;
  scenario_id?: string | null;
  step_id?: string | null;
  before_state?: object | null;
  after_state?: object | null;
}[] = [];

/**
 * GET /api/sandbox/events — admin-only. Returns newest first. Supports filter: scenario_id, type, actor, sandbox_id, limit.
 */
export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const { getSandboxEvents } = await import("@/lib/sandbox/sandboxEvents");
    const sp = req.nextUrl.searchParams;
    const filter = {
      limit: Math.min(Number(sp.get("limit")) || 100, 200),
      scenario_id: sp.get("scenario_id") ?? undefined,
      type: sp.get("type") ?? undefined,
      actor: sp.get("actor") ?? undefined,
      sandbox_id: sp.get("sandbox_id") ?? undefined,
    };
    const rows = await getSandboxEvents(filter);
    const events = (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      message: r.message,
      actor: r.actor ?? undefined,
      metadata: r.metadata ?? undefined,
      safe_mode: (r.metadata as { safe_mode?: boolean } | undefined)?.safe_mode ?? undefined,
      created_at: r.created_at,
      entity_type: r.entity_type ?? undefined,
      sandbox_id: r.sandbox_id ?? undefined,
      scenario_id: r.scenario_id ?? undefined,
      step_id: r.step_id ?? undefined,
      before_state: r.before_state ?? undefined,
      after_state: r.after_state ?? undefined,
    }));
    return NextResponse.json(events);
  } catch (e) {
    console.error("[sandbox/events]", e);
    return NextResponse.json(EMPTY_EVENTS);
  }
}
