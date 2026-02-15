/**
 * POST /api/events — record a discrete analytics event (session from x-session-id header).
 * Body: { event, path }. Writes to site_events. Use from client via logEvent().
 */

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const headersList = await headers();

    const sessionId = headersList.get("x-session-id")?.trim() ?? null;
    if (!sessionId) {
      return new Response("Missing session", { status: 400 });
    }

    const eventType = typeof body.event === "string" ? body.event.trim().slice(0, 256) : null;
    if (!eventType) {
      return new Response("Missing event name", { status: 400 });
    }

    const path = typeof body.path === "string" ? body.path.trim().slice(0, 2048) : null;
    const event_metadata = path ? { path } : null;

    const { error } = await supabaseAdmin
      .from("site_events")
      .insert({
        session_id: sessionId,
        event_type: eventType,
        event_metadata,
        is_sandbox: false,
      });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return new Response("ok");
  } catch (e) {
    console.error("[api/events]", e);
    return new Response("Internal error", { status: 500 });
  }
}
