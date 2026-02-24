import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVESTOR_MODE_COOKIE = "wv_investor_mode";

/** POST /api/admin/investor-mode — set or clear investor mode. Body: { enabled: boolean }. Admin-only. */
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
      name: INVESTOR_MODE_COOKIE,
      value: "true",
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 4,
    });
  } else {
    cookieStore.delete({ name: INVESTOR_MODE_COOKIE, path: "/" });
  }

  return NextResponse.json({ ok: true, investorMode: enabled });
}

/** GET /api/admin/investor-mode — return current investor mode. Admin-only. */
export async function GET() {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;

  const cookieStore = await cookies();
  const value = cookieStore.get(INVESTOR_MODE_COOKIE)?.value;
  const investorMode = value === "true";

  return NextResponse.json({ investorMode });
}
