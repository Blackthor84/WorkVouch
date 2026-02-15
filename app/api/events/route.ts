/**
 * POST /api/events — analytics event. Fail-soft: never break UX.
 * Never return 400. Missing eventType → 204. Anonymous (no userId) allowed.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const eventType =
    typeof body.eventType === "string"
      ? body.eventType.trim().slice(0, 256)
      : typeof body.event === "string"
        ? body.event.trim().slice(0, 256)
        : null;
  const userId = typeof body.userId === "string" ? body.userId.trim() || null : null;
  const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : null;

  if (!eventType) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const headersList = await headers();
    const sessionId = headersList.get("x-session-id")?.trim() || null;
    const event_metadata =
      metadata && Object.keys(metadata).length > 0 ? JSON.parse(JSON.stringify(metadata)) : null;

    const { error } = await supabaseAdmin.from("site_events").insert({
      session_id: sessionId,
      user_id: userId,
      event_type: eventType,
      event_metadata: event_metadata,
      is_sandbox: false,
    });

    if (error) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
