/**
 * GET replay session with events. Read-only. Sandbox only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSandboxV2AdminWithRole } from "@/lib/sandbox/adminAuth";
import { getReplaySessionWithEvents } from "@/lib/sandbox/replay/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSandboxV2AdminWithRole();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { session, events } = await getReplaySessionWithEvents(id);
    if (!session) return NextResponse.json({ error: "Replay session not found" }, { status: 404 });
    return NextResponse.json({ success: true, session, events });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    if (msg.includes("Forbidden")) return NextResponse.json({ error: msg }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
