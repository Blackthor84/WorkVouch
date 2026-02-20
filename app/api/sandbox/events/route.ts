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
}[] = [];

/**
 * GET /api/sandbox/events — admin/superadmin only. Returns newest first. Never null.
 */
export async function GET(req: NextRequest) {
  const guard = await sandboxAdminGuard();
  if (!guard.allowed) return guard.response;

  try {
    const { getSandboxEvents } = await import("@/lib/sandbox/sandboxEvents");
    const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 200);
    const rows = await getSandboxEvents(limit);
    const events = (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      message: r.message,
      actor: r.actor ?? undefined,
      metadata: r.metadata ?? undefined,
      safe_mode: (r.metadata as { safe_mode?: boolean } | undefined)?.safe_mode ?? undefined,
      created_at: r.created_at,
    }));
    return NextResponse.json(events);
  } catch (e) {
    console.error("[sandbox/events]", e);
    return NextResponse.json(EMPTY_EVENTS);
  }
}
