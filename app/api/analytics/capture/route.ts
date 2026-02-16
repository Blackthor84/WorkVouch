/**
 * POST /api/analytics/capture — record page view (enterprise schema).
 * Creates/updates site_sessions, inserts site_page_views.
 * SECURITY: Session token from HttpOnly cookie. IP hashed only. DNT respected (no persist if DNT: 1).
 * Fail closed: return 500 if write fails (no silent failure). No PII in stored payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import {
  hashIp,
  getGeoFromHeaders,
  getClientIp,
  getDeviceType,
  getOs,
  getBrowser,
  getTimezone,
  getIsVpn,
} from "@/lib/analytics/privacy";
import { upsertUserLocationFromGeo } from "@/lib/analytics/user-location";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const SESSION_COOKIE = "wv_sid";

export async function POST(req: NextRequest) {
  // GDPR/CCPA: respect Do Not Track — do not persist session or page view when DNT is 1
  const dnt = req.headers.get("DNT") ?? req.headers.get("dnt");
  if (dnt === "1") {
    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  let session_token = cookieStore.get(SESSION_COOKIE)?.value?.trim();
  if (!session_token) {
    session_token = crypto.randomUUID();
  }

  const body = await req.json().catch(() => ({}));
  // path is REQUIRED: prefer client-sent page path, else fallback to request pathname or "/". Canonical contract: non-empty (DB CHECK).
  let path =
    (typeof body.path === "string" ? body.path.trim().slice(0, 2048) : null) ||
    req.nextUrl.pathname ||
    "/";
  if (!path || path.trim() === "") path = "/";
  const referrer = typeof body.referrer === "string" ? body.referrer.trim().slice(0, 2048) : req.headers.get("referer") ?? null;
  const duration_ms = typeof body.duration_ms === "number" && body.duration_ms >= 0 ? Math.round(body.duration_ms) : null;

  const headers = req.headers;
  const userAgent = headers.get("user-agent") ?? null;
  const ip = getClientIp(headers);
  const ip_hash = hashIp(ip || "unknown");
  const geo = getGeoFromHeaders(headers);
  const device_type = getDeviceType(userAgent);
  const os = getOs(userAgent);
  const browser = getBrowser(userAgent);
  const timezone = getTimezone(headers);
  const is_vpn = getIsVpn(headers);
  const appEnv = getEnvironmentForServer(headers, cookieStore, req.url);
  const is_sandbox = appEnv === "sandbox";

  const supabaseAuth = await supabaseServer();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  let user_id: string | null = null;
  let user_role: string | null = null;
  if (user?.id) {
    user_id = user.id;
    const { data: profile } = await supabaseAuth.from("profiles").select("role").eq("id", user.id).maybeSingle();
    user_role = (profile as { role?: string | null } | null)?.role ?? null;
  }
  const is_authenticated = !!user_id;

  const supabase = getSupabaseServer();

  try {
    const { data: existing } = await supabase
      .from("site_sessions")
      .select("id")
      .eq("session_token", session_token)
      .maybeSingle();

    let session_id: string | null = null;

    if (existing?.id) {
      session_id = existing.id;
      await supabase
        .from("site_sessions")
        .update({
          last_seen_at: new Date().toISOString(),
          ...(user_id != null && { user_id, user_role, is_authenticated: true }),
        })
        .eq("id", session_id);
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from("site_sessions")
        .insert({
          session_token,
          user_id: user_id ?? null,
          user_role: user_role ?? null,
          ip_hash,
          user_agent: userAgent ? userAgent.slice(0, 1024) : null,
          device_type: device_type ?? null,
          os: os ?? null,
          browser: browser ?? null,
          country: geo.country,
          region: geo.region,
          city: null, // Privacy: never persist city-level data (heat map is country/state only)
          timezone: timezone ?? null,
          asn: null,
          isp: null,
          is_vpn,
          is_authenticated,
          is_sandbox,
        })
        .select("id")
        .single();
      if (insertErr) {
        console.error("[analytics/capture] site_sessions insert", insertErr);
        return NextResponse.json({ ok: false }, { status: 500 });
      }
      session_id = inserted?.id ?? null;
    }

    const { error: pvError } = await supabase.from("site_page_views").insert({
      session_id,
      user_id: user_id ?? null,
      path, // REQUIRED: page path (from body.path or req.nextUrl.pathname)
      referrer: referrer || null,
      duration_ms,
      is_sandbox,
    });

    if (pvError) {
      console.error("[analytics/capture] site_page_views insert", pvError);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { maybeRecordRapidRefresh } = await import("@/lib/analytics/abuse");
    void maybeRecordRapidRefresh(supabase, session_id, is_sandbox);

    if (user_id && geo?.country) {
      void upsertUserLocationFromGeo(supabase, user_id, geo.country, geo.region ?? null);
    }

    const res = NextResponse.json({ ok: true });
    if (!cookieStore.get(SESSION_COOKIE)?.value) {
      res.cookies.set(SESSION_COOKIE, session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch (e) {
    console.error("[analytics/capture]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
