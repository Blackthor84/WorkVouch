import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { IMPERSONATION_SIMULATION_COOKIE } from "@/lib/impersonation-simulation/context";
import { IMPERSONATED_USER_ID_COOKIE } from "@/lib/auth/actingUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPERSONATION_SESSION_COOKIE = "impersonation_session";

/** POST /api/admin/stop-impersonation — clear impersonation and simulation cookies. Admin-only. */
export async function POST() {
  const authed = await getAuthedUser();
  if (!authed || (authed.role !== "admin" && authed.role !== "superadmin")) {
    return new NextResponse(null, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.delete({ name: IMPERSONATION_SESSION_COOKIE, path: "/" });
  cookieStore.delete({ name: IMPERSONATION_SIMULATION_COOKIE, path: "/" });
  cookieStore.delete({ name: IMPERSONATED_USER_ID_COOKIE, path: "/" });

  return NextResponse.json({ ok: true });
}
