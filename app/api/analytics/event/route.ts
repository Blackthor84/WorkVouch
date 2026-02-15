/**
 * POST /api/analytics/event — record discrete event (enterprise schema).
 * Links to site_sessions via session_token cookie. No PII in event_metadata.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SESSION_COOKIE = "wv_sid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const event_type = typeof body.event_type === "string" ? body.event_type.trim().slice(0, 256) : (typeof body.event_name === "string" ? body.event_name.trim().slice(0, 256) : null);
    if (!event_type) return NextResponse.json({ ok: false }, { status: 400 });

    const path = typeof body.path === "string" ? body.path.trim().slice(0, 2048) : null;
    const referrer = typeof body.referrer === "string" ? body.referrer.trim().slice(0, 2048) : null;
    const metadata = typeof body.event_metadata === "object" && body.event_metadata !== null
      ? body.event_metadata
      : typeof body.metadata === "object" && body.metadata !== null
        ? body.metadata
        : null;
    const event_metadata = { ...(path && { path }), ...(referrer && { referrer }), ...(metadata && typeof metadata === "object" ? metadata : {}) } as Record<string, unknown>;
    const hasMeta = Object.keys(event_metadata).length > 0 ? event_metadata : null;

    const cookieStore = await cookies();
    const session_token = cookieStore.get(SESSION_COOKIE)?.value?.trim();
    const appEnv = getEnvironmentForServer(req.headers, cookieStore, req.url);
    const is_sandbox = appEnv === "sandbox";

    const supabase = getSupabaseServer();
    let session_id: string | null = null;
    if (session_token) {
      const { data: row } = await supabase.from("site_sessions").select("id").eq("session_token", session_token).maybeSingle();
      session_id = row?.id ?? null;
    }

    const supabaseAuth = await supabaseServer();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const user_id = user?.id ?? null;

    const { error } = await supabase.from("site_events").insert({
      session_id,
      user_id,
      event_type,
      event_metadata: hasMeta ? JSON.parse(JSON.stringify(hasMeta)) : null,
      is_sandbox,
    });

    if (error) {
      console.error("[analytics/event]", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/event]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
