import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACQUISITION_MODE_COOKIE = "wv_acquisition_mode";

/** POST /api/admin/acquisition-mode — set or clear acquisition story mode. Body: { enabled: boolean }. Admin-only. */
export async function POST(req: NextRequest) {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

  let body: { enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const enabled = body.enabled === true;
  const cookieStore = await cookies();

  if (enabled) {
    cookieStore.set({
      name: ACQUISITION_MODE_COOKIE,
      value: "true",
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
    });
  } else {
    cookieStore.delete({ name: ACQUISITION_MODE_COOKIE, path: "/" });
  }

  return NextResponse.json({ ok: true, acquisitionMode: enabled });
}

/** GET /api/admin/acquisition-mode — return current acquisition mode. Admin-only. */
export async function GET() {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

  const cookieStore = await cookies();
  const value = cookieStore.get(ACQUISITION_MODE_COOKIE)?.value;
  const acquisitionMode = value === "true";

  return NextResponse.json({ acquisitionMode });
}
