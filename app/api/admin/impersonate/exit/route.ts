import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";

export const runtime = "nodejs";

/** POST /api/admin/impersonate/exit — clear impersonation_session cookie. Admin-only. */
export async function POST() {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  return NextResponse.json({ ok: true, redirectUrl: "/admin" });
}

/** GET — redirect to /admin after clearing cookie. Admin-only. */
export async function GET(request: Request) {
  const auth = await requireAdminSupabase();
  if (auth instanceof NextResponse) return auth;
  const cookieStore = await cookies();
  cookieStore.delete({ name: "impersonation_session", path: "/" });
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/admin", url.origin));
}
