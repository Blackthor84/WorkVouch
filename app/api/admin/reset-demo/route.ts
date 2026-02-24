import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import { IMPERSONATION_SIMULATION_COOKIE } from "@/lib/impersonation-simulation/context";
import { IMPERSONATED_USER_ID_COOKIE } from "@/lib/auth/actingUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPERSONATION_SESSION_COOKIE = "impersonation_session";
const DEMO_STATE_COOKIE = "wv_demo";
const INVESTOR_MODE_COOKIE = "wv_investor_mode";

/** POST /api/admin/reset-demo — clear impersonation and demo state. Admin-only. One-click demo reset. */
export async function POST() {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

  const cookieStore = await cookies();
  cookieStore.delete({ name: IMPERSONATION_SESSION_COOKIE, path: "/" });
  cookieStore.delete({ name: IMPERSONATION_SIMULATION_COOKIE, path: "/" });
  cookieStore.delete({ name: IMPERSONATED_USER_ID_COOKIE, path: "/" });
  cookieStore.delete({ name: DEMO_STATE_COOKIE, path: "/" });
  cookieStore.delete({ name: INVESTOR_MODE_COOKIE, path: "/" });

  return NextResponse.json({ ok: true });
}
