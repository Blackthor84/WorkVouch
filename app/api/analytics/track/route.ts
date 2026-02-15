/**
 * POST /api/analytics/track — analytics event handler.
 * Body: { eventType, userId?, metadata? }. Silent fail (204) when eventType or userId missing so analytics never breaks UX.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = typeof body.eventType === "string" ? body.eventType.trim().slice(0, 256) : null;
    const userId = typeof body.userId === "string" ? body.userId.trim() : null;
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : null;

    if (!eventType) {
      return new NextResponse(null, { status: 204 });
    }

    if (!userId) {
      return new NextResponse(null, { status: 204 });
    }

    const event_metadata = metadata && Object.keys(metadata).length > 0 ? metadata : null;

    const { error } = await supabaseAdmin.from("site_events").insert({
      user_id: userId,
      session_id: null,
      event_type: eventType,
      event_metadata: event_metadata ? JSON.parse(JSON.stringify(event_metadata)) : null,
      is_sandbox: false,
    });

    if (error) {
      console.error("[analytics/track]", error);
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
